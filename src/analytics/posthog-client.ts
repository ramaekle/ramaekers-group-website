import type { PostHogConfig, CaptureResult } from 'posthog-js';
import type { HeroExperimentConfig } from '../config/heroExperiment.ts';
import { HERO_EXPERIMENT_ID } from '../config/heroVariants.ts';

const allowedEvents = new Set(['$feature_flag_called', 'hero_exposure', 'hero_primary_cta_click', 'hero_secondary_cta_click', 'scroll_depth_reached', 'service_interaction', 'methodology_interaction', 'contact_form_submitted', 'qualified_inquiry']);
const properties = new Set(['token', 'distinct_id', '$device_id', '$session_id', '$window_id', '$lib', '$lib_version', '$process_person_profile', '$feature_flag', '$feature_flag_response', '$feature_flag_request_id', '$feature_flag_evaluated_at', '$feature_flag_id', '$feature_flag_version', '$feature_flag_has_experiment', `$feature/${HERO_EXPERIMENT_ID}`, 'experiment_id', 'variant_id', 'page_path', 'event_source', 'environment', 'scroll_percentage', 'service_index', 'submission_id', 'qualification_event_id', 'criteria_version']);
export function sanitizeEvent(event: CaptureResult | null): CaptureResult | null {
  if (!event || !allowedEvents.has(event.event)) return null;
  if (event.event === '$feature_flag_called' && event.properties.$feature_flag !== HERO_EXPERIMENT_ID) return null;
  event.properties = Object.fromEntries(Object.entries(event.properties).filter(([key]) => properties.has(key)));
  delete event.$set;
  delete event.$set_once;
  // No IP-based location enrichment, query strings, referrers, or form values.
  event.properties.$ip = '0.0.0.0';
  event.properties.$geoip_disable = true;
  return event;
}
export function postHogOptions(config: HeroExperimentConfig): Partial<PostHogConfig> {
  return {
    api_host: config.host,
    defaults: '2026-08-30',
    persistence: 'localStorage+cookie', cross_subdomain_cookie: false,
    opt_out_capturing_by_default: true, opt_out_persistence_by_default: true,
    capture_pageview: false, capture_pageleave: false, autocapture: false,
    disable_session_recording: true, disable_surveys: true, disable_web_experiments: true,
    disable_conversations: true, disable_product_tours: true,
    disable_external_dependency_loading: true, capture_performance: false,
    capture_dead_clicks: false, enable_heatmaps: false,
    person_profiles: 'never', save_referrer: false, save_campaign_params: false,
    respect_dnt: true, mask_all_text: true, mask_all_element_attributes: true,
    advanced_disable_feature_flags_on_first_load: true,
    advanced_feature_flags_dedup_per_session: true,
    flag_keys: [HERO_EXPERIMENT_ID], feature_flag_request_timeout_ms: 3000,
    remote_config_refresh_interval_ms: 0,
    before_send: sanitizeEvent,
    get_current_url: () => `${location.origin}${location.pathname}`,
  };
}
export async function createPostHogClient(config: HeroExperimentConfig, allowed: () => boolean) {
  // Neither SDK download nor initialization happens before explicit consent.
  const { default: posthog } = await import('posthog-js/no-external');
  if (!allowed()) throw new Error('Analytics not permitted');
  const client = posthog.init(config.token, postHogOptions(config), 'trgHero');
  if (!client) throw new Error('PostHog unavailable');
  client.opt_in_capturing({ captureEventName: false });
  return client;
}
