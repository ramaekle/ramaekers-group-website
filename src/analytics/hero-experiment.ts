import { HERO_EXPERIMENT_ID, isHeroVariant, type HeroVariantId } from '../config/heroVariants.ts';
import { ASSIGNMENT_TIMEOUT_MS } from '../config/heroExperiment.ts';
import type { PostHog } from 'posthog-js';

export type ExperimentClient = Pick<PostHog, 'getFeatureFlag' | 'onFeatureFlags' | 'reloadFeatureFlags' | 'get_distinct_id' | 'capture' | 'has_opted_out_capturing' | 'opt_out_capturing'>;
export type InteractionEvent = 'hero_primary_cta_click' | 'hero_secondary_cta_click' | 'scroll_depth_reached' | 'service_interaction' | 'methodology_interaction';
export interface InquiryAttribution {
  experiment_id: typeof HERO_EXPERIMENT_ID;
  variant_id: HeroVariantId;
  distinct_id: string;
  exposed_at: string;
}
export interface ExperimentDependencies {
  loadClient: () => Promise<ExperimentClient>;
  render: (id: HeroVariantId) => void;
  allowed: () => boolean;
  environment: 'development' | 'production';
  timeout?: number;
}

/** Page-memory attribution only. Identity and assignment persistence belong to PostHog. */
export class HeroExperiment {
  private client?: ExperimentClient;
  private run = 0;
  private attribution: Readonly<InquiryAttribution> | null = null;
  private assigned: HeroVariantId | null = null;
  private assignedIdentity = '';
  private once = new Set<string>();
  private exposedOnce = false;
  private stopFlags?: () => void;
  private deps: ExperimentDependencies;
  constructor(deps: ExperimentDependencies) { this.deps = deps; }

  async start(): Promise<void> {
    const run = ++this.run;
    this.attribution = null;
    this.assigned = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (this.exposedOnce) { this.deps.render('A'); return; }
      if (!this.deps.allowed()) { this.deps.render('A'); return; }
      const result = await Promise.race([
        (async () => {
          const client = await this.deps.loadClient();
          if (run !== this.run || !this.deps.allowed()) return null;
          this.client = client;
          if (client.has_opted_out_capturing()) return null;
          return new Promise<HeroVariantId | null>(resolve => {
            this.stopFlags = client.onFeatureFlags((_flags, _values, context) => {
              if (run !== this.run || !this.deps.allowed()) { resolve(null); return; }
              if (context?.errorsLoading) { resolve(null); return; }
              // Do not emit native exposure while deciding what to display.
              const value = client.getFeatureFlag(HERO_EXPERIMENT_ID, { send_event: false, fresh: true });
              if (value !== undefined) resolve(isHeroVariant(value) ? value : null);
            });
            client.reloadFeatureFlags();
          });
        })(),
        new Promise<null>(resolve => { timer = setTimeout(() => resolve(null), this.deps.timeout ?? ASSIGNMENT_TIMEOUT_MS); }),
      ]);
      if (run !== this.run) return;
      this.stopFlags?.();
      if (!result || !this.deps.allowed() || !this.client) { this.deps.render('A'); return; }
      this.assigned = result;
      this.assignedIdentity = this.client.get_distinct_id();
      this.deps.render(result);
    } catch {
      if (run === this.run) this.deps.render('A');
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /** Called only once the selected hero has painted and intersects the viewport. */
  expose(): boolean {
    if (!this.current() || !this.assigned || !this.client) return false;
    if (this.attribution) return true;
    if (this.exposedOnce) return false;
    // Revalidate without emitting anything before requesting the native exposure.
    const response = this.client.getFeatureFlag(HERO_EXPERIMENT_ID, { send_event: false, fresh: true });
    if (response !== this.assigned) return false;
    // The documented SDK call emits $feature_flag_called, separately from our custom event.
    this.client.getFeatureFlag(HERO_EXPERIMENT_ID, { send_event: true, fresh: true });
    this.attribution = Object.freeze({ experiment_id: HERO_EXPERIMENT_ID, variant_id: this.assigned, distinct_id: this.assignedIdentity, exposed_at: new Date().toISOString() });
    this.exposedOnce = true;
    this.capture('hero_exposure', 'hero_visible');
    return true;
  }

  private current(): boolean {
    try {
      return !!this.client && !!this.assigned && this.deps.allowed() && !this.client.has_opted_out_capturing()
        && this.client.get_distinct_id() === this.assignedIdentity
        && this.client.getFeatureFlag(HERO_EXPERIMENT_ID, { send_event: false, fresh: true }) === this.assigned;
    } catch { return false; }
  }
  private capture(event: string, source: string, extra: Record<string, string | number> = {}): boolean {
    if (!this.attribution || !this.current()) return false;
    try {
      this.client!.capture(event, { experiment_id: HERO_EXPERIMENT_ID, variant_id: this.attribution.variant_id, page_path: '/', event_source: source, environment: this.deps.environment, [`$feature/${HERO_EXPERIMENT_ID}`]: this.attribution.variant_id, ...extra });
      return true;
    } catch { return false; }
  }
  interaction(event: InteractionEvent, source: string, percentage?: 25 | 50 | 75 | 90): boolean {
    if (event === 'scroll_depth_reached') {
      if (!percentage || this.once.has(`scroll:${percentage}`)) return false;
      if (this.capture(event, 'scroll', { scroll_percentage: percentage })) { this.once.add(`scroll:${percentage}`); return true; }
      return false;
    }
    // Source values come from fixed UI locations, never text or user input.
    return this.capture(event, source);
  }
  serviceViewed(index: number): boolean {
    if (![0, 1, 2].includes(index) || this.once.has(`service:${index}`)) return false;
    if (this.capture('service_interaction', 'service_view', { service_index: index })) { this.once.add(`service:${index}`); return true; }
    return false;
  }
  getInquiryAttribution(): Readonly<InquiryAttribution> | null {
    return this.current() ? this.attribution : null;
  }
  /** Future contact workflow calls this only after a verified successful submission. */
  contactSubmitted(submissionId: string): boolean {
    if (!isOpaqueId(submissionId) || this.once.has(`submission:${submissionId}`)) return false;
    if (this.capture('contact_form_submitted', 'contact_success', { submission_id: submissionId })) { this.once.add(`submission:${submissionId}`); return true; }
    return false;
  }
  stop(): void {
    this.run++;
    this.stopFlags?.();
    this.attribution = null;
    this.assigned = null;
    try { this.client?.opt_out_capturing(); } catch { /* Homepage remains usable. */ }
    this.deps.render('A');
  }
}
export function isOpaqueId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
/** Server/CRM contract only. No backend or qualification workflow is invented here. */
export function qualifiedInquiryPayload(input: {
  attribution: InquiryAttribution;
  qualificationEventId: string;
  criteriaVersion: number;
  qualified: true;
}) {
  if (input.qualified !== true || !isOpaqueId(input.qualificationEventId) || !Number.isInteger(input.criteriaVersion) || input.criteriaVersion < 1
    || input.attribution.experiment_id !== HERO_EXPERIMENT_ID || !isHeroVariant(input.attribution.variant_id) || !input.attribution.distinct_id || !Number.isFinite(Date.parse(input.attribution.exposed_at))) return null;
  return { event: 'qualified_inquiry' as const, distinct_id: input.attribution.distinct_id,
    properties: { experiment_id: HERO_EXPERIMENT_ID, variant_id: input.attribution.variant_id, page_path: '/', event_source: 'crm_qualification', qualification_event_id: input.qualificationEventId, criteria_version: input.criteriaVersion, [`$feature/${HERO_EXPERIMENT_ID}`]: input.attribution.variant_id } };
}
