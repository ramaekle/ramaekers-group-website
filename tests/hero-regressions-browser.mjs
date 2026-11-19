// Run after npm run build. All page and PostHog requests stay inside local mocks.
// Supply PLAYWRIGHT_MODULE_PATH when Playwright is installed outside this project.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { gunzipSync } from 'node:zlib';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const config = { enabled: true, token: 'phc_trg_mock_no_real_credentials', host: 'https://posthog.test', environment: 'development', allowedHosts: ['hero.test'] };
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
try {
  for (const scenario of [
    { gpc: true, width: 375, blocked: true },
    { gpc: '1', width: 430, blocked: true },
    { gpc: 1, width: 768, blocked: true },
    { gpc: false, dnt: '1', width: 1440, blocked: true },
    { gpc: false, width: 375 },
    { gpc: false, width: 430 },
    { gpc: false, width: 768 },
    { gpc: false, width: 1440, delayed: true },
  ]) {
    const context = await browser.newContext({
      viewport: { width: scenario.width, height: 1100 },
      // Exercise SDK capture rather than its headless-bot filtering path.
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    });
    const requests = [], events = [], errors = [];
    await context.addInitScript(({ gpc, dnt }) => {
      Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => gpc });
      Object.defineProperty(navigator, 'doNotTrack', { get: () => dnt || null });
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      localStorage.setItem('trg.analytics-consent.v1', JSON.stringify({ choice: 'granted', updatedAt: Date.now() }));
    }, scenario);
    let releaseModule;
    const moduleGate = new Promise(done => { releaseModule = done; });
    await context.route('http://hero.test/**', async route => {
      const pathname = new URL(route.request().url()).pathname;
      if (scenario.delayed && pathname.endsWith('.js')) await moduleGate;
      const path = resolve('dist', pathname === '/' ? 'index.html' : pathname.slice(1));
      let body = await readFile(path);
      if (pathname === '/') {
        let html = body.toString();
        html = html.replace(/const heroBoot = .*?;/, `const heroBoot = ${JSON.stringify(config)};`);
        html = html.replace(/data-experiment-config="[^"]*"/, `data-experiment-config="${JSON.stringify(config).replaceAll('"', '&quot;')}"`);
        body = Buffer.from(html);
      }
      await route.fulfill({ body, contentType: types[extname(path)] || 'application/octet-stream' });
    });
    await context.route('https://posthog.test/**', async route => {
      const request = route.request(), url = new URL(request.url());
      requests.push(url.pathname);
      if (url.pathname.includes('flags')) {
        await route.fulfill({ json: { featureFlags: { 'trg-home-hero-v1': 'B' }, featureFlagPayloads: {}, errorsWhileComputingFlags: false } });
      } else {
        if (url.pathname.includes('/e/')) {
          let body = request.postDataBuffer();
          if (body?.[0] === 31) body = gunzipSync(body);
          const data = JSON.parse(body.toString());
          events.push(...(Array.isArray(data) ? data : data.batch || [data]));
        }
        await route.fulfill({ json: { status: 1, supportedCompression: ['gzip'], autocapture_opt_out: true, sessionRecording: false } });
      }
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('http://hero.test/', { waitUntil: 'commit' });
    if (scenario.delayed) {
      await page.waitForFunction(() => document.documentElement.classList.contains('hero-experiment-pending'));
      await page.waitForFunction(() => !document.documentElement.classList.contains('hero-experiment-pending'), undefined, { timeout: 7000 });
      assert.equal(await page.locator('.home-hero').getAttribute('data-hero-variant'), 'A');
      assert.equal(requests.length, 0);
      releaseModule();
    }
    await page.waitForLoadState('networkidle');
    if (scenario.blocked) {
      assert.equal(await page.locator('#analytics-accept').isDisabled(), true);
      assert.equal(await page.locator('.home-hero').getAttribute('data-hero-variant'), 'A');
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains('hero-experiment-pending')), false);
      assert.equal(requests.length, 0);
    } else {
      await page.waitForFunction(() => document.querySelector('.home-hero').dataset.heroSource === 'experiment');
      assert.equal(await page.locator('.home-hero').getAttribute('data-hero-variant'), 'B');
      await page.waitForTimeout(3500); // Allow the SDK's event batch to flush.
      assert.equal(events.filter(event => event.event === '$feature_flag_called').length, 1);
      assert.equal(events.filter(event => event.event === 'hero_exposure').length, 1);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log(`PASS ${JSON.stringify(scenario)}`);
    await context.close();
  }
} finally { await browser.close(); }
