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
    
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/household/setup', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
    await page.waitForTimeout(3000);
    
    // Fill in name fields
    console.log('=== Filling name ===');
    const firstName = page.locator('#firstName');
    const lastName = page.locator('#lastName');
    
    // Check if they already have values
    const fnVal = await firstName.inputValue().catch(() => '');
    const lnVal = await lastName.inputValue().catch(() => '');
    console.log('Current first name:', fnVal);
    console.log('Current last name:', lnVal);
    
    if (!fnVal) {
        await firstName.fill('Genesis');
        await page.waitForTimeout(500);
        console.log('Filled first name: Genesis');
    }
    if (!lnVal) {
        await lastName.fill('Lepe');
        await page.waitForTimeout(500);
        console.log('Filled last name: Lepe');
    }
    
    await page.screenshot({ path: shotDir + 'setup_name_filled.png' }).catch(() => {});
    
    // Click Next to advance
    console.log('\n=== Clicking Next ===');
    await page.locator('button:has-text("Next")').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: shotDir + 'setup_after_name.png' }).catch(() => {});
    
    // Dump what we see now
    console.log('\n=== After name Next ===');
    const inputs = await page.locator('input, select, mat-select').all();
    console.log('Visible inputs:');
    for (const inp of inputs) {
        try {
            const tag = await inp.evaluate(e => e.tagName);
            const type = await inp.getAttribute('type') || '';
            const id = await inp.getAttribute('id') || '';
            const vis = await inp.isVisible().catch(() => false);
            const val = await inp.inputValue().catch(() => '');
            if (vis) console.log('  ' + tag + ' type=' + type + ' id=' + id + ' value=' + val);
        } catch(e) {}
    }
    
    const labels = await page.locator('label').all();
    console.log('Visible labels:');
    for (const l of labels.slice(0, 15)) {
        try {
            const vis = await l.isVisible().catch(() => false);
            const text = (await l.textContent()).trim().substring(0, 60);
            if (text && vis) console.log('  "' + text + '"');
        } catch(e) {}
    }
    
    const btns = await page.locator('button').all();
    console.log('Buttons:');
    for (const b of btns.slice(0, 10)) {
        try {
            const text = (await b.textContent()).trim().substring(0, 60);
            const vis = await b.isVisible().catch(() => false);
            const dis = await b.isDisabled().catch(() => false);
            if (text && vis) console.log('  "' + text + '" disabled=' + dis);
        } catch(e) {}
    }
    
    // Click Next again to advance to contact info
    console.log('\n=== Clicking Next again ===');
    const nextBtn = page.locator('button:has-text("Next")').first();
    const nextVis = await nextBtn.isVisible({ timeout: 2000 }).catch(() => false);
    const nextDis = await nextBtn.isDisabled().catch(() => true);
    console.log('Next visible:', nextVis, 'disabled:', nextDis);
    
    if (nextVis && !nextDis) {
        await nextBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: shotDir + 'setup_contact_info.png' }).catch(() => {});
        
        // Dump again
        const inputs2 = await page.locator('input, select, mat-select').all();
        console.log('After 2nd Next — visible inputs:');
        for (const inp of inputs2) {
            try {
                const tag = await inp.evaluate(e => e.tagName);
                const type = await inp.getAttribute('type') || '';
                const id = await inp.getAttribute('id') || '';
                const vis = await inp.isVisible().catch(() => false);
                const val = await inp.inputValue().catch(() => '');
                if (vis) console.log('  ' + tag + ' type=' + type + ' id=' + id + ' value=' + val);
            } catch(e) {}
        }
        
        const labels2 = await page.locator('label').all();
        console.log('Labels:');
        for (const l of labels2.slice(0, 15)) {
            try {
                const vis = await l.isVisible().catch(() => false);
                const text = (await l.textContent()).trim().substring(0, 60);
                if (text && vis) console.log('  "' + text + '"');
            } catch(e) {}
        }
        
        const btns2 = await page.locator('button').all();
        console.log('Buttons:');
        for (const b of btns2.slice(0, 10)) {
            try {
                const text = (await b.textContent()).trim().substring(0, 60);
                const vis = await b.isVisible().catch(() => false);
                const dis = await b.isDisabled().catch(() => false);
                if (text && vis) console.log('  "' + text + '" disabled=' + dis);
            } catch(e) {}
        }
    }
    
    // Click Next a third time (to get past contact info to language/Start Setup)
    console.log('\n=== Clicking Next 3rd time ===');
    const nextBtn3 = page.locator('button:has-text("Next")').first();
    const next3Vis = await nextBtn3.isVisible({ timeout: 2000 }).catch(() => false);
    const next3Dis = await nextBtn3.isDisabled().catch(() => true);
    console.log('Next visible:', next3Vis, 'disabled:', next3Dis);
    
    if (next3Vis && !next3Dis) {
        await nextBtn3.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: shotDir + 'setup_language.png' }).catch(() => {});
        
        // Check for "Start Setup" button
        const startSetup = page.locator('button:has-text("Start Setup")');
        const ssVis = await startSetup.isVisible({ timeout: 2000 }).catch(() => false);
        console.log('Start Setup visible:', ssVis);
        
        if (ssVis) {
            console.log('Found Start Setup! Clicking...');
            await startSetup.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: shotDir + 'setup_step2_started.png' }).catch(() => {});
            console.log('URL after Start Setup:', page.url());
            
            // Dump step 2
            const step2Inputs = await page.locator('input, select, mat-select').all();
            console.log('Step 2 inputs (' + step2Inputs.length + '):');
            for (const inp of step2Inputs) {
                try {
                    const tag = await inp.evaluate(e => e.tagName);
                    const type = await inp.getAttribute('type') || '';
                    const id = await inp.getAttribute('id') || '';
                    const vis = await inp.isVisible().catch(() => false);
                    const val = await inp.inputValue().catch(() => '');
                    if (vis) console.log('  ' + tag + ' type=' + type + ' id=' + id + ' value=' + val);
                } catch(e) {}
            }
            
            const step2Labels = await page.locator('label').all();
            console.log('Step 2 labels:');
            for (const l of step2Labels.slice(0, 15)) {
                try {
                    const vis = await l.isVisible().catch(() => false);
                    const text = (await l.textContent()).trim().substring(0, 60);
                    if (text && vis) console.log('  "' + text + '"');
                } catch(e) {}
            }
            
            const step2Btns = await page.locator('button').all();
            console.log('Step 2 buttons:');
            for (const b of step2Btns.slice(0, 10)) {
                try {
                    const text = (await b.textContent()).trim().substring(0, 60);
                    const vis = await b.isVisible().catch(() => false);
                    const dis = await b.isDisabled().catch(() => false);
                    if (text && vis) console.log('  "' + text + '" disabled=' + dis);
                } catch(e) {}
            }
        }
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));