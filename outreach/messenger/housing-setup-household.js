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
    
    // Make sure we're on the household setup page
    if (!page.url().includes('household/setup')) {
        await page.goto('https://housingconnect.nyc.gov/PublicWeb/household/setup', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
        await page.waitForTimeout(3000);
    }
    
    console.log('URL:', page.url());
    console.log('=== FILLING HOUSEHOLD SETUP ===');
    
    // Step 1: Account confirmation — name and email already filled
    // Just click the first "Next" button to advance
    console.log('\n--- Step 1: Account Confirmation ---');
    
    // Check if there's a language dropdown to select
    const langSelect = page.locator('#ddlLanguage, mat-select, select').first();
    const langVisible = await langSelect.isVisible({ timeout: 2000 }).catch(() => false);
    if (langVisible) {
        console.log('Language selector visible — selecting English');
        try {
            await langSelect.selectOption('English').catch(async () => {
                // Might be a mat-select
                await langSelect.click();
                await page.waitForTimeout(1000);
                await page.locator('mat-option:has-text("English")').first().click().catch(() => {});
            });
            await page.waitForTimeout(500);
        } catch(e) { console.log('Language select error:', e.message); }
    }
    
    // Click the FIRST Next button (step 1 -> step 2)
    const nextBtns = await page.locator('button:has-text("Next")').all();
    console.log('Next buttons found:', nextBtns.length);
    
    // Click the first visible, enabled Next
    for (const btn of nextBtns) {
        const visible = await btn.isVisible().catch(() => false);
        const disabled = await btn.isDisabled().catch(() => true);
        if (visible && !disabled) {
            console.log('Clicking Next (step 1)');
            await btn.click();
            await page.waitForTimeout(2000);
            break;
        }
    }
    
    // Step 2: Household Members — need to add Genesis as a member
    console.log('\n--- Step 2: Household Members ---');
    await page.screenshot({ path: shotDir + 'step2_members.png' }).catch(() => {});
    
    // Look for "Add Member" button
    const addMemberBtn = page.locator('button:has-text("Add Member"), button:has-text("Add")').first();
    const addVisible = await addMemberBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Add Member visible:', addVisible);
    
    if (addVisible) {
        await addMemberBtn.click();
        await page.waitForTimeout(2000);
        console.log('Clicked Add Member');
        await page.screenshot({ path: shotDir + 'step2_add_member_form.png' }).catch(() => {});
        
        // Dump the member form
        const memberInputs = await page.locator('input, select, mat-select').all();
        console.log('Member form inputs (' + memberInputs.length + '):');
        for (let i = 0; i < Math.min(memberInputs.length, 15); i++) {
            try {
                const inp = memberInputs[i];
                const tag = await inp.evaluate(el => el.tagName);
                const type = await inp.getAttribute('type') || '';
                const id = await inp.getAttribute('id') || '';
                const placeholder = await inp.getAttribute('placeholder') || '';
                const aria = await inp.getAttribute('aria-label') || '';
                const visible = await inp.isVisible().catch(() => false);
                const value = await inp.inputValue().catch(() => '');
                if (visible) console.log(`  [${i}] ${tag} type=${type} id="${id}" placeholder="${placeholder}" aria="${aria}" value="${value}"`);
            } catch(e) {}
        }
        
        const memberLabels = await page.locator('label').all();
        console.log('Member labels:');
        for (const l of memberLabels.slice(0, 15)) {
            try {
                const text = (await l.textContent()).trim().substring(0, 60);
                if (text) console.log('  "' + text + '"');
            } catch(e) {}
        }
        
        const memberBtns = await page.locator('button').all();
        console.log('Member buttons:');
        for (const b of memberBtns.slice(0, 10)) {
            try {
                const text = (await b.textContent()).trim().substring(0, 60);
                const disabled = await b.isDisabled().catch(() => false);
                const visible = await b.isVisible().catch(() => false);
                if (text && visible) console.log(`  "${text}" disabled=${disabled}`);
            } catch(e) {}
        }
        
        // Check for mat-select (relationship dropdown, etc.)
        const matSelects = await page.locator('mat-select').all();
        console.log('mat-select elements (' + matSelects.length + '):');
        for (let i = 0; i < Math.min(matSelects.length, 5); i++) {
            try {
                const text = (await matSelects[i].textContent()).trim().substring(0, 40);
                console.log(`  [${i}] "${text}"`);
            } catch(e) {}
        }
    } else {
        // Maybe the step 2 just asks "How many people in household" with a number
        // Check for a number input or stepper
        const numberInputs = await page.locator('input[type="number"], input[placeholder*="many"], input[placeholder*="number"]').all();
        console.log('Number inputs:', numberInputs.length);
        
        // Check if step 2 shows "How many people are in your household?"
        const bodyText = await page.locator('body').textContent();
        if (bodyText.includes('How many people') || bodyText.includes('household')) {
            console.log('Found household question — looking for input');
            
            // Look for any visible input that's not firstName/lastName/email
            const allInputs = await page.locator('input').all();
            for (const inp of allInputs) {
                try {
                    const id = await inp.getAttribute('id') || '';
                    const type = await inp.getAttribute('type') || '';
                    const visible = await inp.isVisible().catch(() => false);
                    if (visible && !['firstName','lastName','email','alternateEmail','ddlLanguage'].includes(id)) {
                        console.log('  Found extra input: id=' + id + ' type=' + type);
                    }
                } catch(e) {}
            }
        }
        
        // Maybe we just need to click Next without adding members (household of 1)
        console.log('No Add Member button — clicking Next');
        for (const btn of nextBtns) {
            const visible = await btn.isVisible().catch(() => false);
            const disabled = await btn.isDisabled().catch(() => true);
            if (visible && !disabled) {
                await btn.click();
                await page.waitForTimeout(2000);
                break;
            }
        }
    }
    
    // Step 3: Household Location
    console.log('\n--- Step 3: Household Location ---');
    await page.screenshot({ path: shotDir + 'step3_location.png' }).catch(() => {});
    
    // Dump all visible inputs
    const step3Inputs = await page.locator('input, select, mat-select, mat-checkbox, mat-radio-button').all();
    console.log('Step 3 elements (' + step3Inputs.length + '):');
    for (let i = 0; i < Math.min(step3Inputs.length, 25); i++) {
        try {
            const el = step3Inputs[i];
            const tag = await el.evaluate(el => el.tagName);
            const type = await el.getAttribute('type') || '';
            const id = await el.getAttribute('id') || '';
            const placeholder = await el.getAttribute('placeholder') || '';
            const aria = await el.getAttribute('aria-label') || '';
            const visible = await el.isVisible().catch(() => false);
            const text = tag.includes('MAT') ? (await el.textContent()).trim().substring(0, 40) : '';
            if (visible) console.log(`  [${i}] ${tag} type=${type} id="${id}" placeholder="${placeholder}" aria="${aria}" text="${text}"`);
        } catch(e) {}
    }
    
    const step3Labels = await page.locator('label').all();
    console.log('Step 3 labels:');
    for (const l of step3Labels.slice(0, 20)) {
        try {
            const text = (await l.textContent()).trim().substring(0, 60);
            if (text) console.log('  "' + text + '"');
        } catch(e) {}
    }
    
    const step3Btns = await page.locator('button').all();
    console.log('Step 3 buttons:');
    for (const b of step3Btns.slice(0, 10)) {
        try {
            const text = (await b.textContent()).trim().substring(0, 60);
            const disabled = await b.isDisabled().catch(() => false);
            const visible = await b.isVisible().catch(() => false);
            if (text && visible) console.log(`  "${text}" disabled=${disabled}`);
        } catch(e) {}
    }
    
    // Body text
    const bodyText = await page.locator('body').textContent();
    console.log('\nBody text (around "address"):');
    const addrIdx = bodyText.toLowerCase().indexOf('current living address');
    if (addrIdx >= 0) console.log(bodyText.substring(addrIdx, addrIdx + 300));
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));