import test from 'node:test';
import assert from 'node:assert/strict';
import { HeroExperiment, qualifiedInquiryPayload, type ExperimentClient } from '../src/analytics/hero-experiment.ts';
import { HERO_EXPERIMENT_ID, heroVariants, HERO_VARIANT_IDS, type HeroVariantId } from '../src/config/heroVariants.ts';
import { eligibleHost, getHeroExperimentConfig, hasAnalyticsConsent, CONSENT_MAX_AGE } from '../src/config/heroExperiment.ts';
import { sanitizeEvent, postHogOptions } from '../src/analytics/posthog-client.ts';
import type { CaptureResult } from 'posthog-js';

function fixture(value: boolean | string | undefined, errorsLoading = false) {
  const events: { event: string; properties?: Record<string, unknown> }[] = [];
  let callback: Parameters<ExperimentClient['onFeatureFlags']>[0] | undefined;
  let identity = 'anonymous-browser-id';
  let optedOut = false;
  const client = {
    getFeatureFlag: (_key: string, options?: { send_event?: boolean }) => {
      if (options?.send_event !== false) events.push({ event: '$feature_flag_called', properties: { $feature_flag: HERO_EXPERIMENT_ID, $feature_flag_response: value } });
      return value;
    },
    onFeatureFlags: (fn: typeof callback) => { callback = fn; return () => { callback = undefined; }; },
    reloadFeatureFlags: () => queueMicrotask(() => callback?.([], {}, { errorsLoading })),
    get_distinct_id: () => identity,
    capture: (event: string, properties?: Record<string, unknown>) => { events.push({ event, properties }); },
    has_opted_out_capturing: () => optedOut,
    opt_out_capturing: () => { optedOut = true; },
  } as unknown as ExperimentClient;
  return { client, events, identity: (value: string) => { identity = value; }, flag: (next: typeof value) => { value = next; } };
}
const create = (f: ReturnType<typeof fixture>, allowed = () => true, render: (id: HeroVariantId) => void = () => {}) => new HeroExperiment({ loadClient: async () => f.client, allowed, render, environment: 'development', timeout: 20 });

test('four canonical treatments have distinct requested image paths', () => {
  assert.deepEqual(Object.keys(heroVariants), ['A', 'B', 'C', 'D']);
  assert.equal(new Set(HERO_VARIANT_IDS.map(id => heroVariants[id].imagePath)).size, 4);
  assert.equal(heroVariants.B.headline, 'Senior judgment at the table.');
  assert.equal(heroVariants.D.italic, 'Run your business on them.');
});
test('configuration is off by default and production excludes local hosts', () => {
  assert.equal(getHeroExperimentConfig({}).enabled, false);
  const config = getHeroExperimentConfig({ PUBLIC_HERO_EXPERIMENT_ENABLED: 'true', PUBLIC_POSTHOG_PROJECT_TOKEN: 'phc_mock', PUBLIC_POSTHOG_API_HOST: 'https://posthog.test', PUBLIC_ANALYTICS_ENVIRONMENT: 'production', PUBLIC_POSTHOG_ALLOWED_HOSTS: 'localhost,ramaekersgroup.com' });
  assert.equal(eligibleHost(config, 'localhost'), false);
  assert.equal(eligibleHost(config, 'ramaekersgroup.com'), true);
  assert.equal(getHeroExperimentConfig({ ...config, PUBLIC_HERO_EXPERIMENT_ENABLED: 'true', PUBLIC_POSTHOG_API_HOST: 'http://unsafe.test' }).enabled, false);
});
test('consent must be explicit, unexpired, and parseable', () => {
  const now = Date.now();
  for (const value of [null, 'bad', '{}', JSON.stringify({ choice: 'denied', updatedAt: now }), JSON.stringify({ choice: 'granted', updatedAt: now - CONSENT_MAX_AGE }), JSON.stringify({ choice: 'granted', updatedAt: now + 1 })]) assert.equal(hasAnalyticsConsent(value, now), false);
  assert.equal(hasAnalyticsConsent(JSON.stringify({ choice: 'granted', updatedAt: now }), now), true);
});
test('no consent / preview gate never loads SDK or exposes fallback', async () => {
  let loaded = false;
  const rendered: string[] = [];
  const experiment = new HeroExperiment({ loadClient: async () => { loaded = true; throw Error(); }, allowed: () => false, render: id => rendered.push(id), environment: 'development' });
  await experiment.start();
  assert.deepEqual(rendered, ['A']); assert.equal(loaded, false); assert.equal(experiment.expose(), false);
});
for (const variant of HERO_VARIANT_IDS) test(`${variant}: render before native exposure, one custom page-view exposure`, async () => {
  const f = fixture(variant); const rendered: string[] = []; const experiment = create(f, () => true, id => rendered.push(id));
  await experiment.start(); assert.deepEqual(rendered, [variant]); assert.equal(f.events.length, 0);
  assert.equal(experiment.expose(), true); experiment.expose(); experiment.expose();
  assert.deepEqual(f.events.map(e => e.event), ['$feature_flag_called', 'hero_exposure']);
  assert.equal(f.events[0].properties?.$feature_flag_response, variant);
  assert.equal(experiment.getInquiryAttribution()?.variant_id, variant);
});
for (const invalid of [false, true, 'control', 'E', '', undefined]) test(`safe unexposed fallback for ${String(invalid)}`, async () => {
  const f = fixture(invalid); const rendered: string[] = []; const experiment = create(f, () => true, id => rendered.push(id));
  await experiment.start(); assert.deepEqual(rendered, ['A']); assert.equal(experiment.expose(), false); assert.equal(f.events.length, 0);
});
test('flag network errors and SDK initialization failures preserve homepage', async () => {
  const f = fixture('C', true); const rendered: string[] = []; await create(f, () => true, id => rendered.push(id)).start(); assert.deepEqual(rendered, ['A']); assert.equal(f.events.length, 0);
  const failed = new HeroExperiment({ loadClient: async () => { throw Error('offline'); }, allowed: () => true, render: id => rendered.push(id), environment: 'development' }); await failed.start(); assert.equal(rendered.at(-1), 'A');
});
test('timeout cannot change fallback later or generate exposure', async () => {
  const f = fixture('D'); const rendered: string[] = []; let resolve!: (client: ExperimentClient) => void;
  const experiment = new HeroExperiment({ loadClient: () => new Promise(done => { resolve = done; }), allowed: () => true, render: id => rendered.push(id), environment: 'development', timeout: 5 });
  await experiment.start(); resolve(f.client); await new Promise(done => setTimeout(done, 10)); assert.deepEqual(rendered, ['A']); assert.equal(experiment.expose(), false); assert.equal(f.events.length, 0);
});
test('consent revocation stops all events and clears inquiry attribution', async () => {
  const f = fixture('B'); let allowed = true; const experiment = create(f, () => allowed); await experiment.start(); experiment.expose(); allowed = false; experiment.stop();
  assert.equal(experiment.interaction('hero_secondary_cta_click', 'hero_secondary'), false); assert.equal(experiment.getInquiryAttribution(), null); assert.equal(f.events.length, 2);
});
test('restarting after an exposure cannot count the same document twice', async () => {
  const f = fixture('B'); const rendered: string[] = []; const experiment = create(f, () => true, id => rendered.push(id));
  await experiment.start(); experiment.expose(); experiment.stop(); await experiment.start();
  assert.equal(experiment.expose(), false); assert.equal(f.events.filter(e => e.event === 'hero_exposure').length, 1); assert.equal(rendered.at(-1), 'A');
});
test('identity or assignment changes stop stale conversion attribution', async () => {
  for (const change of ['identity', 'flag']) {
    const f = fixture('B'); const experiment = create(f); await experiment.start(); experiment.expose();
    if (change === 'identity') f.identity('different-browser'); else f.flag('D');
    assert.equal(experiment.getInquiryAttribution(), null); assert.equal(experiment.interaction('hero_primary_cta_click', 'hero_primary'), false); assert.equal(f.events.length, 2);
  }
});
test('assignment changes before exposure emit neither native nor custom exposure', async () => {
  const f = fixture('B'); const experiment = create(f);
  await experiment.start(); f.flag('D');
  assert.equal(experiment.expose(), false);
  assert.deepEqual(f.events, []);
  assert.equal(experiment.getInquiryAttribution(), null);
});
test('assignment is rechecked without tracking immediately before native exposure', async () => {
  const f = fixture('B'); const experiment = create(f);
  await experiment.start();
  const getFlag = f.client.getFeatureFlag.bind(f.client);
  let reads = 0;
  f.client.getFeatureFlag = (key, options) => {
    // Simulate a changed response after the initial current-assignment guard.
    if (++reads === 2) f.flag('D');
    return getFlag(key, options);
  };
  assert.equal(experiment.expose(), false);
  assert.deepEqual(f.events, []);
  assert.equal(experiment.getInquiryAttribution(), null);
});
test('clicks, scroll milestones, service views, and confirmed submissions deduplicate correctly', async () => {
  const f = fixture('D'); const experiment = create(f); await experiment.start(); experiment.expose();
  for (const milestone of [25, 50, 75, 90] as const) { experiment.interaction('scroll_depth_reached', 'scroll', milestone); experiment.interaction('scroll_depth_reached', 'scroll', milestone); }
  experiment.interaction('hero_primary_cta_click', 'hero_primary'); experiment.interaction('hero_secondary_cta_click', 'hero_secondary'); experiment.interaction('methodology_interaction', 'approach_navigation');
  experiment.serviceViewed(0); experiment.serviceViewed(0); experiment.serviceViewed(1);
  assert.equal(experiment.contactSubmitted('email@example.com'), false);
  const submission = 'b8f04208-52e7-4c5a-bb09-6713e2d70e07'; assert.equal(experiment.contactSubmitted(submission), true); assert.equal(experiment.contactSubmitted(submission), false);
  assert.equal(f.events.filter(e => e.event === 'scroll_depth_reached').length, 4); assert.equal(f.events.filter(e => e.event === 'service_interaction').length, 2);
  assert.ok(f.events.filter(e => e.event !== '$feature_flag_called').every(e => e.properties?.variant_id === 'D' && e.properties?.page_path === '/'));
});
test('qualification is an explicit future CRM payload, not a submission side effect', async () => {
  const f = fixture('B'); const experiment = create(f); await experiment.start(); experiment.expose();
  const attribution = experiment.getInquiryAttribution()!;
  const result = qualifiedInquiryPayload({ attribution, qualificationEventId: 'd4fce726-cb47-46d3-a8af-22ef540c84d8', criteriaVersion: 1, qualified: true });
  assert.equal(result?.distinct_id, attribution.distinct_id); assert.equal(result?.properties.variant_id, 'B'); assert.equal(result?.event, 'qualified_inquiry'); assert.equal(f.events.filter(e => e.event === 'qualified_inquiry').length, 0);
});
test('SDK configuration is manual capture only, with replay and remote scripts disabled', () => {
  const options = postHogOptions(getHeroExperimentConfig({}));
  assert.equal(options.autocapture, false); assert.equal(options.capture_pageview, false); assert.equal(options.disable_session_recording, true); assert.equal(options.disable_external_dependency_loading, true);
});
test('event sanitizer rejects unexpected events and removes URLs, input, and contact information', () => {
  const event = { event: 'hero_exposure', properties: { experiment_id: HERO_EXPERIMENT_ID, variant_id: 'B', email: 'private@example.com', $current_url: 'https://site/?email=private', form_value: 'sensitive', $referrer: 'private', distinct_id: 'opaque-id' } } as unknown as CaptureResult;
  const clean = sanitizeEvent(event)!; assert.equal(clean.properties.email, undefined); assert.equal(clean.properties.form_value, undefined); assert.equal(clean.properties.$current_url, undefined); assert.equal(clean.properties.$ip, '0.0.0.0'); assert.equal(clean.properties.variant_id, 'B');
  assert.equal(sanitizeEvent({ ...event, event: '$autocapture' }), null);
});

test('hero images: every variant needs AVIF and WebP at each width, and the smallest covering width is chosen', async () => {
  const { heroImageFiles, heroImageWidth, heroImageSet, HERO_IMAGE_WIDTHS } = await import('../src/config/heroVariants.ts');
  const { existsSync } = await import('node:fs');
  for (const id of HERO_VARIANT_IDS) {
    const files = heroImageFiles(heroVariants[id].imagePath);
    assert.equal(files.length, HERO_IMAGE_WIDTHS.length * 2);
    for (const file of files) assert.ok(existsSync(`public${file}`), `missing ${file}`);
  }
  assert.equal(heroImageWidth(390, 3), 1536);
  assert.equal(heroImageWidth(390, 2), 960);
  assert.equal(heroImageWidth(1440, 1), 1536);
  assert.equal(heroImageWidth(1440, 2), 2048);
  assert.equal(heroImageWidth(4000, 2), 2048);
  assert.match(heroImageSet('/images/heroes/clarity', 960), /^image-set\(url\("\/images\/heroes\/clarity-960\.avif"\) type\("image\/avif"\), url\("\/images\/heroes\/clarity-960\.webp"\) type\("image\/webp"\)\)$/);
});
