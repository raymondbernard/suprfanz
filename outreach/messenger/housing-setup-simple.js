const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    
    // Get ALL pages
    const pages = context.pages();
    console.log('Total pages:', pages.length);
    for (let i = 0; i < pages.length; i++) {
        try { console.log(`  [${i}] ${pages[i].url()}`); } catch(e) { console.log(`  [${i}] error: ${e.message}`); }
    }
    
    // Use the first page
    let page = pages[0];
    if (!page) {
        console.log('No pages — creating new');
        page = await context.newPage();
    }
    
    console.log('Using page:', page.url());
    
    const shotDir = 'C:/Users/RayBe/.openclaw/workspace/housing/applications/screenshots/';
    
    // Navigate to household setup
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/household/setup', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(3000);
    console.log('URL:', page.url());
    await page.screenshot({ path: shotDir + 'setup_step1.png' }).catch(() => {});
    
    // Step 1 is already filled (name, email). Click Next.
    console.log('\n--- Step 1: Clicking Next ---');
    const nextBtns = await page.locator('button:has-text("Next")').all();
    console.log('Next buttons:', nextBtns.length);
    
    // Find first visible, enabled Next
    let clicked = false;
    for (const btn of nextBtns) {
        try {
            const visible = await btn.isVisible();
            const disabled = await btn.isDisabled();
            if (visible && !disabled) {
                console.log('Clicking first enabled Next');
                await btn.click();
                await page.waitForTimeout(2000);
                clicked = true;
                break;
            }
        } catch(e) {}
    }
    if (!clicked) console.log('Could not click Next');
    
    // Dump what we see now
    console.log('\n--- After Step 1 Next ---');
    await page.screenshot({ path: shotDir + 'setup_step2.png' }).catch(() => {});
    
    // Dump visible inputs
    const inputs = await page.locator('input, select, mat-select, mat-checkbox, mat-radio-button').all();
    console.log('Visible elements (' + inputs.length + '):');
    for (let i = 0; i < Math.min(inputs.length, 25); i++) {
        try {
            const el = inputs[i];
            const tag = await el.evaluate(e => e.tagName);
            const type = await el.getAttribute('type') || '';
            const id = await el.getAttribute('id') || '';
            const placeholder = await el.getAttribute('placeholder') || '';
            const visible = await el.isVisible().catch(() => false);
            const text = tag.includes('MAT') ? (await el.textContent()).trim().substring(0, 50) : '';
            if (visible) console.log(`  [${i}] ${tag} type=${type} id="${id}" placeholder="${placeholder}" text="${text}"`);
        } catch(e) {}
    }
    
    const labels = await page.locator('label').all();
    console.log('Labels:');
    for (const l of labels.slice(0, 20)) {
        try {
            const text = (await l.textContent()).trim().substring(0, 60);
            if (text) console.log('  "' + text + '"');
        } catch(e) {}
    }
    
    const btns = await page.locator('button').all();
    console.log('Buttons:');
    for (const b of btns.slice(0, 15)) {
        try {
            const text = (await b.textContent()).trim().substring(0, 60);
            const disabled = await b.isDisabled().catch(() => false);
            const visible = await b.isVisible().catch(() => false);
            if (text && visible) console.log(`  "${text}" disabled=${disabled}`);
        } catch(e) {}
    }
    
    // Body text snippet
    const bodyText = await page.locator('body').textContent();
    console.log('\nBody text (around "Members"):');
    const idx = bodyText.indexOf('Household Members');
    if (idx >= 0) console.log(bodyText.substring(idx, idx + 500));
    else console.log('(not found, showing first 800 chars)');
    if (idx < 0) console.log(bodyText.substring(0, 800));
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));