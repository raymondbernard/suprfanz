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

    // Go to main page
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
    await page.waitForTimeout(3000);

    // Check nav links — are we logged in?
    const navLinks = await page.locator('nav a, header a, .navbar a, [class*="nav"] a').all();
    console.log('Nav links:');
    for (const a of navLinks.slice(0, 20)) {
        try {
            const text = (await a.textContent()).trim().substring(0, 40);
            const href = await a.getAttribute('href') || '';
            if (text) console.log('  "' + text + '" -> ' + href);
        } catch(e) {}
    }

    // Check if "My Dashboard" / "My Applications" links exist
    const dashboardLink = page.locator('a:has-text("My Dashboard"), a:has-text("My Applications"), a:has-text("My Household")');
    const dashCount = await dashboardLink.count();
    console.log('\nDashboard links found:', dashCount);
    
    if (dashCount === 0) {
        console.log('\n=== NOT LOGGED IN — need to log in ===');
        console.log('Clicking Log In link...');
        const loginLink = page.locator('a:has-text("Log In")').first();
        await loginLink.click();
        await page.waitForTimeout(5000);
        console.log('Login URL:', page.url());
        await page.screenshot({ path: shotDir + 'login_form.png' }).catch(() => {});
        
        // Inspect login form on auth server
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
        
        const loginLabels = await page.locator('label').all();
        console.log('\nLogin labels (' + loginLabels.length + '):');
        for (const l of loginLabels.slice(0, 10)) {
            try {
                const text = (await l.textContent()).trim().substring(0, 60);
                if (text) console.log('  "' + text + '"');
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
        
        const loginHeadings = await page.locator('h1, h2, h3').all();
        console.log('\nLogin headings:');
        for (const h of loginHeadings.slice(0, 10)) {
            try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
        }
        
        // Check for "Remember Me" checkbox
        const checkboxes = await page.locator('input[type="checkbox"]').all();
        console.log('\nCheckboxes (' + checkboxes.length + '):');
        for (const c of checkboxes.slice(0, 5)) {
            try {
                const name = await c.getAttribute('name') || '';
                const id = await c.getAttribute('id') || '';
                console.log('  checkbox name=' + name + ' id=' + id);
            } catch(e) {}
        }
        
        console.log('\n=== LOGIN FORM MAPPED ===');
        console.log('The login is on a separate auth server (a806-housingconnectapi.nyc.gov)');
        console.log('Fields needed: email/username + password');
        console.log('This CAN be automated — it is a standard form, not a SPA');
        
    } else {
        console.log('\n=== LOGGED IN ===');
        // Go to dashboard to confirm
        await page.goto('https://housingconnect.nyc.gov/PublicWeb/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
        await page.waitForTimeout(3000);
        console.log('Dashboard URL:', page.url());
        await page.screenshot({ path: shotDir + 'dashboard.png' }).catch(() => {});
        
        const dashHeadings = await page.locator('h1, h2, h3').all();
        console.log('\nDashboard headings:');
        for (const h of dashHeadings.slice(0, 10)) {
            try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
        }
        
        // Now try applying to a lottery
        console.log('\n=== Going to lottery 7548 to apply ===');
        await page.goto('https://housingconnect.nyc.gov/PublicWeb/details/7548', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
        await page.waitForTimeout(5000);
        
        const applyLink = page.locator('a:has-text("Apply Now")').first();
        const applyVisible = await applyLink.isVisible({ timeout: 3000 }).catch(() => false);
        console.log('Apply Now visible:', applyVisible);
        
        if (applyVisible) {
            await applyLink.click();
            await page.waitForTimeout(5000);
            console.log('After Apply URL:', page.url());
            await page.screenshot({ path: shotDir + 'apply_form.png' }).catch(() => {});
            
            // Dump form
            const formInputs = await page.locator('input, select, textarea').all();
            console.log('\nApplication form inputs (' + formInputs.length + '):');
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
            for (const l of formLabels.slice(0, 30)) {
                try {
                    const text = (await l.textContent()).trim().substring(0, 60);
                    if (text) console.log('  "' + text + '"');
                } catch(e) {}
            }
            
            const formBtns = await page.locator('button, a[role="button"]').all();
            console.log('\nButtons (' + formBtns.length + '):');
            for (const b of formBtns.slice(0, 20)) {
                try {
                    const text = (await b.textContent()).trim().substring(0, 60);
                    const visible = await b.isVisible().catch(() => false);
                    if (text && visible) console.log('  "' + text + '"');
                } catch(e) {}
            }
            
            const formHeadings = await page.locator('h1, h2, h3, h4, h5').all();
            console.log('\nHeadings:');
            for (const h of formHeadings.slice(0, 15)) {
                try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
            }
        }
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));