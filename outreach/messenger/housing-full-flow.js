const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    let page = null;
    for (const p of context.pages()) {
        try { if (p.url().includes('housingconnect') || p.url().includes('a806')) { page = p; break; } } catch(e) {}
    }
    if (!page) page = context.pages[0];

    const shotDir = 'C:/Users/RayBe/.openclaw/workspace/housing/applications/screenshots/';

    // Step 1: Navigate to main page
    console.log('Step 1: Navigate to Housing Connect');
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(3000);

    // Step 2: Click Log In to go to auth server
    console.log('Step 2: Clicking Log In');
    await page.locator('a:has-text("Log In")').first().click();
    await page.waitForTimeout(5000);
    console.log('On auth server:', page.url());
    await page.screenshot({ path: shotDir + 'step1_login_page.png' }).catch(() => {});

    // Step 3: Fill login form
    // Fields: #Username (text), #Password (password), button "Login"
    // We need credentials — prompt user
    console.log('\n*** LOGIN FORM DETECTED ***');
    console.log('Fields: #Username (text), #Password (password), Login button');
    console.log('Form: POST to auth server (IdentityServer4)');
    console.log('');
    console.log('To automate login, we need:');
    console.log('  1. Housing Connect username (email)');
    console.log('  2. Housing Connect password');
    console.log('');
    console.log('Options:');
    console.log('  A) User logs in manually in Chrome, then we automate the applications');
    console.log('  B) We fill the login form automatically (need credentials in profile)');
    console.log('');

    // Check if already logged in (maybe user logged in manually)
    const usernameVisible = await page.locator('#Username').isVisible({ timeout: 2000 }).catch(() => false);
    if (usernameVisible) {
        console.log('Login form is showing. User needs to log in.');
        console.log('Waiting 30 seconds for manual login...');
        
        // Wait for login to complete (URL change back to housingconnect.nyc.gov)
        try {
            await page.waitForURL(/.*housingconnect\.nyc\.gov.*/, { timeout: 60000 });
            console.log('Login detected! URL:', page.url());
            await page.waitForTimeout(3000);
            await page.screenshot({ path: shotDir + 'step2_after_login.png' }).catch(() => {});
        } catch(e) {
            console.log('Login timeout — user may not have logged in');
        }
    }
    
    // Step 4: Check if logged in now
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
    await page.waitForTimeout(3000);
    const dashUrl = page.url();
    console.log('\nDashboard URL:', dashUrl);
    
    if (dashUrl.includes('unauthorized') || dashUrl.includes('login') || dashUrl.includes('auth')) {
        console.log('STATUS: NOT LOGGED IN');
        console.log('User must log in first, then re-run the script.');
    } else {
        console.log('STATUS: LOGGED IN!');
        await page.screenshot({ path: shotDir + 'step3_dashboard.png' }).catch(() => {});
        
        // Step 5: Navigate to a lottery and try to Apply
        console.log('\nStep 5: Navigate to lottery 7548 (Rialto West)');
        await page.goto('https://housingconnect.nyc.gov/PublicWeb/details/7548', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
        await page.waitForTimeout(5000);
        console.log('Lottery URL:', page.url());
        
        // Click Apply Now
        const applyLink = page.locator('a:has-text("Apply Now")').first();
        const applyVisible = await applyLink.isVisible({ timeout: 3000 }).catch(() => false);
        console.log('Apply Now visible:', applyVisible);
        
        if (applyVisible) {
            await applyLink.click();
            await page.waitForTimeout(5000);
            console.log('After Apply URL:', page.url());
            await page.screenshot({ path: shotDir + 'step4_apply_form.png' }).catch(() => {});
            
            // Dump form
            const inputs = await page.locator('input, select, textarea').all();
            console.log('\n=== APPLICATION FORM ===');
            console.log('Inputs (' + inputs.length + '):');
            for (const inp of inputs.slice(0, 40)) {
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
            for (const l of labels.slice(0, 30)) {
                try {
                    const text = (await l.textContent()).trim().substring(0, 60);
                    if (text) console.log('  "' + text + '"');
                } catch(e) {}
            }
            
            const btns = await page.locator('button, a[role="button"]').all();
            console.log('\nButtons (' + btns.length + '):');
            for (const b of btns.slice(0, 20)) {
                try {
                    const text = (await b.textContent()).trim().substring(0, 60);
                    const disabled = await b.isDisabled().catch(() => false);
                    const visible = await b.isVisible().catch(() => false);
                    if (text && visible) console.log('  "' + text + '" disabled=' + disabled);
                } catch(e) {}
            }
            
            const headings = await page.locator('h1, h2, h3, h4, h5').all();
            console.log('\nHeadings:');
            for (const h of headings.slice(0, 15)) {
                try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
            }
            
            // Radios/checkboxes
            const radios = await page.locator('input[type="radio"], input[type="checkbox"]').all();
            console.log('\nRadio/Checkbox (' + radios.length + '):');
            for (const r of radios.slice(0, 20)) {
                try {
                    const type = await r.getAttribute('type') || '';
                    const name = await r.getAttribute('name') || '';
                    const id = await r.getAttribute('id') || '';
                    const visible = await r.isVisible().catch(() => false);
                    if (visible) console.log('  ' + type + ' name=' + name + ' id=' + id);
                } catch(e) {}
            }
            
            // Selects
            const selects = await page.locator('select, mat-select').all();
            console.log('\nSelects (' + selects.length + '):');
            for (const s of selects.slice(0, 10)) {
                try {
                    const tag = await s.evaluate(el => el.tagName);
                    const name = await s.getAttribute('name') || '';
                    const id = await s.getAttribute('id') || '';
                    console.log('  ' + tag + ' name=' + name + ' id=' + id);
                } catch(e) {}
            }
        }
    }
    
    console.log('\n=== COMPLETE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));