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

    // Navigate directly to the Manhattan lottery detail page (1760 3rd Avenue, lottery 7569)
    console.log('=== Navigating to lottery 7569 (1760 3rd Avenue) ===');
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/details/7569', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(5000);
    console.log('URL:', page.url());
    
    // Quick screenshot (viewport only, not fullPage to avoid timeout)
    await page.screenshot({ path: shotDir + '03_lottery_detail.png' }).catch(e => console.log('Screenshot error:', e.message));
    
    // Dump headings
    const headings = await page.locator('h1, h2, h3, h4').all();
    console.log('\nHeadings:');
    for (const h of headings.slice(0, 20)) {
        try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
    }
    
    // Dump buttons
    const buttons = await page.locator('button, [role="button"]').all();
    console.log('\nButtons (' + buttons.length + '):');
    for (const b of buttons.slice(0, 25)) {
        try {
            const text = (await b.textContent()).trim().substring(0, 60);
            const visible = await b.isVisible().catch(() => false);
            if (text && visible) console.log('  "' + text + '"');
        } catch(e) {}
    }
    
    // Look for Apply
    const applyBtns = await page.locator('button:has-text("Apply"), a:has-text("Apply"), button:has-text("Apply Now")').all();
    console.log('\nApply buttons:', applyBtns.length);
    for (const b of applyBtns) {
        try {
            const text = (await b.textContent()).trim();
            const visible = await b.isVisible().catch(() => false);
            console.log('  "' + text + '" visible=' + visible);
        } catch(e) {}
    }
    
    // Links
    const links = await page.locator('a').all();
    console.log('\nLinks (' + links.length + '):');
    for (const a of links.slice(0, 25)) {
        try {
            const text = (await a.textContent()).trim().substring(0, 60);
            const href = await a.getAttribute('href') || '';
            if (text && (href || text.includes('Apply'))) console.log('  "' + text + '" -> ' + href);
        } catch(e) {}
    }
    
    // Inputs on detail page
    const inputs = await page.locator('input, select').all();
    console.log('\nInputs (' + inputs.length + '):');
    for (const inp of inputs.slice(0, 15)) {
        try {
            const tag = await inp.evaluate(el => el.tagName);
            const name = await inp.getAttribute('name') || '';
            const id = await inp.getAttribute('id') || '';
            const type = await inp.getAttribute('type') || '';
            console.log('  ' + tag + ' type=' + type + ' name=' + name + ' id=' + id);
        } catch(e) {}
    }
    
    // If we have an Apply button, click it
    if (applyBtns.length > 0) {
        console.log('\n=== Clicking Apply ===');
        await applyBtns[0].click();
        await page.waitForTimeout(5000);
        console.log('URL after Apply:', page.url());
        await page.screenshot({ path: shotDir + '04_application_form.png' }).catch(e => console.log('Screenshot error:', e.message));
        
        // Dump form structure
        console.log('\n--- Application Form ---');
        
        // Headings
        const formH = await page.locator('h1, h2, h3, h4, h5').all();
        console.log('\nForm headings:');
        for (const h of formH.slice(0, 15)) {
            try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
        }
        
        // All inputs
        const formInputs = await page.locator('input, select, textarea').all();
        console.log('\nInputs (' + formInputs.length + '):');
        for (const inp of formInputs.slice(0, 40)) {
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
        
        // Labels
        const labels = await page.locator('label').all();
        console.log('\nLabels (' + labels.length + '):');
        for (const l of labels.slice(0, 30)) {
            try {
                const text = (await l.textContent()).trim().substring(0, 60);
                if (text) console.log('  "' + text + '"');
            } catch(e) {}
        }
        
        // Buttons
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
        
        // Radio/checkbox
        const radios = await page.locator('input[type="radio"], input[type="checkbox"]').all();
        console.log('\nRadios/Checkboxes (' + radios.length + '):');
        for (const r of radios.slice(0, 20)) {
            try {
                const type = await r.getAttribute('type');
                const name = await r.getAttribute('name') || '';
                const value = await r.getAttribute('value') || '';
                const id = await r.getAttribute('id') || '';
                console.log('  ' + type + ' name=' + name + ' value=' + value + ' id=' + id);
            } catch(e) {}
        }
        
        // Selects
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
        
    } else {
        console.log('\nNo Apply button found. Need to log in first?');
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));