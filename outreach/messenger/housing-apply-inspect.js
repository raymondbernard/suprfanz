const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    let page = null;
    for (const p of context.pages()) {
        try { if (p.url().includes('housingconnect')) { page = p; break; } } catch(e) {}
    }
    if (!page) page = context.pages[0];

    const shotDir = 'C:/Users/RayBe/.openclaw/workspace/housing/applications/screenshots/';
    
    // Step 1: Navigate to Rialto West lottery detail
    console.log('=== Navigating to Rialto West (lottery 7548) ===');
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/details/7548', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(5000);
    console.log('URL:', page.url());
    await page.screenshot({ path: shotDir + 'test_lottery_detail.png' }).catch(() => {});
    
    // Step 2: Click Apply Now
    console.log('\n=== Clicking Apply Now ===');
    const applyLink = page.locator('a:has-text("Apply Now")').first();
    const applyVisible = await applyLink.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Apply Now visible:', applyVisible);
    
    if (applyVisible) {
        await applyLink.click();
        console.log('Clicked Apply Now, waiting for form...');
        await page.waitForTimeout(5000);
        console.log('After Apply URL:', page.url());
        await page.screenshot({ path: shotDir + 'test_apply_form.png' }).catch(() => {});
        
        // Step 3: Inspect the application form thoroughly
        console.log('\n=== APPLICATION FORM INSPECTION ===');
        
        // Headings
        const headings = await page.locator('h1, h2, h3, h4, h5').all();
        console.log('\nHeadings (' + headings.length + '):');
        for (const h of headings.slice(0, 20)) {
            try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
        }
        
        // All visible inputs with full detail
        const inputs = await page.locator('input, select, textarea').all();
        console.log('\nInputs (' + inputs.length + '):');
        for (let i = 0; i < Math.min(inputs.length, 50); i++) {
            try {
                const inp = inputs[i];
                const tag = await inp.evaluate(el => el.tagName);
                const type = await inp.getAttribute('type') || '';
                const name = await inp.getAttribute('name') || '';
                const id = await inp.getAttribute('id') || '';
                const placeholder = await inp.getAttribute('placeholder') || '';
                const aria = await inp.getAttribute('aria-label') || '';
                const cls = await inp.getAttribute('class') || '';
                const visible = await inp.isVisible().catch(() => false);
                const required = await inp.getAttribute('required') !== null;
                const value = await inp.inputValue().catch(() => '');
                if (visible) console.log(`  [${i}] ${tag} type=${type} name="${name}" id="${id}" placeholder="${placeholder}" aria="${aria}" required=${required} value="${value}" class="${cls.substring(0,40)}"`);
            } catch(e) {}
        }
        
        // Labels with for attribute
        const labels = await page.locator('label').all();
        console.log('\nLabels (' + labels.length + '):');
        for (const l of labels.slice(0, 40)) {
            try {
                const text = (await l.textContent()).trim().substring(0, 60);
                const forAttr = await l.getAttribute('for') || '';
                if (text) console.log(`  "${text}" for="${forAttr}"`);
            } catch(e) {}
        }
        
        // Buttons
        const btns = await page.locator('button, a[role="button"], input[type="submit"]').all();
        console.log('\nButtons (' + btns.length + '):');
        for (const b of btns.slice(0, 25)) {
            try {
                const text = (await b.textContent()).trim().substring(0, 60);
                const disabled = await b.isDisabled().catch(() => false);
                const visible = await b.isVisible().catch(() => false);
                const cls = await b.getAttribute('class') || '';
                if (text && visible) console.log(`  "${text}" disabled=${disabled} class="${cls.substring(0,40)}"`);
            } catch(e) {}
        }
        
        // Radio/checkbox with labels
        const radios = await page.locator('input[type="radio"], input[type="checkbox"]').all();
        console.log('\nRadio/Checkbox (' + radios.length + '):');
        for (let i = 0; i < Math.min(radios.length, 30); i++) {
            try {
                const r = radios[i];
                const type = await r.getAttribute('type') || '';
                const name = await r.getAttribute('name') || '';
                const id = await r.getAttribute('id') || '';
                const value = await r.getAttribute('value') || '';
                const checked = await r.isChecked().catch(() => false);
                const visible = await r.isVisible().catch(() => false);
                // Try to find associated label
                let labelText = '';
                if (id) {
                    const lbl = page.locator(`label[for="${id}"]`);
                    if (await lbl.count() > 0) labelText = (await lbl.textContent()).trim().substring(0, 40);
                }
                if (visible || !visible) console.log(`  [${i}] ${type} name="${name}" id="${id}" value="${value}" checked=${checked} visible=${visible} label="${labelText}"`);
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
                console.log(`  name="${name}" id="${id}" options=${JSON.stringify(options.slice(0, 15))}`);
            } catch(e) {}
        }
        
        // Step indicators / progress
        const stepEls = await page.locator('[class*="step"], [class*="Step"], [class*="progress"], [class*="Progress"], [class*="wizard"], [class*="breadcrumb"], [role="progressbar"]').all();
        console.log('\nStep indicators (' + stepEls.length + '):');
        for (const s of stepEls.slice(0, 10)) {
            try {
                const text = (await s.textContent()).trim().substring(0, 60);
                const cls = await s.getAttribute('class') || '';
                if (text) console.log(`  "${text}" class="${cls.substring(0,50)}"`);
            } catch(e) {}
        }
        
        // Any mat- Angular Material components
        const matComponents = await page.locator('mat-radio-button, mat-checkbox, mat-select, mat-form-field, mat-label').all();
        console.log('\nAngular Material components (' + matComponents.length + '):');
        for (const m of matComponents.slice(0, 20)) {
            try {
                const tag = await m.evaluate(el => el.tagName);
                const text = (await m.textContent()).trim().substring(0, 60);
                const visible = await m.isVisible().catch(() => false);
                if (text) console.log(`  ${tag} visible=${visible} text="${text}"`);
            } catch(e) {}
        }
        
        // Body text snippet
        const bodyText = await page.locator('body').textContent();
        console.log('\nBody text (first 800 chars):');
        console.log(bodyText.substring(0, 800));
        
    } else {
        console.log('Apply Now not found!');
    }
    
    console.log('\n=== INSPECTION COMPLETE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));