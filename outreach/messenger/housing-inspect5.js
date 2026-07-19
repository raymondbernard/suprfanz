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

    // Navigate to registration page (we confirmed it loads)
    console.log('=== Registration Page ===');
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/auth/sign-up', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(5000);
    console.log('URL:', page.url());
    await page.screenshot({ path: shotDir + '06_register_page.png' }).catch(() => {});
    
    // Full dump of all form elements
    const inputs = await page.locator('input, select, textarea').all();
    console.log('\nInputs (' + inputs.length + '):');
    for (const inp of inputs.slice(0, 30)) {
        try {
            const tag = await inp.evaluate(el => el.tagName);
            const type = await inp.getAttribute('type') || '';
            const name = await inp.getAttribute('name') || '';
            const id = await inp.getAttribute('id') || '';
            const placeholder = await inp.getAttribute('placeholder') || '';
            const aria = await inp.getAttribute('aria-label') || '';
            const visible = await inp.isVisible().catch(() => false);
            if (visible) console.log('  ' + tag + ' type=' + type + ' name=' + name + ' id=' + id + ' placeholder="' + placeholder + '" aria="' + aria + '"');
        } catch(e) {}
    }
    
    const labels = await page.locator('label').all();
    console.log('\nLabels (' + labels.length + '):');
    for (const l of labels.slice(0, 20)) {
        try {
            const text = (await l.textContent()).trim().substring(0, 60);
            const forAttr = await l.getAttribute('for') || '';
            if (text) console.log('  "' + text + '" for=' + forAttr);
        } catch(e) {}
    }
    
    const btns = await page.locator('button').all();
    console.log('\nButtons (' + btns.length + '):');
    for (const b of btns.slice(0, 15)) {
        try {
            const text = (await b.textContent()).trim().substring(0, 60);
            const visible = await b.isVisible().catch(() => false);
            if (text && visible) console.log('  "' + text + '"');
        } catch(e) {}
    }
    
    const headings = await page.locator('h1, h2, h3, h4').all();
    console.log('\nHeadings:');
    for (const h of headings.slice(0, 10)) {
        try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
    }
    
    // Now let's try clicking the "Log In" link from the nav
    console.log('\n=== Trying to access Login ===');
    // Go back to the main page and click Log In
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(3000);
    
    // Click the Log In link in the header
    const loginLink = page.locator('a:has-text("Log In")').first();
    if (await loginLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('Clicking Log In link...');
        await loginLink.click();
        await page.waitForTimeout(5000);
        console.log('URL after login click:', page.url());
        await page.screenshot({ path: shotDir + '07_login_form.png' }).catch(() => {});
        
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
        
        // Check for select dropdowns
        const selects = await page.locator('select').all();
        console.log('\nSelects (' + selects.length + '):');
        for (const s of selects.slice(0, 10)) {
            try {
                const name = await s.getAttribute('name') || '';
                const id = await s.getAttribute('id') || '';
                const options = await s.locator('option').allTextContents();
                console.log('  name=' + name + ' id=' + id + ' options=' + JSON.stringify(options.slice(0, 10)));
            } catch(e) {}
        }
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));