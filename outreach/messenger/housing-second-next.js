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
    
    // We should be on the page with 2 Next buttons
    // Let me click the SECOND Next button (which might advance to the next major step)
    console.log('=== Trying SECOND Next button ===');
    
    const nextBtns = page.locator('button:has-text("Next")');
    const count = await nextBtns.count();
    console.log('Next buttons:', count);
    
    for (let i = 0; i < count; i++) {
        const btn = nextBtns.nth(i);
        const text = (await btn.textContent()).trim();
        const vis = await btn.isVisible().catch(() => false);
        const dis = await btn.isDisabled().catch(() => false);
        const box = await btn.boundingBox().catch(() => null);
        const cls = await btn.getAttribute('class') || '';
        console.log(`  [${i}] "${text}" visible=${vis} disabled=${dis} y=${box ? Math.round(box.y) : '?'} class="${cls.substring(0,50)}"`);
    }
    
    // Click the SECOND visible Next button
    console.log('\nClicking Next[1] (second one)...');
    const secondNext = nextBtns.nth(1);
    const vis = await secondNext.isVisible().catch(() => false);
    const dis = await secondNext.isDisabled().catch(() => false);
    if (vis && !dis) {
        await secondNext.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: shotDir + 'setup_after_second_next.png' }).catch(() => {});
        console.log('URL after click:', page.url());
        
        // Dump what we see
        const inputs = await page.locator('input, select, mat-select').all();
        console.log('\nVisible inputs:');
        for (const inp of inputs) {
            try {
                const tag = await inp.evaluate(e => e.tagName);
                const type = await inp.getAttribute('type') || '';
                const id = await inp.getAttribute('id') || '';
                const v = await inp.isVisible().catch(() => false);
                const val = await inp.inputValue().catch(() => '');
                if (v) console.log('  ' + tag + ' type=' + type + ' id=' + id + ' value=' + val);
            } catch(e) {}
        }
        
        const labels = await page.locator('label').all();
        console.log('Labels:');
        for (const l of labels.slice(0, 15)) {
            try {
                const v = await l.isVisible().catch(() => false);
                const text = (await l.textContent()).trim().substring(0, 60);
                if (text && v) console.log('  "' + text + '"');
            } catch(e) {}
        }
        
        const btns = await page.locator('button').all();
        console.log('Buttons:');
        for (const b of btns.slice(0, 10)) {
            try {
                const text = (await b.textContent()).trim().substring(0, 60);
                const v = await b.isVisible().catch(() => false);
                const d = await b.isDisabled().catch(() => false);
                if (text && v) console.log('  "' + text + '" disabled=' + d);
            } catch(e) {}
        }
        
        // Check for "Start Setup"
        const startSetup = page.locator('button:has-text("Start Setup")');
        const ssVis = await startSetup.isVisible({ timeout: 2000 }).catch(() => false);
        console.log('Start Setup visible:', ssVis);
        
        if (ssVis) {
            console.log('Found Start Setup! Clicking...');
            await startSetup.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: shotDir + 'setup_step2_members.png' }).catch(() => {});
            console.log('After Start Setup URL:', page.url());
            
            // Dump step 2
            const step2 = await page.locator('input, select, mat-select, button, label').all();
            console.log('Step 2 elements (' + step2.length + '):');
            for (const el of step2.slice(0, 25)) {
                try {
                    const tag = await el.evaluate(e => e.tagName);
                    const text = (await el.textContent()).trim().substring(0, 50);
                    const v = await el.isVisible().catch(() => false);
                    if (v) console.log('  ' + tag + ': "' + text + '"');
                } catch(e) {}
            }
        }
        
        // Body text
        const bodyText = await page.locator('body').textContent();
        console.log('\nBody text (around "Members" or "Address"):');
        const memIdx = bodyText.indexOf('Household Members');
        const addrIdx = bodyText.indexOf('current living address');
        const langIdx = bodyText.indexOf('language');
        if (memIdx >= 0) console.log('Found "Household Members" at pos ' + memIdx);
        if (addrIdx >= 0) console.log('Found "current living address" at pos ' + addrIdx);
        if (langIdx >= 0) console.log('Found "language" at pos ' + langIdx);
        console.log('\nBody text (first 1200):');
        console.log(bodyText.substring(0, 1200));
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));