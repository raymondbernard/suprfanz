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

    // Navigate to household setup
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/household/setup', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
    await page.waitForTimeout(3000);
    console.log('URL:', page.url());

    // The wizard has 3 main steps with sub-steps within each.
    // Step 1 has sub-steps: name -> contact info -> language -> "Start Setup" button
    // We need to click through ALL sub-steps of step 1 to reach step 2.

    // Click ALL visible Next buttons in sequence
    for (let step = 0; step < 5; step++) {
        console.log('\n--- Step ' + step + ': Looking for buttons ---');

        // Take screenshot
        await page.screenshot({ path: shotDir + 'setup_step' + step + '.png' }).catch(() => {});

        // Check for "Start Setup" button first
        const startSetup = page.locator('button:has-text("Start Setup")');
        const ssVis = await startSetup.isVisible({ timeout: 1000 }).catch(() => false);
        if (ssVis) {
            console.log('Found "Start Setup" — clicking');
            await startSetup.click();
            await page.waitForTimeout(2000);
            continue;
        }

        // Check for "Add Member" button
        const addMember = page.locator('button:has-text("Add Member")');
        const amVis = await addMember.isVisible({ timeout: 1000 }).catch(() => false);
        if (amVis) {
            console.log('Found "Add Member" — we are on Step 2!');
            await page.screenshot({ path: shotDir + 'setup_step2_members.png' }).catch(() => {});
            
            // Dump the member form
            const inputs = await page.locator('input, select, mat-select').all();
            console.log('Inputs (' + inputs.length + '):');
            for (let i = 0; i < Math.min(inputs.length, 20); i++) {
                try {
                    const el = inputs[i];
                    const tag = await el.evaluate(e => e.tagName);
                    const type = await el.getAttribute('type') || '';
                    const id = await el.getAttribute('id') || '';
                    const placeholder = await el.getAttribute('placeholder') || '';
                    const aria = await el.getAttribute('aria-label') || '';
                    const vis = await el.isVisible().catch(() => false);
                    if (vis) console.log('  ' + tag + ' type=' + type + ' id=' + id + ' placeholder=' + placeholder + ' aria=' + aria);
                } catch(e) {}
            }
            
            const labels = await page.locator('label').all();
            console.log('Labels:');
            for (const l of labels.slice(0, 15)) {
                try {
                    const text = (await l.textContent()).trim().substring(0, 60);
                    if (text) console.log('  "' + text + '"');
                } catch(e) {}
            }
            
            const btns = await page.locator('button').all();
            console.log('Buttons:');
            for (const b of btns.slice(0, 10)) {
                try {
                    const text = (await b.textContent()).trim().substring(0, 60);
                    const dis = await b.isDisabled().catch(() => false);
                    const vis = await b.isVisible().catch(() => false);
                    if (text && vis) console.log('  "' + text + '" disabled=' + dis);
                } catch(e) {}
            }
            
            const mats = await page.locator('mat-select, mat-radio-button, mat-checkbox').all();
            console.log('Mat elements (' + mats.length + '):');
            for (const m of mats.slice(0, 10)) {
                try {
                    const tag = await m.evaluate(e => e.tagName);
                    const text = (await m.textContent()).trim().substring(0, 50);
                    const vis = await m.isVisible().catch(() => false);
                    if (vis) console.log('  ' + tag + ': "' + text + '"');
                } catch(e) {}
            }
            
            break;
        }

        // Check for address field (step 3)
        const addrField = page.locator('#address, input[placeholder*="address"], input[placeholder*="Address"]');
        const addrVis = await addrField.isVisible({ timeout: 1000 }).catch(() => false);
        if (addrVis) {
            console.log('Found address field — we are on Step 3!');
            await page.screenshot({ path: shotDir + 'setup_step3_address.png' }).catch(() => {});
            
            // Dump step 3
            const inputs3 = await page.locator('input, select, mat-select, mat-checkbox, mat-radio-button').all();
            console.log('Step 3 elements (' + inputs3.length + '):');
            for (let i = 0; i < Math.min(inputs3.length, 25); i++) {
                try {
                    const el = inputs3[i];
                    const tag = await el.evaluate(e => e.tagName);
                    const type = await el.getAttribute('type') || '';
                    const id = await el.getAttribute('id') || '';
                    const vis = await el.isVisible().catch(() => false);
                    const text = tag.includes('MAT') ? (await el.textContent()).trim().substring(0, 50) : '';
                    if (vis) console.log('  ' + tag + ' type=' + type + ' id=' + id + ' text=' + text);
                } catch(e) {}
            }
            break;
        }

        // Click the first visible, enabled Next button
        const nextBtns = page.locator('button:has-text("Next")');
        const nextCount = await nextBtns.count();
        let clicked = false;
        for (let i = 0; i < nextCount; i++) {
            const btn = nextBtns.nth(i);
            const vis = await btn.isVisible().catch(() => false);
            const dis = await btn.isDisabled().catch(() => true);
            if (vis && !dis) {
                console.log('Clicking Next[' + i + ']');
                await btn.click();
                await page.waitForTimeout(2000);
                clicked = true;
                break;
            }
        }
        if (!clicked) {
            console.log('No Next button to click — stopping');
            break;
        }
    }

    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));