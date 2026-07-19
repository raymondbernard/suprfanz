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

    // We should be on the lottery detail page already
    console.log('Current URL:', page.url());
    
    // Check what's visible after the Apply click
    await page.waitForTimeout(2000);
    
    // Check for login modal/prompt
    const modals = await page.locator('[class*="modal"], [class*="Modal"], [class*="dialog"], [class*="Dialog"], [role="dialog"]').all();
    console.log('\nModals/dialogs (' + modals.length + '):');
    for (const m of modals.slice(0, 5)) {
        try {
            const text = (await m.textContent()).trim().substring(0, 200);
            const visible = await m.isVisible().catch(() => false);
            console.log('  visible=' + visible + ' text="' + text.substring(0, 150) + '"');
        } catch(e) {}
    }
    
    // Check current visible text
    const bodyText = await page.locator('body').textContent();
    if (bodyText.includes('log in') || bodyText.includes('Log In') || bodyText.includes('sign in') || bodyText.includes('register')) {
        console.log('\n*** Page contains login/signup prompts ***');
        // Find the relevant text
        const lowerText = bodyText.toLowerCase();
        const idx = lowerText.indexOf('log in');
        if (idx >= 0) console.log('  Context: ...' + bodyText.substring(Math.max(0, idx-50), idx+100).trim() + '...');
        const idx2 = lowerText.indexOf('register');
        if (idx2 >= 0) console.log('  Context: ...' + bodyText.substring(Math.max(0, idx2-50), idx2+100).trim() + '...');
    }
    
    // Let's try navigating to the login page directly
    console.log('\n=== Navigating to login page ===');
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/auth/sign-in', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(3000);
    console.log('URL:', page.url());
    await page.screenshot({ path: shotDir + '05_login_page.png' }).catch(() => {});
    
    // Inspect login form
    const loginInputs = await page.locator('input').all();
    console.log('\nLogin inputs (' + loginInputs.length + '):');
    for (const inp of loginInputs.slice(0, 15)) {
        try {
            const type = await inp.getAttribute('type') || '';
            const name = await inp.getAttribute('name') || '';
            const id = await inp.getAttribute('id') || '';
            const placeholder = await inp.getAttribute('placeholder') || '';
            const aria = await inp.getAttribute('aria-label') || '';
            const visible = await inp.isVisible().catch(() => false);
            if (visible) console.log('  input type=' + type + ' name=' + name + ' id=' + id + ' placeholder="' + placeholder + '" aria="' + aria + '"');
        } catch(e) {}
    }
    
    const loginBtns = await page.locator('button').all();
    console.log('\nLogin buttons (' + loginBtns.length + '):');
    for (const b of loginBtns.slice(0, 10)) {
        try {
            const text = (await b.textContent()).trim().substring(0, 60);
            const visible = await b.isVisible().catch(() => false);
            if (text && visible) console.log('  "' + text + '"');
        } catch(e) {}
    }
    
    const loginLabels = await page.locator('label').all();
    console.log('\nLogin labels (' + loginLabels.length + '):');
    for (const l of loginLabels.slice(0, 10)) {
        try {
            const text = (await l.textContent()).trim().substring(0, 60);
            if (text) console.log('  "' + text + '"');
        } catch(e) {}
    }
    
    const loginHeadings = await page.locator('h1, h2, h3').all();
    console.log('\nLogin headings:');
    for (const h of loginHeadings.slice(0, 10)) {
        try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
    }
    
    // Also check the registration page structure
    console.log('\n=== Registration page ===');
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/auth/sign-up', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(3000);
    console.log('URL:', page.url());
    await page.screenshot({ path: shotDir + '06_register_page.png' }).catch(() => {});
    
    const regInputs = await page.locator('input').all();
    console.log('\nRegister inputs (' + regInputs.length + '):');
    for (const inp of regInputs.slice(0, 20)) {
        try {
            const type = await inp.getAttribute('type') || '';
            const name = await inp.getAttribute('name') || '';
            const id = await inp.getAttribute('id') || '';
            const placeholder = await inp.getAttribute('placeholder') || '';
            const aria = await inp.getAttribute('aria-label') || '';
            const visible = await inp.isVisible().catch(() => false);
            if (visible) console.log('  input type=' + type + ' name=' + name + ' id=' + id + ' placeholder="' + placeholder + '" aria="' + aria + '"');
        } catch(e) {}
    }
    
    const regBtns = await page.locator('button').all();
    console.log('\nRegister buttons (' + regBtns.length + '):');
    for (const b of regBtns.slice(0, 10)) {
        try {
            const text = (await b.textContent()).trim().substring(0, 60);
            const visible = await b.isVisible().catch(() => false);
            if (text && visible) console.log('  "' + text + '"');
        } catch(e) {}
    }
    
    const regHeadings = await page.locator('h1, h2, h3').all();
    console.log('\nRegister headings:');
    for (const h of regHeadings.slice(0, 10)) {
        try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));