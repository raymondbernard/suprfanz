const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    let page = null;
    for (const p of context.pages()) {
        try { if (p.url().includes('housingconnect')) { page = p; break; } } catch(e) {}
    }
    if (!page) page = context.pages[0];

    const shotDir = 'C:/Users/RayBe/.openclaw/workspace/housing/applications/screenshots/';
    
    // Navigate to household profile
    console.log('=== Navigating to Household Profile ===');
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/household/summary', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(4000);
    console.log('URL:', page.url());
    await page.screenshot({ path: shotDir + 'household_profile.png' }).catch(() => {});
    
    // Dump headings
    const headings = await page.locator('h1, h2, h3, h4, h5').all();
    console.log('\nHeadings:');
    for (const h of headings.slice(0, 15)) {
        try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
    }
    
    // Dump all inputs
    const inputs = await page.locator('input, select, textarea').all();
    console.log('\nInputs (' + inputs.length + '):');
    for (let i = 0; i < Math.min(inputs.length, 30); i++) {
        try {
            const inp = inputs[i];
            const tag = await inp.evaluate(el => el.tagName);
            const type = await inp.getAttribute('type') || '';
            const name = await inp.getAttribute('name') || '';
            const id = await inp.getAttribute('id') || '';
            const placeholder = await inp.getAttribute('placeholder') || '';
            const aria = await inp.getAttribute('aria-label') || '';
            const visible = await inp.isVisible().catch(() => false);
            const value = await inp.inputValue().catch(() => '');
            if (visible) console.log(`  [${i}] ${tag} type=${type} name="${name}" id="${id}" placeholder="${placeholder}" aria="${aria}" value="${value}"`);
        } catch(e) {}
    }
    
    // Labels
    const labels = await page.locator('label').all();
    console.log('\nLabels (' + labels.length + '):');
    for (const l of labels.slice(0, 30)) {
        try {
            const text = (await l.textContent()).trim().substring(0, 60);
            const forAttr = await l.getAttribute('for') || '';
            if (text) console.log(`  "${text}" for="${forAttr}"`);
        } catch(e) {}
    }
    
    // Buttons
    const btns = await page.locator('button, a[role="button"]').all();
    console.log('\nButtons (' + btns.length + '):');
    for (const b of btns.slice(0, 20)) {
        try {
            const text = (await b.textContent()).trim().substring(0, 60);
            const disabled = await b.isDisabled().catch(() => false);
            const visible = await b.isVisible().catch(() => false);
            const href = await b.getAttribute('href') || '';
            if (text && visible) console.log(`  "${text}" disabled=${disabled} href="${href}"`);
        } catch(e) {}
    }
    
    // Links
    const links = await page.locator('a').all();
    console.log('\nLinks (' + links.length + '):');
    for (const a of links.slice(0, 25)) {
        try {
            const text = (await a.textContent()).trim().substring(0, 50);
            const href = await a.getAttribute('href') || '';
            if (text && href) console.log(`  "${text}" -> ${href}`);
        } catch(e) {}
    }
    
    // mat- components
    const mats = await page.locator('mat-radio-button, mat-checkbox, mat-select, mat-form-field, mat-label, mat-radio-group').all();
    console.log('\nMat components (' + mats.length + '):');
    for (const m of mats.slice(0, 20)) {
        try {
            const tag = await m.evaluate(el => el.tagName);
            const text = (await m.textContent()).trim().substring(0, 60);
            if (text) console.log(`  ${tag}: "${text}"`);
        } catch(e) {}
    }
    
    // Body text
    const bodyText = await page.locator('body').textContent();
    console.log('\nBody text (first 1500):');
    console.log(bodyText.substring(0, 1500));
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));