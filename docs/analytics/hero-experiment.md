# TRG homepage hero experiment — Round 1

Status: **configuration-ready, disabled, not live**. No PostHog project has been
created, accessed, configured, or activated by this implementation. Owner approval
is required before production activation. Missing photographs and the contact
workflow are release dependencies.

## Implementation and behavior

`src/config/heroVariants.ts` is the single copy source for treatments A–D.
`src/sections/home/Hero.astro` renders A as accessible static HTML; its small boot
script prevents a returning participant or developer preview from flashing A
before resolution. `src/scripts/home-hero-experiment.ts` updates that same H1,
paragraph, and selected photo without changing any other homepage section.

Each headline uses one H1 with an inline regular span and an italic `em` in the
existing Manrope family. The supplied Manrope file has upright faces only, so
italic is the browser's synthesized slant of Manrope, not a new font. There is
no forced line break between clauses. Shared responsive minimum heights reserve
room for the longest treatment. The shell can expand with enlarged user text.

With no JavaScript, A remains readable and tracking stays off. With no consent,
configuration, or eligible host, A is deterministic and not an experiment
exposure. An SDK/import error, timeout, unexpected flag, or inactive flag also
produces untracked A. Late callbacks cannot replace a timed-out fallback.
Resolution has a four-second budget once the application module starts. The
4.5-second inline safety watchdog reveals A while the module is delayed or fails
to load; it does not prevent a subsequently loaded module from enrolling an
eligible consenting visitor. Actual assignment is never randomized
in application code or independently persisted.

## Project and environment setup

1. Create distinct **development** and **production** PostHog projects. Copy each
   project's **public project token** and regional ingestion host from its settings.
   Public project tokens are browser-visible by design; private/personal API keys
   must never be placed in Astro `PUBLIC_` variables.
2. Copy `.env.example` into an ignored `.env.development` for local setup. Use the
   development project only for local event testing. The ingestion host must be an
   HTTPS origin, such as `https://us.i.posthog.com` or `https://eu.i.posthog.com`.
3. Set `PUBLIC_POSTHOG_PROJECT_TOKEN`, `PUBLIC_POSTHOG_API_HOST`, and
   `PUBLIC_ANALYTICS_ENVIRONMENT=development`. Explicitly allow the preview hostname
   with `PUBLIC_POSTHOG_ALLOWED_HOSTS=localhost,127.0.0.1`. Leave
   `PUBLIC_HERO_EXPERIMENT_ENABLED=false` until development verification is intended.
4. For a separately approved production build, use the production token,
   `PUBLIC_ANALYTICS_ENVIRONMENT=production`, and
   `PUBLIC_POSTHOG_ALLOWED_HOSTS=ramaekersgroup.com,www.ramaekersgroup.com`.
   Production mode refuses local/staging hosts even if accidentally allowlisted.
5. Astro public variables are captured at build/start time. Restart the dev server
   after local configuration changes; rebuild before reviewing changed deployment
   configuration. This task does not deploy or activate production.

The SDK is `posthog-js` 1.450.0 (locked in package-lock.json), dynamically loaded
only after explicit consent and eligibility. The `no-external` entry point and
configuration disable replay, remote scripts, autocapture, pageviews/pageleaves,
surveys, product tours, conversations, heatmaps, performance capture, and campaign
or referrer storage. Only this experiment's flag is requested. Native web
experiments that rewrite the DOM are disabled; our implementation uses native
multivariate feature flags and Experiments reporting instead.

In PostHog project settings, enable **Discard IP data**, review geography handling,
and define retention/access controls before production. Outgoing events strip
URL/query/referrer/form properties, set `$ip` to `0.0.0.0`, and disable geolocation
enrichment. Network requests necessarily reach the ingestion service; application
filtering does not control the provider's access logs. Anonymous browser identifiers
are retained only after consent. This is a technical consent implementation;
TRG must approve the privacy wording, retention, consent policy, and any required
privacy notice before activation. No privacy-policy URL has been invented.
The SDK may retain the current URL in its local session metadata after consent;
the outgoing-event allowlist removes that metadata, including query strings.
Do not put sensitive business information in site URLs.

## Native flag and experiment setup

Create a **multivariate feature flag** with key `trg-home-hero-v1`:

| Key | Treatment | Eligible traffic |
| --- | --- | --- |
| A | Operations first | 25% |
| B | Principal-led | 25% |
| C | Under pressure | 25% |
| D | Clarity to decisions | 25% |

Set the rollout percentage for the approved eligible population separately from
these within-population splits. Add internal/test exclusions before launch.
Create a draft experiment named **TRG Homepage Hero — Round 1**, link the flag,
and use **A as the baseline**. PostHog permits an existing multivariate flag with
no variant named `control`; A is first in this configuration. Do not rename the
approved A/B/C/D keys to control/test. Keep the flag inactive until staging has
been verified and production activation is approved.

Use PostHog's default native exposure event `$feature_flag_called` with this flag
key. During resolution, the application calls `getFeatureFlag(key, {
send_event: false, fresh: true })`. After the assigned text is painted, visible,
and intersects the viewport, it calls the same supported API with
`send_event: true`. This generates the native exposure. The additional custom
`hero_exposure` is for diagnostic dashboards; it is **not** the native exposure
mechanism and should not be added as another inclusion event. Session-scoped SDK
native exposure deduplication is enabled for returning visitors.

Only valid A/B/C/D assignments may expose. Assigned A counts; unassigned fallback
A does not. All treatment assignments use PostHog's persisted anonymous identity
and feature-flag mechanism. Storage removal, another device, a changed distribution,
or a future identity merge can change assignment; these are platform/identity
boundaries, not another randomizer. Keep distribution fixed while evaluating the
round. Do not add another persistent variant cookie or localStorage entry.

The displayed assignment is frozen for the document. If SDK identity/flag state
changes afterward, further metrics and inquiry attribution are suppressed rather
than attached to a different treatment. Subsequent page loads re-evaluate normally.

## Consent and internal traffic

- No SDK import, SDK storage, network tracking, or feature-flag request before
  consent. Unknown, denied, expired, unavailable storage, DNT, and GPC produce A.
- When configuration is enabled for the hostname, **Analytics choices** provides
  equally accessible accept/reject controls. Consent records contain only the
  choice and timestamp, expire after one year, and are separate from assignment.
- Accepting resolves the flag in a loading shell. Rejecting/revoking opts out of
  SDK capturing/persistence, clears the in-memory attribution, and restores A.
  Cross-tab revocation is respected; a cross-tab acceptance waits for reload.
  Re-acceptance after an already-counted exposure also waits for the next document
  before enrollment, preventing a second page-view exposure after identity reset.
- Without localStorage, an explicit choice lasts for this document only; stable
  across-visit assignment cannot be guaranteed when browser storage is blocked.
- Use separate project tokens and environment properties. In production, exclude
  staff/test accounts or an approved internal cohort via flag conditions and the
  experiment's **Filter test accounts** setting. This application has no staff
  authentication and cannot reliably infer employee identity from a browser.
- Reviewers should use preview URLs, not enroll in the production experiment.

## Developer previews

- `/?hero=A`
- `/?hero=B`
- `/?hero=C`
- `/?hero=D`

Any `hero` query parameter suppresses analytics for the whole page, even with
stored consent and real credentials. Invalid values show A as a labeled preview.
Previews do not initialize the SDK, write assignment/consent, expose participants,
or emit engagement/conversion events. A visible preview badge identifies the
variant and missing photograph. JavaScript is required to select previews; static
no-JavaScript access intentionally remains the deterministic A fallback.

## Image assets

All four final files are currently missing:

- `public/images/heroes/operations.webp`
- `public/images/heroes/principal-led.webp`
- `public/images/heroes/under-pressure.webp`
- `public/images/heroes/clarity.webp`

No stock photographs were downloaded or relabeled. The prior Phase 2A original
and optimized photographs are retained but not reused across the four treatments.
The build checks asset availability; absent files have no request or broken image,
just the approved navy surface. Only the displayed treatment's available image
is requested. Focal-point values are provisional until the final photos arrive.
Add four authorized, optimized, distinct photographs, inspect focal points at all
four viewports, and rebuild before activation. Keep unmodified originals.

## Event contract

Custom events contain `experiment_id=trg-home-hero-v1`, `variant_id`,
`page_path=/`, a fixed `event_source`, and `environment`. They retain the native
PostHog visitor ID. The property sanitizer removes arbitrary metadata, user text,
query strings, referrers, and form values. No email, phone, company, financial
information, or free-text qualification notes are accepted.

| Event | Trigger and status |
| --- | --- |
| `hero_exposure` | Once per displayed, visible, assigned hero per document; separate from native exposure. |
| `hero_primary_cta_click` | Enabled primary hero action only. Currently blocked by the missing verified contact destination. |
| `hero_secondary_cta_click` | Actual hero approach-link click. |
| `scroll_depth_reached` | 25/50/75/90% of scrollable page distance, once each after exposure. A page without scrollable distance records none. |
| `service_interaction` | Each of the three existing service articles entering at least 50% view once (`service_view`); actual future service links use `service_action`. No click is invented for plain text. |
| `methodology_interaction` | Actual navigation to the approach anchor; disabled unpublished methodology preview emits nothing. |
| `contact_form_submitted` | Future verified contact-success hook only; not wired to a nonexistent form. UUID submission receipt deduplicates within the document. |
| `qualified_inquiry` | Future server/CRM qualification contract only; no browser emission and no endpoint invented. |

The contact and qualification events are intentionally not emitted by current UI.
The supported attribution interface is `window.trgInquiry.getInquiryAttribution()`
and `window.trgInquiry.contactSubmitted(submissionReceiptUuid)`. It is absent in
preview and returns null/false without a current consenting experiment exposure.
The getter returns an immutable snapshot with original `experiment_id`,
`variant_id`, `distinct_id`, and `exposed_at`; it is **not** persisted separately
from PostHog. Read it when a future contact begins, and pass it with a successful
inquiry only when consent and that workflow permit. Do not call submission hooks
on an attempted submit or client-only validation success.

A future authenticated backend must validate consent/provenance, retain that
original snapshot with the inquiry, and avoid reassigning it later. It should use
server-side idempotency on its opaque receipt/event IDs. Never trust browser
attribution as authorization or qualification evidence. Do not identify the
PostHog visitor with an email address; use the original opaque `distinct_id` when
sending a supported server capture. The `qualifiedInquiryPayload` helper in
`src/analytics/hero-experiment.ts` defines the future event shape without making a
network call. The CRM must supply an opaque UUID, a versioned qualification
criteria ID, and a genuinely qualified decision. TRG still needs to define those
criteria. A successful form submission is not itself a qualified business lead.

## Reporting and dashboard

Recommend **TRG | Homepage Conversion Command** in PostHog. Use **unique exposed
visitors**, not raw event counts, as the denominator. Build these views:

| Area | Specification |
| --- | --- |
| Overview | Unique exposed visitors; percentage of exposed visitors with a hero CTA click, confirmed submission, and qualified inquiry. |
| Variant comparison | Exposure visitors grouped by native flag response; unique-visitor CTA, confirmed contact, and qualified-inquiry conversions by treatment. |
| Engagement | Unique visitors reaching each scroll milestone; service-view/action and approach-navigation rates. |
| Conversion funnel | Native hero exposure → hero CTA clicked → contact initiated (only when measurable) → confirmed form submitted → genuine qualified inquiry. |

Use the native experiment's **qualified inquiry conversion** as the primary
metric once its integration is verified. Clicks, confirmed submissions, scroll,
and service/methodology engagement are secondary diagnostics. Until a real
qualification pipeline exists, the primary decision metric is unavailable; do
not declare a winner using the available click data instead.

Propose a **30-day exposure-to-qualified-inquiry window**, subject to TRG approval
and its observed sales cycle; use a consistent seven-day window for supporting
on-site CTA/submission funnels. Record the final window and minimum duration
before launch. Include conversion time after acquisition stops. Use PostHog's
native statistical reporting, SRM checks, and multiple-exposure handling; retain
its recommended exclusion of visitors seen in multiple variants. No independent
significance calculator is implemented.

This changes both copy and photography: it tests the **whole hero combination**,
not the isolated contribution of either element. Do not select a winner from raw
click counts, or repeatedly stop/restart on early fluctuations. Predefine the
primary metric, runtime, sample-size requirements, and decision policy.

## Verification and activation checklist

Run `npm run test:hero`, `npm run check`, and `npm run build`. Review all four
previews at 375/430/768/1440px. In the development project, verify native
`$feature_flag_called` first, then one `hero_exposure`; refresh and verify stable
`distinct_id` and assignment. Check CTA/scroll/service events, accept/reject,
revocation, unknown flags, offline/timeout fallback, query-string stripping, and
preview exclusion. Confirm A fallbacks have no native experiment exposure.

In PostHog's activity feed, confirm the flag key and response, diagnostic event
properties, environment, session replay disabled, and absence of input/URL data.
Inspect the draft experiment for exposure distributions. None of these app-level
mocks proves a real project token, ingestion, flag targeting, or dashboard setup.
Before launching, supply all photographs, confirm contact destinations, implement
and verify the qualification pipeline, exclude internal traffic, review consent,
and obtain owner approval. Then activate the experiment and flag together using
PostHog's UI; production enrollment also requires an approved enabled build.

## Rollback

Turn off the feature flag/experiment in PostHog to return new page loads to
untracked A. Existing documents intentionally keep their displayed treatment;
identity/flag mismatch stops further metrics. For a complete analytics rollback,
set `PUBLIC_HERO_EXPERIMENT_ENABLED=false` and rebuild through the approved
release process. No SDK is then initialized on new loads, regardless of stored
consent. Preview URLs continue to work. Preserve experiment results and record the
reason/time; do not silently change splits or recycle this flag for a new round.

## Official API references checked

- [JavaScript SDK reference](https://posthog.com/docs/references/posthog-js):
  `getFeatureFlag`, `send_event`, `fresh`, `onFeatureFlags`, and opt-out APIs.
- [Adding experiment code](https://posthog.com/docs/experiments/adding-experiment-code).
- [Native experiment exposures](https://posthog.com/docs/experiments/exposures).
- [Experiment setup](https://posthog.com/docs/experiments/creating-an-experiment).
- [SDK persistence](https://posthog.com/docs/libraries/js/persistence).
- [SDK configuration](https://posthog.com/docs/libraries/js/config).
- [Controlling data collection](https://posthog.com/docs/privacy/data-collection).

Browser and logic-test results are reported separately at completion. Live project
verification remains pending; configuration-ready does not mean live.

## Reproducing the mocked SDK browser test

The optional `tests/hero-sdk-browser.mjs` uses an available Playwright installation
without adding a browser dependency to the website. It intercepts **all**
`https://posthog.test` requests, returns deterministic mock flag responses, and
inspects the actual SDK's native and custom event requests. It refuses a build
with a token other than the literal fake token below. No live PostHog project or
credentials are used. Browser automation signals are masked only in this test
because the SDK excludes bots; production bot filtering stays enabled.

Build a separate temporary artifact:

```sh
PUBLIC_HERO_EXPERIMENT_ENABLED=true \
PUBLIC_POSTHOG_PROJECT_TOKEN=phc_trg_mock_no_real_credentials \
PUBLIC_POSTHOG_API_HOST=https://posthog.test \
PUBLIC_ANALYTICS_ENVIRONMENT=development \
PUBLIC_POSTHOG_ALLOWED_HOSTS=localhost \
npm run build -- --outDir /private/tmp/trg-experiment-test-dist
```

Serve it temporarily on localhost:4322 (not a second development server):

```sh
python3 -m http.server 4322 --bind 127.0.0.1 --directory /private/tmp/trg-experiment-test-dist
```

With Playwright already available, run `node tests/hero-sdk-browser.mjs`.
Alternatively, set `PLAYWRIGHT_MODULE_PATH` to its absolute `index.mjs` path.
Stop the temporary server afterward. Keep regular `npm run build` outputs
unconfigured; the normal `dist/` is separate from these mock test artifacts.

## Privacy and late-module regression tests

After `npm run build`, run `node tests/hero-regressions-browser.mjs` with an
available Playwright installation, or set `PLAYWRIGHT_MODULE_PATH` to its module
path. No additional server or environment configuration is needed: the test
serves the built files through Playwright routing and injects mock configuration
only into its in-memory HTML responses. All PostHog requests are intercepted.

Coverage includes truthy boolean, string, and numeric GPC values; Do Not Track;
consenting visitors whose application module arrives after the inline watchdog;
exactly one native and custom exposure; and overflow at 375/430/768/1440px.
Assignment changes before native exposure are covered by `npm run test:hero`.

## Verification completed — November 17, 2026

- `npm run test:hero`: 23 passing tests covering assignment/fallback, native
  exposure ordering, duplicate prevention, consent, identity drift, event privacy,
  and future inquiry contracts.
- `npm run check`: zero errors, warnings, or hints; `npm run build`: three static
  routes generated successfully. The normal build has experiment enrollment off
  and no configured project token.
- Browser review: A–D at 375/430/768/1440px, exact approved copy, Manrope italic,
  consistent geometry, no overflow/errors/third-party requests in previews;
  no-JavaScript A fallback and existing design-system routes verified.
- Real SDK with local mocks: native exposure before custom exposure; one native
  exposure per SDK session and one custom exposure for each of three document
  views; stable persisted identity/assignment across reloads; preview exclusion;
  actual secondary CTA/methodology navigation; four scroll milestones; three
  service views; one simulated confirmed-submission hook despite duplicate calls;
  unknown-flag fallback; and revocation stopping subsequent events. No real form
  submission or qualified inquiry occurred, and no request reached PostHog.
- Consent controls: keyboard focus and zero detected axe violations at all four
  widths; GPC and DNT both prevented initialization. The initial fallback homepage
  also had zero detected axe violations. Manual screen-reader testing was not run.
- Non-hero homepage sections, tokens, font declarations, showcase, and Typography
  Lab source files were verified unchanged.

Still unverified: real project ingestion, actual 25% bucketing/targeting, live
experiment reports, production consent policy, final photographic crops/contrast,
and the future contact/qualification pipeline. These require external setup and
approval; mocked validation does not substitute for them.
