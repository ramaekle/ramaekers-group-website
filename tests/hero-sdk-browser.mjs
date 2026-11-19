// Browser tooling is optional; use an installed Playwright or supply its module path.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
import { gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { requests: [], events: [], identityStable: false, previewExcluded: false, revocation: false, errors: [] };
function decode(request) {
    let raw = request.postDataBuffer();
    if (!raw)
        return null;
    const url = new URL(request.url());
    try {
        if (url.searchParams.get('compression') === 'gzip-js' || raw[0] === 31)
            raw = gunzipSync(raw);
    }
    catch { }
    try {
        return JSON.parse(raw.toString());
    }
    catch { }
    try {
        const values = new URLSearchParams(raw.toString());
        const data = Buffer.from(values.get('data') || '', 'base64');
        try {
            return JSON.parse(gunzipSync(data).toString());
        }
        catch {
            return JSON.parse(data.toString());
        }
    }
    catch {
        return { unparsed: raw.toString().slice(0, 100) };
    }
}
try {
    const context = await browser.newContext({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36" });
    let flag = 'B';
    let flagsMode = 'normal';
    await context.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
    await context.route('https://posthog.test/**', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const body = decode(request);
        report.requests.push({ path: url.pathname, body });
        if (url.pathname.includes('flags')) {
            if (flagsMode === 'delay')
                await new Promise(r => setTimeout(r, 6000));
            await route.fulfill({ json: { featureFlags: { 'trg-home-hero-v1': flag }, featureFlagPayloads: {}, errorsWhileComputingFlags: false, requestId: 'trg-mock-request', evaluatedAt: Date.now() } });
            return;
        }
        if (url.pathname.includes('/e/')) {
            const events = Array.isArray(body) ? body : body?.batch || [body];
            report.events.push(...events.filter(Boolean));
            await route.fulfill({ json: { status: 1 } });
            return;
        }
        await route.fulfill({ json: { supportedCompression: ['gzip'], autocapture_opt_out: true, sessionRecording: false } });
    });
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error')
        report.errors.push(m.text()); });
    await page.goto('http://localhost:4322/?email=private-test-value', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.home-hero').evaluate(e => JSON.parse(e.dataset.experimentConfig).token), 'phc_trg_mock_no_real_credentials', 'Use only the documented mock-token test build');
    assert.equal(report.requests.length, 0);
    assert.equal(await page.locator('.home-hero').getAttribute('data-hero-source'), 'fallback');
    await page.getByRole('button', { name: 'Accept analytics', exact: true }).click();
    try {
        await page.waitForFunction(() => document.querySelector('.home-hero').dataset.heroSource === 'experiment', { timeout: 10000 });
    }
    catch (error) {
        console.log(JSON.stringify({ requests: report.requests.map(r => r.path), events: report.events.map(e => e.event), diagnostics: report.diagnostics, identityStable: report.identityStable, previewExcluded: report.previewExcluded, revocation: report.revocation, errors: report.errors }, null, 2));
        throw error;
    }
    assert.equal(await page.locator('.home-hero').getAttribute('data-hero-variant'), 'B');
    const attribution = await page.evaluate(() => window.trgInquiry.getInquiryAttribution());
    assert.equal(attribution.variant_id, 'B');
    assert.ok(attribution.distinct_id);
    await page.waitForTimeout(3500);
    assert.equal(report.events.filter(e => e.event === '$feature_flag_called').length, 1);
    assert.equal(report.events.filter(e => e.event === 'hero_exposure').length, 1);
    assert.equal(report.events.find(e => e.event === '$feature_flag_called').properties.$feature_flag_response, 'B');
    assert.equal(report.events.findIndex(e => e.event === '$feature_flag_called') < report.events.findIndex(e => e.event === 'hero_exposure'), true);
    await page.locator('[data-hero-cta="secondary"]').click();
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(3500);
    assert.equal(report.events.filter(e => e.event === 'hero_secondary_cta_click').length, 1);
    assert.equal(report.events.filter(e => e.event === 'methodology_interaction').length, 1);
    assert.deepEqual(report.events.filter(e => e.event === 'scroll_depth_reached').map(e => e.properties.scroll_percentage).sort((a, b) => a - b), [25, 50, 75, 90]);
    assert.equal(report.events.filter(e => e.event === 'hero_primary_cta_click').length, 0);
    await page.evaluate(() => window.trgInquiry.contactSubmitted('b8f04208-52e7-4c5a-bb09-6713e2d70e07'));
    await page.evaluate(() => window.trgInquiry.contactSubmitted('b8f04208-52e7-4c5a-bb09-6713e2d70e07'));
    await page.waitForTimeout(3500);
    assert.equal(report.events.filter(e => e.event === 'contact_form_submitted').length, 1);
    assert.equal(report.events.filter(e => e.event === 'qualified_inquiry').length, 0);
    await page.locator('#services').scrollIntoViewIfNeeded();
    await page.waitForTimeout(3500);
    assert.equal(report.events.filter(e => e.event === 'service_interaction').length, 3);
    const firstIdentity = attribution.distinct_id;
    await page.goto('http://localhost:4322/');
    await page.waitForFunction(() => document.querySelector('.home-hero').dataset.heroSource === 'experiment');
    assert.equal(await page.evaluate(() => window.trgInquiry.getInquiryAttribution().distinct_id), firstIdentity);
    assert.equal(await page.locator('.home-hero').getAttribute('data-hero-variant'), 'B');
    report.identityStable = true;
    await page.waitForTimeout(3500);
    const beforePreview = report.requests.length;
    const storageBefore = await page.evaluate(() => { const data = JSON.parse(localStorage.getItem('ph_phc_trg_mock_no_real_credentials_posthog')); return { identity: data.distinct_id, consent: localStorage.getItem('trg.analytics-consent.v1'), flags: localStorage.getItem('ph_phc_trg_mock_no_real_credentials_posthog__flags') }; });
    await page.goto('http://localhost:4322/?hero=D', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3500);
    assert.equal(await page.locator('.home-hero').getAttribute('data-hero-variant'), 'D');
    assert.equal(report.requests.length, beforePreview);
    assert.deepEqual(await page.evaluate(() => { const data = JSON.parse(localStorage.getItem('ph_phc_trg_mock_no_real_credentials_posthog')); return { identity: data.distinct_id, consent: localStorage.getItem('trg.analytics-consent.v1'), flags: localStorage.getItem('ph_phc_trg_mock_no_real_credentials_posthog__flags') }; }), storageBefore);
    report.previewExcluded = true;
    await page.goto('http://localhost:4322/');
    await page.waitForFunction(() => document.querySelector('.home-hero').dataset.heroSource === 'experiment');
    await page.waitForTimeout(3500);
    await page.locator('#analytics-choices summary').click();
    await page.getByRole('button', { name: 'Reject analytics', exact: true }).click();
    assert.equal(await page.locator('.home-hero').getAttribute('data-hero-variant'), 'A');
    assert.equal(await page.evaluate(() => window.trgInquiry.getInquiryAttribution()), null);
    const count = report.events.length;
    await page.locator('[data-hero-cta="secondary"]').click();
    await page.waitForTimeout(3500);
    assert.equal(report.events.length, count);
    report.revocation = true;
    // Every event must retain only the controlled contract, not the test query or input contents.
    for (const event of report.events) {
        assert.ok(!JSON.stringify(event).includes('private-test-value'));
        assert.ok(!('$current_url' in event.properties));
        assert.ok(!('email' in event.properties));
    }
    const flagsBodies = report.requests.filter(r => r.path.includes('flags')).map(r => JSON.stringify(r.body));
    report.flagPrivacy = flagsBodies.every(body => !body.includes('private-test-value'));
    assert.ok(report.flagPrivacy);
    // Unexpected assigned value returns A without any experiment events.
    flag = 'unexpected';
    const bad = await context.newPage();
    await bad.addInitScript(() => localStorage.setItem('trg.analytics-consent.v1', JSON.stringify({ choice: 'granted', updatedAt: Date.now() })));
    const beforeBad = report.events.length;
    await bad.goto('http://localhost:4322/');
    await bad.waitForFunction(() => !document.documentElement.classList.contains('hero-experiment-pending'));
    assert.equal(await bad.locator('.home-hero').getAttribute('data-hero-variant'), 'A');
    await bad.waitForTimeout(3500);
    assert.equal(report.events.length, beforeBad);
    await bad.close();
    assert.deepEqual(report.errors, []);
    await fs.writeFile('/private/tmp/trg-posthog-sdk-results.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ eventCounts: report.events.reduce((a, e) => (a[e.event] = (a[e.event] || 0) + 1, a), {}), identityStable: report.identityStable, previewExcluded: report.previewExcluded, revocation: report.revocation, flagPrivacy: report.flagPrivacy, errors: report.errors }, null, 2));
}
catch (error) {
    console.log(JSON.stringify({ requests: report.requests.map(r => r.path), events: report.events.map(e => e.event), diagnostics: report.diagnostics, identityStable: report.identityStable, previewExcluded: report.previewExcluded, revocation: report.revocation, errors: report.errors }, null, 2));
    throw error;
}
finally {
    await browser.close();
}
