const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    const pages = context.pages();
    let page = pages[0];
    for (const p of pages) {
        try { if (p.url().includes('housingconnect')) { page = p; break; } } catch(e) {}
    }

    const shotDir = 'C:/Users/RayBe/.openclaw/workspace/housing/applications/screenshots/';
    
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/household/setup', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
    await page.waitForTimeout(3000);
    
    // Scroll down to see the full page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: shotDir + 'setup_full_page.png' }).catch(() => {});
    
    // Dump ALL visible elements — inputs, buttons, labels, text
    console.log('=== ALL VISIBLE ELEMENTS ON HOUSEHOLD SETUP ===');
    
    // All buttons with their position
    const btns = await page.locator('button').all();
    console.log('\nButtons (' + btns.length + '):');
    for (let i = 0; i < btns.length; i++) {
        try {
            const b = btns[i];
            const text = (await b.textContent()).trim().substring(0, 60);
            const vis = await b.isVisible().catch(() => false);
            const dis = await b.isDisabled().catch(() => false);
            const box = await b.boundingBox().catch(() => null);
            if (text && vis) console.log(`  [${i}] "${text}" disabled=${dis} y=${box ? Math.round(box.y) : '?'}`);
        } catch(e) {}
    }
    
    // All inputs
    const inputs = await page.locator('input, select, textarea, mat-select').all();
    console.log('\nInputs (' + inputs.length + '):');
    for (let i = 0; i < inputs.length; i++) {
        try {
            const el = inputs[i];
            const tag = await el.evaluate(e => e.tagName);
            const type = await el.getAttribute('type') || '';
            const id = await el.getAttribute('id') || '';
            const placeholder = await el.getAttribute('placeholder') || '';
            const vis = await el.isVisible().catch(() => false);
            const val = await el.inputValue().catch(() => '');
            const box = await el.boundingBox().catch(() => null);
            if (vis) console.log(`  [${i}] ${tag} type=${type} id="${id}" placeholder="${placeholder}" value="${val}" y=${box ? Math.round(box.y) : '?'}`);
        } catch(e) {}
    }
    
    // All labels
    const labels = await page.locator('label').all();
    console.log('\nLabels (' + labels.length + '):');
    for (let i = 0; i < labels.length; i++) {
        try {
            const text = (await labels[i].textContent()).trim().substring(0, 60);
            const forAttr = await labels[i].getAttribute('for') || '';
            const vis = await labels[i].isVisible().catch(() => false);
            if (text && vis) console.log(`  [${i}] "${text}" for="${forAttr}"`);
        } catch(e) {}
    }
    
    // mat elements
    const mats = await page.locator('mat-checkbox, mat-radio-button, mat-radio-group, mat-select, mat-form-field').all();
    console.log('\nMat elements (' + mats.length + '):');
    for (let i = 0; i < mats.length; i++) {
        try {
            const m = mats[i];
            const tag = await m.evaluate(e => e.tagName);
            const text = (await m.textContent()).trim().substring(0, 60);
            const vis = await m.isVisible().catch(() => false);
            const cls = await m.getAttribute('class') || '';
            if (vis) console.log(`  [${i}] ${tag} class="${cls.substring(0,50)}" text="${text}"`);
        } catch(e) {}
    }
    
    // Step indicators (the numbered circles at top)
    const stepEls = await page.locator('[class*="step"], [class* "Step"], .wizard-step, .list-group-item, .btn-step').all();
    console.log('\nStep indicators (' + stepEls.length + '):');
    for (let i = 0; i < stepEls.length; i++) {
        try {
            const tag = await stepEls[i].evaluate(e => e.tagName);
            const text = (await stepEls[i].textContent()).trim().substring(0, 60);
            const cls = await stepEls[i].getAttribute('class') || '';
            const vis = await stepEls[i].isVisible().catch(() => false);
            if (text && vis) console.log(`  [${i}] ${tag} class="${cls.substring(0,50)}" text="${text}"`);
        } catch(e) {}
    }
    
    // Body text
    const bodyText = await page.locator('body').textContent();
    console.log('\nBody text (first 2000):');
    console.log(bodyText.substring(0, 2000));
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));