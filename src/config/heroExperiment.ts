export const CONSENT_STORAGE_KEY = 'trg.analytics-consent.v1';
export const CONSENT_MAX_AGE = 365 * 24 * 60 * 60 * 1000;
export const ASSIGNMENT_TIMEOUT_MS = 4000;
export interface HeroExperimentConfig {
  enabled: boolean;
  token: string;
  host: string;
  environment: 'development' | 'production';
  allowedHosts: string[];
}
export function getHeroExperimentConfig(env: Record<string, unknown>): HeroExperimentConfig {
  const token = String(env.PUBLIC_POSTHOG_PROJECT_TOKEN ?? '');
  const host = String(env.PUBLIC_POSTHOG_API_HOST ?? '');
  const environment = env.PUBLIC_ANALYTICS_ENVIRONMENT === 'production' ? 'production' : 'development';
  let validHost = false;
  try { const url = new URL(host); validHost = url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/'; } catch { /* Unconfigured is safe. */ }
  return {
    enabled: env.PUBLIC_HERO_EXPERIMENT_ENABLED === 'true' && token.startsWith('phc_') && validHost,
    token, host, environment,
    allowedHosts: String(env.PUBLIC_POSTHOG_ALLOWED_HOSTS ?? '').split(',').map(hostname => hostname.trim()).filter(Boolean),
  };
}
export function hasAnalyticsConsent(raw: string | null, now = Date.now()): boolean {
  try {
    const record = JSON.parse(raw ?? 'null');
    return record?.choice === 'granted' && Number.isFinite(record.updatedAt) && record.updatedAt <= now && now - record.updatedAt < CONSENT_MAX_AGE;
  } catch { return false; }
}
export function eligibleHost(config: HeroExperimentConfig, hostname: string): boolean {
  return config.enabled && config.allowedHosts.includes(hostname)
    && (config.environment !== 'production' || ['ramaekersgroup.com', 'www.ramaekersgroup.com'].includes(hostname));
}
