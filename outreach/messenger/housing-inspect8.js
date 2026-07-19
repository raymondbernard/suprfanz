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

    // We're on Rialto West detail page
    console.log('URL:', page.url());
    
    // Click "Apply Now" link (it's an <a> not a <button>)
    console.log('=== Clicking Apply Now link ===');
    const applyLink = page.locator('a:has-text("Apply Now")').first();
    const visible = await applyLink.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Apply Now visible:', visible);
    
    if (visible) {
        await applyLink.click();
        await page.waitForTimeout(5000);
        console.log('After click URL:', page.url());
        await page.screenshot({ path: shotDir + 'after_apply_click.png' }).catch(() => {});
        
        // Dump everything
        console.log('\n=== PAGE AFTER APPLY CLICK ===');
        
        // Headings
        const headings = await page.locator('h1, h2, h3, h4, h5').all();
        console.log('\nHeadings:');
        for (const h of headings.slice(0, 20)) {
            try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
        }
        
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
        
        // Buttons
        const btns = await page.locator('button, [role="button"], a[role="button"]').all();
        console.log('\nButtons (' + btns.length + '):');
        for (const b of btns.slice(0, 20)) {
            try {
                const text = (await b.textContent()).trim().substring(0, 60);
                const disabled = await b.isDisabled().catch(() => false);
                const visible = await b.isVisible().catch(() => false);
                if (text && visible) console.log('  "' + text + '" disabled=' + disabled);
            } catch(e) {}
        }
        
        // Radios/checkboxes (including Angular Material)
        const radios = await page.locator('input[type="radio"], input[type="checkbox"], mat-radio-button, mat-checkbox').all();
        console.log('\nRadio/Checkbox (' + radios.length + '):');
        for (const r of radios.slice(0, 20)) {
            try {
                const tag = await r.evaluate(el => el.tagName);
                const type = await r.getAttribute('type') || '';
                const name = await r.getAttribute('name') || '';
                const id = await r.getAttribute('id') || '';
                const cls = await r.getAttribute('class') || '';
                const visible = await r.isVisible().catch(() => false);
                console.log('  ' + tag + ' type=' + type + ' name=' + name + ' id=' + id + ' visible=' + visible + ' class=' + cls.substring(0, 40));
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
        
        // Check for dialogs/modals
        const dialogs = await page.locator('[role="dialog"], [class*="modal"], [class*="dialog"], [class*="overlay"]').all();
        console.log('\nDialogs/modals (' + dialogs.length + '):');
        for (const d of dialogs.slice(0, 5)) {
            try {
                const text = (await d.textContent()).trim().substring(0, 200);
                const visible = await d.isVisible().catch(() => false);
                console.log('  visible=' + visible + ' text="' + text.substring(0, 150) + '"');
            } catch(e) {}
        }
        
        // Full body text snippet (first 500 chars)
        const bodyText = await page.locator('body').textContent();
        console.log('\nBody text (first 500):', bodyText.substring(0, 500));
        
        // Check if redirected to login
        if (page.url().includes('login') || page.url().includes('auth') || page.url().includes('a806')) {
            console.log('\n*** REDIRECTED TO LOGIN ***');
        }
    } else {
        console.log('Apply Now not visible');
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));