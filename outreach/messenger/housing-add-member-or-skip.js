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
    
    console.log('URL:', page.url());
    
    // We clicked Add Member and it opened a form. The Next button is disabled.
    // Since household is just Genesis (Self), we don't need to add another member.
    // Let's look for a Cancel/Close button on the Add Member form, or just
    // clear the form and click Next.
    
    console.log('=== Looking for Cancel/Remove on Add Member form ===');
    
    // Dump all buttons
    const btns = await page.locator('button, a').all();
    console.log('All buttons/links:');
    for (const b of btns.slice(0, 25)) {
        try {
            const text = (await b.textContent()).trim().substring(0, 50);
            const v = await b.isVisible().catch(() => false);
            const d = await b.isDisabled().catch(() => false);
            if (text && v) console.log('  "' + text + '" disabled=' + d);
        } catch(e) {}
    }
    
    // Look for Cancel, Close, Remove, X button
    const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Close"), button:has-text("Remove"), a:has-text("Cancel"), [aria-label*="close"], [aria-label*="Close"]');
    const cancelCount = await cancelBtn.count();
    console.log('\nCancel/Close buttons:', cancelCount);
    
    // Maybe the relationship dropdown has a "remove" option or there's a trash icon
    // Let's try selecting a relationship and filling the name, then saving
    // OR — just clear the form fields and the Next might enable
    
    // Actually, the simplest approach: the Add Member form has an empty relationship
    // dropdown. If we just select the dropdown and pick nothing, the form might
    // auto-close. Or we can look for a "Remove" button next to the member row.
    
    // Let's try pressing Escape to close the Add Member form
    console.log('\nPressing Escape to close Add Member form...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Check if Next is enabled now
    const nextBtn = page.locator('button:has-text("Next")').first();
    const nextDis = await nextBtn.isDisabled().catch(() => true);
    console.log('Next disabled after Escape:', nextDis);
    
    if (nextDis) {
        // Maybe we need to fill in the member form first, then remove
        // Or there's a specific cancel button
        // Let's try looking for an X or remove icon
        const removeIcons = await page.locator('[class*="remove"], [class*="delete"], [class*="close"], [class*="trash"], .btn-icon, .la-times').all();
        console.log('Remove/close icons:', removeIcons.length);
        
        // Try clicking the relationship dropdown to see if there's a "Remove" option
        const relSelect = page.locator('#ddlRelationship0');
        const relVis = await relSelect.isVisible({ timeout: 2000 }).catch(() => false);
        console.log('Relationship dropdown visible:', relVis);
        if (relVis) {
            const opts = await relSelect.locator('option').allTextContents();
            console.log('Relationship options:', opts);
        }
        
        // Let's just fill in the member with Ray as a Spouse and save
        console.log('\nFilling Add Member with Ray as Spouse...');
        await relSelect.selectOption({ label: 'Spouse/Husband/Wife' }).catch(e => console.log('Rel select error:', e.message));
        await page.waitForTimeout(500);
        
        const firstNameField = page.locator('#hhMmbrFirst_0');
        await firstNameField.fill('Ray');
        await page.waitForTimeout(500);
        
        // Find last name field
        const lastNameInputs = await page.locator('input').all();
        for (const inp of lastNameInputs) {
            try {
                const ph = await inp.getAttribute('placeholder') || '';
                if (ph.includes('Last Name')) {
                    await inp.fill('Bernard');
                    await page.waitForTimeout(500);
                    console.log('Filled last name: Bernard');
                    break;
                }
            } catch(e) {}
        }
        
        await page.screenshot({ path: shotDir + 'setup_member_ray.png' }).catch(() => {});
        
        // Check if Next is enabled now
        const nextDis2 = await nextBtn.isDisabled().catch(() => true);
        console.log('Next disabled after filling:', nextDis2);
        
        if (!nextDis2) {
            console.log('Next enabled! Clicking to proceed to Step 3...');
            await nextBtn.click();
            await page.waitForTimeout(3000);
            console.log('After Next URL:', page.url());
            await page.screenshot({ path: shotDir + 'setup_step3.png' }).catch(() => {});
            
            // Dump Step 3
            console.log('\n=== Step 3: Household Location ===');
            
            const inputs3 = await page.locator('input, select, mat-select, mat-checkbox, mat-radio-button').all();
            console.log('Elements (' + inputs3.length + '):');
            for (const inp of inputs3) {
                try {
                    const tag = await inp.evaluate(e => e.tagName);
                    const type = await inp.getAttribute('type') || '';
                    const id = await inp.getAttribute('id') || '';
                    const placeholder = await inp.getAttribute('placeholder') || '';
                    const aria = await inp.getAttribute('aria-label') || '';
                    const v = await inp.isVisible().catch(() => false);
                    const val = await inp.inputValue().catch(() => '');
                    const text = tag.includes('MAT') ? (await inp.textContent()).trim().substring(0, 40) : '';
                    if (v) console.log('  ' + tag + ' type=' + type + ' id=' + id + ' placeholder=' + placeholder + ' aria=' + aria + ' value=' + val + ' text=' + text);
                } catch(e) {}
            }
            
            const labels3 = await page.locator('label').all();
            console.log('Labels:');
            for (const l of labels3.slice(0, 20)) {
                try {
                    const text = (await l.textContent()).trim().substring(0, 60);
                    const v = await l.isVisible().catch(() => false);
                    if (text && v) console.log('  "' + text + '"');
                } catch(e) {}
            }
            
            const btns3 = await page.locator('button').all();
            console.log('Buttons:');
            for (const b of btns3.slice(0, 10)) {
                try {
                    const text = (await b.textContent()).trim().substring(0, 60);
                    const v = await b.isVisible().catch(() => false);
                    const d = await b.isDisabled().catch(() => false);
                    if (text && v) console.log('  "' + text + '" disabled=' + d);
                } catch(e) {}
            }
            
            // Body text
            const bodyText = await page.locator('body').textContent();
            console.log('\nBody text (around "address"):');
            const addrIdx = bodyText.toLowerCase().indexOf('current living address');
            if (addrIdx >= 0) console.log(bodyText.substring(addrIdx, addrIdx + 500));
            else console.log(bodyText.substring(0, 800));
        }
    } else {
        // Next was enabled — click it to go to Step 3
        console.log('Next enabled! Clicking to go to Step 3...');
        await nextBtn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: shotDir + 'setup_step3.png' }).catch(() => {});
        
        // Dump Step 3
        const inputs3 = await page.locator('input, select, mat-select, mat-checkbox, mat-radio-button').all();
        console.log('\n=== Step 3: Household Location ===');
        console.log('Elements (' + inputs3.length + '):');
        for (const inp of inputs3) {
            try {
                const tag = await inp.evaluate(e => e.tagName);
                const type = await inp.getAttribute('type') || '';
                const id = await inp.getAttribute('id') || '';
                const v = await inp.isVisible().catch(() => false);
                const val = await inp.inputValue().catch(() => '');
                if (v) console.log('  ' + tag + ' type=' + type + ' id=' + id + ' value=' + val);
            } catch(e) {}
        }
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));