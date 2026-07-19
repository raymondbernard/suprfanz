const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    const pages = context.pages();
    let page = pages[0];
    for (const p of pages) {
        try { if (p.url().includes('housingconnect')) { page = p; break; } } catch(e) {}
    }

    const shotDir = 'C:/Users/RayBe/.openclaw/workspace/housing/applications/screenshots/';
    
    // We should be on the language step with ddlLanguage visible
    console.log('=== Selecting language ===');
    
    // Select English in the dropdown
    const langSelect = page.locator('#ddlLanguage');
    const vis = await langSelect.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Language select visible:', vis);
    
    if (vis) {
        // Get options
        const options = await langSelect.locator('option').allTextContents();
        console.log('Options:', options);
        
        // Select English
        await langSelect.selectOption('English');
        await page.waitForTimeout(1000);
        console.log('Selected English');
        
        // Also select unit sizes (mat-select)
        const unitSelect = page.locator('mat-select').first();
        const unitVis = await unitSelect.isVisible({ timeout: 2000 }).catch(() => false);
        console.log('Unit size select visible:', unitVis);
        if (unitVis) {
            console.log('Clicking unit size select...');
            await unitSelect.click();
            await page.waitForTimeout(1000);
            
            // Dump the options
            const matOptions = await page.locator('mat-option').all();
            console.log('Unit size options (' + matOptions.length + '):');
            for (let i = 0; i < matOptions.length; i++) {
                try {
                    const text = (await matOptions[i].textContent()).trim().substring(0, 40);
                    const v = await matOptions[i].isVisible().catch(() => false);
                    console.log('  [' + i + '] visible=' + v + ' text="' + text + '"');
                } catch(e) {}
            }
            
            // Select Studio and 1 Bedroom
            // Click each option
            for (const opt of matOptions) {
                try {
                    const text = (await opt.textContent()).trim().toLowerCase();
                    if (text.includes('studio') || text.includes('1 bed') || text.includes('one bed')) {
                        console.log('Selecting: ' + text);
                        await opt.click();
                        await page.waitForTimeout(500);
                    }
                } catch(e) {}
            }
            
            // Close the dropdown by clicking elsewhere
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
        }
        
        await page.screenshot({ path: shotDir + 'setup_language_selected.png' }).catch(() => {});
        
        // Now check if Start Setup is enabled
        const startBtn = page.locator('button:has-text("Start Setup")');
        const startDis = await startBtn.isDisabled().catch(() => true);
        console.log('\nStart Setup disabled:', startDis);
        
        if (!startDis) {
            console.log('Start Setup is ENABLED! Clicking...');
            await startBtn.click();
            await page.waitForTimeout(3000);
            console.log('After Start Setup URL:', page.url());
            await page.screenshot({ path: shotDir + 'setup_step2_members.png' }).catch(() => {});
            
            // Dump step 2 — Household Members
            console.log('\n=== Step 2: Household Members ===');
            
            const inputs = await page.locator('input, select, mat-select').all();
            console.log('Inputs (' + inputs.length + '):');
            for (const inp of inputs) {
                try {
                    const tag = await inp.evaluate(e => e.tagName);
                    const type = await inp.getAttribute('type') || '';
                    const id = await inp.getAttribute('id') || '';
                    const placeholder = await inp.getAttribute('placeholder') || '';
                    const v = await inp.isVisible().catch(() => false);
                    const val = await inp.inputValue().catch(() => '');
                    if (v) console.log('  ' + tag + ' type=' + type + ' id=' + id + ' placeholder=' + placeholder + ' value=' + val);
                } catch(e) {}
            }
            
            const labels = await page.locator('label').all();
            console.log('Labels:');
            for (const l of labels.slice(0, 20)) {
                try {
                    const text = (await l.textContent()).trim().substring(0, 60);
                    const v = await l.isVisible().catch(() => false);
                    if (text && v) console.log('  "' + text + '"');
                } catch(e) {}
            }
            
            const btns = await page.locator('button').all();
            console.log('Buttons:');
            for (const b of btns.slice(0, 15)) {
                try {
                    const text = (await b.textContent()).trim().substring(0, 60);
                    const v = await b.isVisible().catch(() => false);
                    const d = await b.isDisabled().catch(() => false);
                    if (text && v) console.log('  "' + text + '" disabled=' + d);
                } catch(e) {}
            }
            
            // Check for "Add Member" button
            const addBtn = page.locator('button:has-text("Add Member"), button:has-text("Add")').first();
            const addVis = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);
            console.log('Add Member visible:', addVis);
            
            if (addVis) {
                console.log('Clicking Add Member...');
                await addBtn.click();
                await page.waitForTimeout(2000);
                await page.screenshot({ path: shotDir + 'setup_add_member_form.png' }).catch(() => {});
                
                // Dump member form
                const memberInputs = await page.locator('input, select, mat-select').all();
                console.log('Member form inputs (' + memberInputs.length + '):');
                for (const inp of memberInputs) {
                    try {
                        const tag = await inp.evaluate(e => e.tagName);
                        const type = await inp.getAttribute('type') || '';
                        const id = await inp.getAttribute('id') || '';
                        const placeholder = await inp.getAttribute('placeholder') || '';
                        const v = await inp.isVisible().catch(() => false);
                        if (v) console.log('  ' + tag + ' type=' + type + ' id=' + id + ' placeholder=' + placeholder);
                    } catch(e) {}
                }
                
                const memberLabels = await page.locator('label').all();
                console.log('Member labels:');
                for (const l of memberLabels.slice(0, 15)) {
                    try {
                        const text = (await l.textContent()).trim().substring(0, 60);
                        const v = await l.isVisible().catch(() => false);
                        if (text && v) console.log('  "' + text + '"');
                    } catch(e) {}
                }
                
                const memberBtns = await page.locator('button').all();
                console.log('Member buttons:');
                for (const b of memberBtns.slice(0, 10)) {
                    try {
                        const text = (await b.textContent()).trim().substring(0, 60);
                        const v = await b.isVisible().catch(() => false);
                        const d = await b.isDisabled().catch(() => false);
                        if (text && v) console.log('  "' + text + '" disabled=' + d);
                    } catch(e) {}
                }
            }
            
            // Body text
            const bodyText = await page.locator('body').textContent();
            console.log('\nBody text (first 1200):');
            console.log(bodyText.substring(0, 1200));
        } else {
            console.log('Start Setup still disabled — need more fields');
            // Check what else is visible
            const allInputs = await page.locator('input, select, mat-select').all();
            console.log('\nAll visible inputs:');
            for (const inp of allInputs) {
                try {
                    const tag = await inp.evaluate(e => e.tagName);
                    const id = await inp.getAttribute('id') || '';
                    const v = await inp.isVisible().catch(() => false);
                    if (v) console.log('  ' + tag + ' id=' + id);
                } catch(e) {}
            }
        }
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));