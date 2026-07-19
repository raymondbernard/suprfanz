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

    // We're already on the listings page. Click "View Details" for the Manhattan listing
    // Looking for "1760 3rd Avenue" which is East Harlem Manhattan
    console.log('=== Looking for Manhattan lottery ===');
    
    // Find the View Details button that's near "1760 3rd Avenue" text
    const allText = await page.locator('body').textContent();
    console.log('Page has 1760 3rd Avenue:', allText.includes('1760 3rd Avenue'));
    console.log('Page has RIALTO:', allText.includes('RIALTO'));
    
    // Let's click "View Details" buttons - try the 3rd one (Manhattan listing was 3rd)
    const viewDetailsBtns = await page.locator('button:has-text("View Details")').all();
    console.log('View Details buttons:', viewDetailsBtns.length);
    
    // Let's try clicking each View Details and check which one is Manhattan
    for (let i = 0; i < viewDetailsBtns.length; i++) {
        const btn = viewDetailsBtns[i];
        // Get parent context to find the lottery name
        const parentText = await btn.evaluate(el => {
            let p = el.parentElement;
            for (let j = 0; j < 5; j++) {
                if (p) p = p.parentElement;
            }
            return p ? p.textContent.substring(0, 200) : '';
        }).catch(() => '');
        console.log('Button ' + i + ': ' + parentText.substring(0, 80));
    }
    
    // Click the one that mentions Manhattan or 1760
    // Based on headings: Starhill (Bronx), Columbia Commons (Brooklyn), 1760 3rd Ave (Manhattan)
    // So button index 2 (third one) should be Manhattan
    console.log('\n=== Clicking View Details for Manhattan lottery (index 2) ===');
    await viewDetailsBtns[2].click();
    await page.waitForTimeout(5000);
    console.log('URL after click:', page.url());
    await page.screenshot({ path: shotDir + '03_lottery_detail_manhattan.png', fullPage: true });
    
    // Inspect the detail page
    console.log('\n--- Lottery Detail Page ---');
    
    // Headings
    const headings = await page.locator('h1, h2, h3, h4').all();
    console.log('\nHeadings:');
    for (const h of headings.slice(0, 15)) {
        try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
    }
    
    // Buttons
    const buttons = await page.locator('button, [role="button"]').all();
    console.log('\nButtons (' + buttons.length + '):');
    for (const b of buttons.slice(0, 25)) {
        try {
            const text = (await b.textContent()).trim().substring(0, 60);
            const visible = await b.isVisible().catch(() => false);
            if (text && visible) console.log('  "' + text + '"');
        } catch(e) {}
    }
    
    // Look for Apply button specifically
    const applyBtns = await page.locator('button:has-text("Apply"), a:has-text("Apply"), button:has-text("Apply Now")').all();
    console.log('\nApply buttons:', applyBtns.length);
    
    // Links
    const links = await page.locator('a').all();
    console.log('\nLinks (' + links.length + '):');
    for (const a of links.slice(0, 20)) {
        try {
            const text = (await a.textContent()).trim().substring(0, 60);
            const href = await a.getAttribute('href') || '';
            if (text && href) console.log('  "' + text + '" -> ' + href);
        } catch(e) {}
    }
    
    // Click Apply if found
    if (applyBtns.length > 0) {
        console.log('\n=== Clicking Apply button ===');
        await applyBtns[0].click();
        await page.waitForTimeout(5000);
        console.log('URL after Apply:', page.url());
        await page.screenshot({ path: shotDir + '04_application_form.png', fullPage: true });
        
        // Dump form structure
        console.log('\n--- Application Form ---');
        
        // All visible inputs
        const inputs = await page.locator('input, select, textarea').all();
        console.log('\nInputs (' + inputs.length + '):');
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
        
        // Labels
        const labels = await page.locator('label').all();
        console.log('\nLabels (' + labels.length + '):');
        for (const l of labels.slice(0, 30)) {
            try {
                const text = (await l.textContent()).trim().substring(0, 60);
                if (text) console.log('  "' + text + '"');
            } catch(e) {}
        }
        
        // Headings on form page
        const formH = await page.locator('h1, h2, h3, h4, h5').all();
        console.log('\nForm headings:');
        for (const h of formH.slice(0, 15)) {
            try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
        }
        
        // Form buttons
        const formBtns = await page.locator('button').all();
        console.log('\nForm buttons (' + formBtns.length + '):');
        for (const b of formBtns.slice(0, 20)) {
            try {
                const text = (await b.textContent()).trim().substring(0, 60);
                const disabled = await b.isDisabled().catch(() => false);
                const visible = await b.isVisible().catch(() => false);
                if (text && visible) console.log('  "' + text + '" disabled=' + disabled);
            } catch(e) {}
        }
        
        // Radio/checkbox groups
        const radios = await page.locator('input[type="radio"], input[type="checkbox"]').all();
        console.log('\nRadios/Checkboxes (' + radios.length + '):');
        for (const r of radios.slice(0, 20)) {
            try {
                const type = await r.getAttribute('type');
                const name = await r.getAttribute('name') || '';
                const value = await r.getAttribute('value') || '';
                const id = await r.getAttribute('id') || '';
                const checked = await r.isChecked().catch(() => false);
                console.log('  ' + type + ' name=' + name + ' value=' + value + ' id=' + id + ' checked=' + checked);
            } catch(e) {}
        }
        
        // Select dropdowns
        const selects = await page.locator('select').all();
        console.log('\nSelects (' + selects.length + '):');
        for (const s of selects.slice(0, 10)) {
            try {
                const name = await s.getAttribute('name') || '';
                const id = await s.getAttribute('id') || '';
                const options = await s.locator('option').allTextContents();
                console.log('  select name=' + name + ' id=' + id + ' options=' + JSON.stringify(options.slice(0, 10)));
            } catch(e) {}
        }
        
        // Step/progress indicators
        const steps = await page.locator('[class*="step"], [class*="Step"], [class*="progress"], [class*="wizard"], [class*="breadcrumb"]').all();
        console.log('\nStep indicators (' + steps.length + '):');
        for (const s of steps.slice(0, 10)) {
            try {
                const text = (await s.textContent()).trim().substring(0, 80);
                const cls = await s.getAttribute('class') || '';
                if (text) console.log('  "' + text + '" class=' + cls.substring(0, 50));
            } catch(e) {}
        }
        
        // Any error messages
        const errors = await page.locator('[class*="error"], [class*="Error"], [role="alert"], .invalid-feedback').all();
        console.log('\nError elements (' + errors.length + '):');
        for (const e of errors.slice(0, 10)) {
            try {
                const text = (await e.textContent()).trim().substring(0, 60);
                if (text) console.log('  ' + text);
            } catch(e) {}
        }
        
    } else {
        console.log('No Apply button found on detail page');
        // Take a full page screenshot for debugging
        await page.screenshot({ path: shotDir + '03b_no_apply_button.png', fullPage: true });
    }
    
    console.log('\n=== INSPECTION COMPLETE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));