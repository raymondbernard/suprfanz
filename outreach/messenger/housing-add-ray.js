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
    
    // Navigate to household setup fresh
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/household/setup', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
    await page.waitForTimeout(3000);
    console.log('URL:', page.url());
    
    // Step 1: Name already filled (Genesis Lepe). Click the second Next (at y~398)
    console.log('=== Step 1: Advancing through sub-steps ===');
    
    // Click Next (the one that's actually visible on screen — skip the one at y=-63)
    const nextBtns = page.locator('button:has-text("Next")');
    for (let i = 0; i < await nextBtns.count(); i++) {
        const btn = nextBtns.nth(i);
        const box = await btn.boundingBox().catch(() => null);
        if (box && box.y > 0) {
            console.log('Clicking Next at y=' + Math.round(box.y));
            await btn.click();
            await page.waitForTimeout(2000);
            break;
        }
    }
    
    // Now should be on contact info — click Next again
    console.log('Advancing past contact info...');
    const next2 = page.locator('button:has-text("Next")');
    for (let i = 0; i < await next2.count(); i++) {
        const btn = next2.nth(i);
        const box = await btn.boundingBox().catch(() => null);
        if (box && box.y > 0) {
            console.log('Clicking Next at y=' + Math.round(box.y));
            await btn.click();
            await page.waitForTimeout(2000);
            break;
        }
    }
    
    // Now should be on language step — select English
    console.log('Selecting English...');
    await page.locator('#ddlLanguage').selectOption('English');
    await page.waitForTimeout(1000);
    
    // Click Start Setup
    console.log('Clicking Start Setup...');
    const startBtn = page.locator('button:has-text("Start Setup")');
    const startDis = await startBtn.isDisabled().catch(() => true);
    console.log('Start Setup disabled:', startDis);
    
    if (!startDis) {
        await startBtn.click();
        await page.waitForTimeout(3000);
        console.log('After Start Setup — on Step 2');
        await page.screenshot({ path: shotDir + 'step2_ready.png' }).catch(() => {});
    } else {
        console.log('Start Setup still disabled!');
        // Maybe need to also select unit sizes
        console.log('Looking for unit size mat-select...');
        const matSel = page.locator('mat-select');
        const msCount = await matSel.count();
        for (let i = 0; i < msCount; i++) {
            const ms = matSel.nth(i);
            const vis = await ms.isVisible({ timeout: 1000 }).catch(() => false);
            if (vis) {
                console.log('Clicking mat-select...');
                await ms.click();
                await page.waitForTimeout(1000);
                
                const opts = await page.locator('mat-option').all();
                console.log('Options (' + opts.length + '):');
                for (const opt of opts) {
                    try {
                        const text = (await opt.textContent()).trim();
                        console.log('  ' + text);
                    } catch(e) {}
                }
                
                // Select Studio and 1 Bedroom
                for (const opt of opts) {
                    try {
                        const text = (await opt.textContent()).trim().toLowerCase();
                        if (text.includes('studio') || text.includes('1 bed') || text.includes('one')) {
                            await opt.click();
                            await page.waitForTimeout(500);
                            console.log('Selected: ' + text);
                        }
                    } catch(e) {}
                }
                await page.keyboard.press('Escape');
                await page.waitForTimeout(500);
                break;
            }
        }
        
        // Try Start Setup again
        const startDis2 = await startBtn.isDisabled().catch(() => true);
        console.log('Start Setup disabled after unit selection:', startDis2);
        if (!startDis2) {
            await startBtn.click();
            await page.waitForTimeout(3000);
            console.log('After Start Setup — on Step 2');
        }
    }
    
    // Step 2: Add Ray as household member (Spouse)
    console.log('\n=== Step 2: Adding Ray as Spouse ===');
    
    // Check if Add Member is visible
    const addBtn = page.locator('button:has-text("Add Member")');
    const addVis = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Add Member visible:', addVis);
    
    if (addVis) {
        await addBtn.click();
        await page.waitForTimeout(2000);
        console.log('Clicked Add Member');
        await page.screenshot({ path: shotDir + 'step2_add_member.png' }).catch(() => {});
        
        // Fill in the Add Member form
        // Relationship dropdown
        const relSelect = page.locator('#ddlRelationship0, select');
        const relVis = await relSelect.isVisible({ timeout: 2000 }).catch(() => false);
        console.log('Relationship select visible:', relVis);
        
        if (relVis) {
            const opts = await relSelect.locator('option').allTextContents();
            console.log('Relationship options:', opts);
            
            // Select Spouse/Husband/Wife
            for (const opt of opts) {
                if (opt.toLowerCase().includes('spouse') || opt.toLowerCase().includes('husband') || opt.toLowerCase().includes('wife')) {
                    await relSelect.selectOption({ label: opt });
                    console.log('Selected relationship: ' + opt);
                    break;
                }
            }
            await page.waitForTimeout(500);
        }
        
        // First name
        const firstField = page.locator('#hhMmbrFirst_0, input[placeholder*="First"]');
        const firstVis = await firstField.isVisible({ timeout: 2000 }).catch(() => false);
        if (firstVis) {
            await firstField.fill('Ray');
            console.log('Filled first name: Ray');
            await page.waitForTimeout(500);
        }
        
        // Last name
        const lastField = page.locator('input[placeholder*="Last"]');
        const lastVis = await lastField.isVisible({ timeout: 2000 }).catch(() => false);
        if (lastVis) {
            await lastField.fill('Bernard');
            console.log('Filled last name: Bernard');
            await page.waitForTimeout(500);
        }
        
        await page.screenshot({ path: shotDir + 'step2_ray_added.png' }).catch(() => {});
        
        // Check if Next is now enabled
        const nextBtn = page.locator('button:has-text("Next")');
        for (let i = 0; i < await nextBtn.count(); i++) {
            const btn = nextBtn.nth(i);
            const vis = await btn.isVisible().catch(() => false);
            const dis = await btn.isDisabled().catch(() => true);
            if (vis) console.log('Next[' + i + '] disabled=' + dis);
        }
        
        // Click the visible, enabled Next to proceed to Step 3
        for (let i = 0; i < await nextBtn.count(); i++) {
            const btn = nextBtn.nth(i);
            const vis = await btn.isVisible().catch(() => false);
            const dis = await btn.isDisabled().catch(() => true);
            const box = await btn.boundingBox().catch(() => null);
            if (vis && !dis && box && box.y > 0) {
                console.log('Clicking Next[' + i + '] at y=' + Math.round(box.y));
                await btn.click();
                await page.waitForTimeout(3000);
                break;
            }
        }
        
        console.log('After Next URL:', page.url());
        await page.screenshot({ path: shotDir + 'step3_address.png' }).catch(() => {});
        
        // Step 3: Address
        console.log('\n=== Step 3: Address ===');
        
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
        
        // Body text around address
        const bodyText = await page.locator('body').textContent();
        const addrIdx = bodyText.toLowerCase().indexOf('current living address');
        if (addrIdx >= 0) {
            console.log('\nText around address:');
            console.log(bodyText.substring(addrIdx, addrIdx + 800));
        }
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));