const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    let page = null;
    for (const p of context.pages()) {
        try { if (p.url().includes('housingconnect') || p.url().includes('a806-housingconnect')) { page = p; break; } } catch(e) {}
    }
    if (!page) page = context.pages[0];

    const shotDir = 'C:/Users/RayBe/.openclaw/workspace/housing/applications/screenshots/';

    // Check current state — are we logged in?
    console.log('Current URL:', page.url());
    
    // Navigate to main page
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(3000);
    console.log('Main URL:', page.url());
    
    // Check if we see "Log In" (not logged in) or "My Dashboard" (logged in)
    const bodyText = await page.locator('body').textContent();
    const isLoggedIn = bodyText.includes('My Dashboard') || bodyText.includes('My Applications') || bodyText.includes('My Household');
    const hasLoginLink = bodyText.includes('Log In');
    console.log('Logged in:', isLoggedIn);
    console.log('Has Log In link:', hasLoginLink);
    
    if (!isLoggedIn) {
        console.log('\n=== Not logged in. Clicking Log In ===');
        const loginLink = page.locator('a:has-text("Log In")').first();
        if (await loginLink.isVisible({ timeout: 3000 }).catch(() => false)) {
            await loginLink.click();
            await page.waitForTimeout(5000);
            console.log('Login redirect URL:', page.url());
            await page.screenshot({ path: shotDir + 'login_page.png' }).catch(() => {});
            
            // Inspect the login form on the auth server
            const loginInputs = await page.locator('input').all();
            console.log('\nLogin form inputs (' + loginInputs.length + '):');
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
            
            const loginBtns = await page.locator('button, input[type="submit"]').all();
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
            
            const loginHeadings = await page.locator('h1, h2, h3, h4').all();
            console.log('\nLogin headings:');
            for (const h of loginHeadings.slice(0, 10)) {
                try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
            }
            
            // Check for selects
            const selects = await page.locator('select').all();
            console.log('\nSelects (' + selects.length + '):');
            for (const s of selects.slice(0, 5)) {
                try {
                    const name = await s.getAttribute('name') || '';
                    const id = await s.getAttribute('id') || '';
                    const options = await s.locator('option').allTextContents();
                    console.log('  name=' + name + ' id=' + id + ' options=' + JSON.stringify(options.slice(0, 10)));
                } catch(e) {}
            }
        }
    } else {
        console.log('\n=== Already logged in! ===');
        // Navigate to a lottery detail and try to apply
        console.log('\n=== Testing Apply flow on lottery 7569 ===');
        await page.goto('https://housingconnect.nyc.gov/PublicWeb/details/7569', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
        await page.waitForTimeout(4000);
        console.log('Detail URL:', page.url());
        await page.screenshot({ path: shotDir + 'lottery_detail_loggedin.png' }).catch(() => {});
        
        // Find Apply Now button
        const applyBtn = page.locator('button:has-text("Apply Now")').first();
        if (await applyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('Found Apply Now button — clicking...');
            await applyBtn.click();
            await page.waitForTimeout(5000);
            console.log('After Apply URL:', page.url());
            await page.screenshot({ path: shotDir + 'apply_form_step1.png' }).catch(() => {});
            
            // Dump everything on the application form page
            const formInputs = await page.locator('input, select, textarea').all();
            console.log('\n=== APPLICATION FORM ===');
            console.log('Inputs (' + formInputs.length + '):');
            for (const inp of formInputs.slice(0, 50)) {
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
            
            const formLabels = await page.locator('label').all();
            console.log('\nLabels (' + formLabels.length + '):');
            for (const l of formLabels.slice(0, 40)) {
                try {
                    const text = (await l.textContent()).trim().substring(0, 60);
                    if (text) console.log('  "' + text + '"');
                } catch(e) {}
            }
            
            const formBtns = await page.locator('button').all();
            console.log('\nButtons (' + formBtns.length + '):');
            for (const b of formBtns.slice(0, 20)) {
                try {
                    const text = (await b.textContent()).trim().substring(0, 60);
                    const disabled = await b.isDisabled().catch(() => false);
                    const visible = await b.isVisible().catch(() => false);
                    if (text && visible) console.log('  "' + text + '" disabled=' + disabled);
                } catch(e) {}
            }
            
            const formHeadings = await page.locator('h1, h2, h3, h4, h5').all();
            console.log('\nHeadings:');
            for (const h of formHeadings.slice(0, 15)) {
                try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
            }
            
            // Radios/checkboxes
            const radios = await page.locator('input[type="radio"], input[type="checkbox"], mat-radio, mat-checkbox').all();
            console.log('\nRadio/Checkbox (' + radios.length + '):');
            for (const r of radios.slice(0, 20)) {
                try {
                    const tag = await r.evaluate(el => el.tagName);
                    const type = await r.getAttribute('type') || '';
                    const name = await r.getAttribute('name') || '';
                    const id = await r.getAttribute('id') || '';
                    const cls = await r.getAttribute('class') || '';
                    console.log('  ' + tag + ' type=' + type + ' name=' + name + ' id=' + id + ' class=' + cls.substring(0, 40));
                } catch(e) {}
            }
            
            // Selects
            const formSelects = await page.locator('select, mat-select').all();
            console.log('\nSelects (' + formSelects.length + '):');
            for (const s of formSelects.slice(0, 10)) {
                try {
                    const tag = await s.evaluate(el => el.tagName);
                    const name = await s.getAttribute('name') || '';
                    const id = await s.getAttribute('id') || '';
                    console.log('  ' + tag + ' name=' + name + ' id=' + id);
                } catch(e) {}
            }
        } else {
            console.log('No Apply Now button found');
        }
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));