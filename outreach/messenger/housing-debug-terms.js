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
    
    // Step 1: Check if logged in — go to dashboard
    console.log('=== Checking login status ===');
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(3000);
    
    if (page.url().includes('unauthorized') || page.url().includes('login') || page.url().includes('auth')) {
        console.log('NOT LOGGED IN');
        console.log('Current URL:', page.url());
        console.log('Please log in at housingconnect.nyc.gov');
        console.log('Waiting for login... (60s timeout)');
        
        // Go to main page and click login
        await page.goto('https://housingconnect.nyc.gov/PublicWeb/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
        await page.waitForTimeout(2000);
        await page.locator('a:has-text("Log In")').first().click().catch(() => {});
        
        // Wait for redirect back
        try {
            await page.waitForURL(/.*housingconnect\.nyc\.gov.*\/dashboard/, { timeout: 90000 });
            console.log('Login detected!');
        } catch(e) {
            console.log('Login timeout. RESULT: NEED_LOGIN');
            browser.close();
            return;
        }
    } else {
        console.log('Already logged in! Dashboard:', page.url());
    }
    
    // Step 2: Navigate to Rialto West lottery
    console.log('\n=== Navigating to Rialto West (7548) ===');
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/details/7548', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(5000);
    console.log('URL:', page.url());
    await page.screenshot({ path: shotDir + 'debug_lottery_detail.png' }).catch(() => {});
    
    // Step 3: Click Apply Now
    console.log('\n=== Clicking Apply Now ===');
    const applyLink = page.locator('a:has-text("Apply Now")').first();
    const applyVisible = await applyLink.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Apply Now visible:', applyVisible);
    
    if (applyVisible) {
        await applyLink.click();
        await page.waitForTimeout(5000);
        console.log('After Apply URL:', page.url());
        await page.screenshot({ path: shotDir + 'debug_after_apply.png' }).catch(() => {});
        
        // Step 4: Deep debug the terms checkbox + Submit button
        console.log('\n=== DEBUGGING TERMS + SUBMIT ===');
        
        // Check the mat-checkbox state
        const matCheckbox = page.locator('mat-checkbox').first();
        const cbInput = page.locator('#mat-checkbox-1-input');
        const cbChecked = await cbInput.isChecked().catch(() => false);
        const cbClass = await matCheckbox.getAttribute('class').catch(() => '');
        console.log('Checkbox checked:', cbChecked);
        console.log('mat-checkbox class:', cbClass);
        
        // Check the Submit button state
        const submitBtn = page.locator('button:has-text("Submit")').first();
        const submitDisabled = await submitBtn.isDisabled().catch(() => true);
        const submitClass = await submitBtn.getAttribute('class').catch(() => '');
        const submitVisible = await submitBtn.isVisible().catch(() => false);
        console.log('Submit disabled:', submitDisabled);
        console.log('Submit visible:', submitVisible);
        console.log('Submit class:', submitClass);
        
        // Check if there's a terms text area that needs scrolling
        // Sometimes you have to scroll through terms before the button enables
        const scrollContainers = await page.locator('[class*="scroll"], [class*="terms"], [class*="condition"], [class*="agreement"], [class*="consent"], [style*="overflow"]').all();
        console.log('\nScrollable/terms containers:', scrollContainers.length);
        for (let i = 0; i < Math.min(scrollContainers.length, 5); i++) {
            try {
                const sc = scrollContainers[i];
                const tag = await sc.evaluate(el => el.tagName);
                const cls = await sc.getAttribute('class') || '';
                const style = await sc.getAttribute('style') || '';
                const text = (await sc.textContent()).trim().substring(0, 100);
                const box = await sc.boundingBox().catch(() => null);
                console.log(`  [${i}] ${tag} class="${cls.substring(0,60)}" style="${style.substring(0,60)}" h=${box ? Math.round(box.height) : '?'} text="${text.substring(0,60)}"`);
            } catch(e) {}
        }
        
        // Try scrolling inside any scrollable containers
        console.log('\nTrying to scroll terms containers...');
        for (let i = 0; i < Math.min(scrollContainers.length, 5); i++) {
            try {
                await scrollContainers[i].evaluate(el => {
                    el.scrollTop = el.scrollHeight;
                });
                await page.waitForTimeout(1000);
                console.log(`  Scrolled container ${i} to bottom`);
            } catch(e) {}
        }
        
        // Try checking the checkbox AFTER scrolling
        if (!await cbInput.isChecked().catch(() => false)) {
            console.log('\nChecking terms checkbox after scrolling...');
            // Click the label area of the mat-checkbox
            const cbLabel = page.locator('mat-checkbox .mat-checkbox-layout, mat-checkbox label, mat-checkbox .mat-checkbox-label').first();
            if (await cbLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
                await cbLabel.click();
                await page.waitForTimeout(1000);
                console.log('Clicked checkbox label, checked:', await cbInput.isChecked().catch(() => false));
            } else {
                // Force click the input
                await cbInput.click({ force: true }).catch(() => {});
                await page.waitForTimeout(1000);
                console.log('Force clicked input, checked:', await cbInput.isChecked().catch(() => false));
            }
        }
        
        // Recheck Submit after all attempts
        const submitDisabled2 = await submitBtn.isDisabled().catch(() => true);
        console.log('\nSubmit disabled after scroll+check:', submitDisabled2);
        
        if (!submitDisabled2) {
            console.log('SUBMIT IS ENABLED! Clicking...');
            await page.screenshot({ path: shotDir + 'debug_terms_accepted.png' }).catch(() => {});
            await submitBtn.click();
            await page.waitForTimeout(5000);
            console.log('After Submit URL:', page.url());
            await page.screenshot({ path: shotDir + 'debug_application_form.png' }).catch(() => {});
            
            // DUMP THE APPLICATION FORM
            console.log('\n=== APPLICATION FORM ===');
            
            const headings = await page.locator('h1, h2, h3, h4, h5').all();
            console.log('Headings:');
            for (const h of headings.slice(0, 20)) {
                try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
            }
            
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
                    const value = await inp.inputValue().catch(() => '');
                    if (visible) console.log(`  [${i}] ${tag} type=${type} name="${name}" id="${id}" placeholder="${placeholder}" aria="${aria}" value="${value}"`);
                } catch(e) {}
            }
            
            const labels = await page.locator('label').all();
            console.log('\nLabels (' + labels.length + '):');
            for (const l of labels.slice(0, 40)) {
                try {
                    const text = (await l.textContent()).trim().substring(0, 60);
                    const forAttr = await l.getAttribute('for') || '';
                    if (text) console.log(`  "${text}" for="${forAttr}"`);
                } catch(e) {}
            }
            
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
            
            // Step indicators
            const steps = await page.locator('[class*="step"], [class*="Step"], [class*="progress"], [class*="wizard"], [class*="breadcrumb"], [role="progressbar"], [role="tab"]').all();
            console.log('\nStep indicators (' + steps.length + '):');
            for (const s of steps.slice(0, 10)) {
                try {
                    const tag = await s.evaluate(el => el.tagName);
                    const text = (await s.textContent()).trim().substring(0, 60);
                    const cls = await s.getAttribute('class') || '';
                    if (text) console.log(`  ${tag}: "${text}" class="${cls.substring(0,40)}"`);
                } catch(e) {}
            }
            
            // Body text
            const bodyText = await page.locator('body').textContent();
            console.log('\nBody text (first 1200):');
            console.log(bodyText.substring(0, 1200));
            
        } else {
            console.log('Submit STILL disabled');
            // Take a final screenshot and dump ALL visible elements near the checkbox
            await page.screenshot({ path: shotDir + 'debug_still_disabled.png' }).catch(() => {});
            
            // Check for any error messages or required indicators
            const errors = await page.locator('[class*="error"], [class*="Error"], [role="alert"], .ng-invalid, .invalid-feedback, [class*="required"]').all();
            console.log('\nError/required elements (' + errors.length + '):');
            for (const e of errors.slice(0, 10)) {
                try {
                    const tag = await e.evaluate(el => el.tagName);
                    const text = (await e.textContent()).trim().substring(0, 60);
                    const cls = await e.getAttribute('class') || '';
                    const visible = await e.isVisible().catch(() => false);
                    if (text) console.log(`  ${tag} visible=${visible} class="${cls.substring(0,50)}" text="${text}"`);
                } catch(e) {}
            }
            
            // Maybe there are MULTIPLE checkboxes that all need checking
            const allCheckboxLabels = await page.locator('mat-checkbox, .mat-checkbox').all();
            console.log('\nAll mat-checkbox elements (' + allCheckboxLabels.length + '):');
            for (let i = 0; i < Math.min(allCheckboxLabels.length, 10); i++) {
                try {
                    const cb = allCheckboxLabels[i];
                    const text = (await cb.textContent()).trim().substring(0, 80);
                    const cls = await cb.getAttribute('class') || '';
                    const visible = await cb.isVisible().catch(() => false);
                    console.log(`  [${i}] visible=${visible} class="${cls.substring(0,50)}" text="${text}"`);
                } catch(e) {}
            }
            
            // Dump the entire HTML around the Submit button for analysis
            const submitHtml = await submitBtn.evaluate(el => {
                let p = el.parentElement;
                for (let i = 0; i < 3; i++) { if (p) p = p.parentElement; }
                return p ? p.innerHTML.substring(0, 2000) : '';
            }).catch(() => '');
            console.log('\nHTML around Submit (parent^3):');
            console.log(submitHtml.substring(0, 1500));
        }
    } else {
        console.log('Apply Now not found');
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));