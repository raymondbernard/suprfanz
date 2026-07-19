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
    
    console.log('URL:', page.url());
    
    // Check the terms checkbox and click Submit to get to the actual form
    console.log('\n=== Checking terms checkbox ===');
    const termsCheckbox = page.locator('#mat-checkbox-1-input');
    const isChecked = await termsCheckbox.isChecked().catch(() => false);
    console.log('Terms checked:', isChecked);
    
    if (!isChecked) {
        // Click the mat-checkbox (the visual element, not the hidden input)
        const matCheckbox = page.locator('mat-checkbox').first();
        await matCheckbox.click();
        await page.waitForTimeout(1000);
        console.log('Clicked terms checkbox');
        await page.screenshot({ path: shotDir + 'test_terms_checked.png' }).catch(() => {});
    }
    
    // Now check if Submit button is enabled
    const submitBtn = page.locator('button:has-text("Submit")');
    const submitDisabled = await submitBtn.isDisabled().catch(() => true);
    console.log('Submit disabled:', submitDisabled);
    
    if (!submitDisabled) {
        console.log('Clicking Submit to proceed to application form...');
        await submitBtn.click();
        await page.waitForTimeout(5000);
        console.log('After Submit URL:', page.url());
        await page.screenshot({ path: shotDir + 'test_after_terms.png' }).catch(() => {});
        
        // NOW inspect the actual application form
        console.log('\n=== APPLICATION FORM (after terms) ===');
        
        // Headings
        const headings = await page.locator('h1, h2, h3, h4, h5').all();
        console.log('\nHeadings (' + headings.length + '):');
        for (const h of headings.slice(0, 20)) {
            try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
        }
        
        // All inputs
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
                const visible = await inp.isVisible().catch(() => false);
                const required = await inp.getAttribute('required') !== null;
                const value = await inp.inputValue().catch(() => '');
                if (visible) console.log(`  [${i}] ${tag} type=${type} name="${name}" id="${id}" placeholder="${placeholder}" aria="${aria}" required=${required} value="${value}"`);
            } catch(e) {}
        }
        
        // Labels
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
        const btns = await page.locator('button, a[role="button"]').all();
        console.log('\nButtons (' + btns.length + '):');
        for (const b of btns.slice(0, 25)) {
            try {
                const text = (await b.textContent()).trim().substring(0, 60);
                const disabled = await b.isDisabled().catch(() => false);
                const visible = await b.isVisible().catch(() => false);
                if (text && visible) console.log(`  "${text}" disabled=${disabled}`);
            } catch(e) {}
        }
        
        // Radio/checkbox
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
                let labelText = '';
                if (id) {
                    const lbl = page.locator(`label[for="${id}"]`);
                    if (await lbl.count() > 0) labelText = (await lbl.textContent()).trim().substring(0, 40);
                }
                console.log(`  [${i}] ${type} name="${name}" id="${id}" value="${value}" checked=${checked} label="${labelText}"`);
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
                console.log(`  name="${name}" id="${id}" options=${JSON.stringify(options.slice(0, 15))}`);
            } catch(e) {}
        }
        
        // mat- components
        const mats = await page.locator('mat-radio-button, mat-checkbox, mat-select, mat-form-field, mat-label, mat-radio-group').all();
        console.log('\nMat components (' + mats.length + '):');
        for (const m of mats.slice(0, 25)) {
            try {
                const tag = await m.evaluate(el => el.tagName);
                const text = (await m.textContent()).trim().substring(0, 60);
                if (text) console.log(`  ${tag}: "${text}"`);
            } catch(e) {}
        }
        
        // Step/progress
        const steps = await page.locator('[class*="step"], [class*="Step"], [class*="progress"], [class*="wizard"]').all();
        console.log('\nStep indicators (' + steps.length + '):');
        for (const s of steps.slice(0, 10)) {
            try {
                const text = (await s.textContent()).trim().substring(0, 60);
                if (text) console.log('  "' + text + '"');
            } catch(e) {}
        }
        
        // Body text
        const bodyText = await page.locator('body').textContent();
        console.log('\nBody text (first 1000):');
        console.log(bodyText.substring(0, 1000));
        
    } else {
        console.log('Submit still disabled after checking terms');
        // Maybe need to scroll to see terms text
        await page.evaluate(() => window.scrollTo(0, 300));
        await page.waitForTimeout(2000);
        await page.screenshot({ path: shotDir + 'test_terms_scrolled.png' }).catch(() => {});
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));