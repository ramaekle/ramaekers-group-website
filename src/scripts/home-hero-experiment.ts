import { heroVariants, isHeroVariant, type HeroVariantId } from '../config/heroVariants.ts';
import { eligibleHost, hasAnalyticsConsent, CONSENT_STORAGE_KEY, type HeroExperimentConfig } from '../config/heroExperiment.ts';
import { HeroExperiment } from '../analytics/hero-experiment.ts';

declare global {
  interface Window {
    __trgHeroSafety?: number;
    /** Future verified contact workflow only; never pass field values. */
    trgInquiry?: Pick<HeroExperiment, 'getInquiryAttribution' | 'contactSubmitted'>;
  }
}

const section = document.querySelector<HTMLElement>('.home-hero[data-experiment-config]');
if (section) {
  const root = document.documentElement;
  const query = new URLSearchParams(location.search);
  const preview = query.has('hero');
  const config = JSON.parse(section.dataset.experimentConfig!) as HeroExperimentConfig;
  const available = section.dataset.availableImages?.split(',') ?? [];
  const choices = document.querySelector<HTMLElement>('#analytics-choices')!;
  const detail = choices.querySelector('details')!;
  const consentStatus = choices.querySelector<HTMLElement>('#analytics-consent-status')!;
  let sessionConsent: boolean | undefined;
  let renderReady = false;
  // Match the inline boot gate, including truthy values from browser extensions.
  const privacySignal = () => navigator.doNotTrack === '1' || Boolean((navigator as Navigator & { globalPrivacyControl?: unknown }).globalPrivacyControl);
  const consent = () => {
    if (sessionConsent !== undefined) return sessionConsent;
    try { return hasAnalyticsConsent(localStorage.getItem(CONSENT_STORAGE_KEY)); } catch { return false; }
  };
  const allowed = () => !preview && eligibleHost(config, location.hostname) && consent() && !privacySignal();
  if (window.__trgHeroSafety) clearTimeout(window.__trgHeroSafety);

  function render(id: HeroVariantId, source: 'fallback' | 'experiment' | 'preview' = 'fallback') {
    renderReady = false;
    const variant = heroVariants[id];
    section!.querySelector('[data-hero-eyebrow]')!.textContent = variant.eyebrow;
    section!.querySelector('[data-hero-headline]')!.textContent = variant.headline;
    section!.querySelector('[data-hero-italic]')!.textContent = variant.italic;
    section!.querySelector('[data-hero-paragraph]')!.textContent = variant.paragraph;
    section!.dataset.heroVariant = id;
    section!.dataset.heroSource = source;
    section!.dataset.imagePath = variant.imagePath;
    section!.style.setProperty('--hero-position-mobile', variant.focalPoint.mobile);
    section!.style.setProperty('--hero-position-desktop', variant.focalPoint.desktop);
    // Only the chosen, build-verified photograph is requested. Missing images stay navy.
    section!.style.setProperty('--hero-photo', available.includes(id) ? `url("${variant.imagePath}")` : 'none');
    root.classList.remove('hero-experiment-pending');
  }

  const experiment = new HeroExperiment({
    allowed, environment: config.environment,
    loadClient: async () => {
      const { createPostHogClient } = await import('../analytics/posthog-client.ts');
      return createPostHogClient(config, allowed);
    },
    render: id => {
      render(id, 'fallback');
      // expose() is the sole authority for turning a resolved assignment into an exposure.
      requestAnimationFrame(() => requestAnimationFrame(() => { renderReady = true; exposeIfVisible(); }));
    },
  });

  function exposeIfVisible() {
    if (preview || !renderReady || document.visibilityState !== 'visible') return;
    const box = section!.getBoundingClientRect();
    if (box.bottom <= 0 || box.top >= innerHeight) return;
    try {
      if (experiment.expose()) {
        section!.dataset.heroSource = 'experiment';
        recordScroll();
      }
    } catch { /* Tracking must not affect the page. */ }
  }
  let scrollFrame = 0;
  function recordScroll() {
    scrollFrame = 0;
    const distance = document.documentElement.scrollHeight - innerHeight;
    if (distance <= 0) return;
    const percentage = scrollY / distance * 100;
    for (const milestone of [25, 50, 75, 90] as const) {
      if (percentage >= milestone) experiment.interaction('scroll_depth_reached', 'scroll', milestone);
    }
  }

  if (preview) {
    render(isHeroVariant(query.get('hero')) ? query.get('hero') as HeroVariantId : 'A', 'preview');
    const badge = section.querySelector<HTMLElement>('[data-hero-preview]')!;
    badge.hidden = false;
    badge.textContent = `Developer preview · Variant ${section.dataset.heroVariant} · Tracking disabled${available.includes(section.dataset.heroVariant!) ? '' : ' · Photograph pending'}`;
  } else {
    window.trgInquiry = {
      getInquiryAttribution: () => experiment.getInquiryAttribution(),
      contactSubmitted: id => experiment.contactSubmitted(id),
    };
    choices.hidden = !eligibleHost(config, location.hostname);
    detail.open = !consent();
    const refreshStatus = () => {
      consentStatus.textContent = privacySignal() ? 'Your browser privacy preference keeps analytics off.' : consent() ? 'Analytics accepted. You can reject them here at any time.' : 'Analytics are off until you choose to accept.';
      choices.querySelector<HTMLButtonElement>('#analytics-accept')!.disabled = privacySignal();
    };
    const changeConsent = (value: boolean) => {
      sessionConsent = value;
      try { localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ choice: value ? 'granted' : 'denied', updatedAt: Date.now() })); } catch { /* Session-only choice when storage is unavailable. */ }
      refreshStatus();
      detail.open = false;
      if (allowed()) { root.classList.add('hero-experiment-pending'); void experiment.start(); }
      else experiment.stop();
    };
    choices.querySelector('#analytics-accept')!.addEventListener('click', () => changeConsent(true));
    choices.querySelector('#analytics-reject')!.addEventListener('click', () => changeConsent(false));
    window.addEventListener('storage', event => {
      if (event.key !== CONSENT_STORAGE_KEY && event.key !== null) return;
      sessionConsent = undefined;
      refreshStatus();
      // Do not re-enroll mid-page; require a reload after a cross-tab consent change.
      if (!allowed()) experiment.stop();
    });
    refreshStatus();
    // The inline watchdog only reveals the fallback while this module downloads.
    // A late module still gets its own bounded assignment attempt after consent.
    if (allowed()) void experiment.start();
    else render('A');
    window.addEventListener('scroll', () => {
      exposeIfVisible();
      if (!scrollFrame) scrollFrame = requestAnimationFrame(recordScroll);
    }, { passive: true });
    document.addEventListener('visibilitychange', exposeIfVisible);
    if ('IntersectionObserver' in window) {
      const heroObserver = new IntersectionObserver(exposeIfVisible);
      heroObserver.observe(section);
      const serviceObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.intersectionRatio >= .5) experiment.serviceViewed([...document.querySelectorAll('.home-service')].indexOf(entry.target));
        });
      }, { threshold: .5 });
      document.querySelectorAll('.home-service').forEach(service => serviceObserver.observe(service));
    }
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('a,button') : null;
      if (!target || target.matches(':disabled,[aria-disabled="true"]')) return;
      if (target.matches('[data-hero-cta="primary"]')) experiment.interaction('hero_primary_cta_click', 'hero_primary');
      if (target.matches('[data-hero-cta="secondary"]')) experiment.interaction('hero_secondary_cta_click', 'hero_secondary');
      if (target instanceof HTMLAnchorElement && target.hash === '#approach') experiment.interaction('methodology_interaction', 'approach_navigation');
      if (target.closest('#services')) experiment.interaction('service_interaction', 'service_action');
    });
  }
}
