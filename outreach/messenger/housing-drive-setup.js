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
    
    // Make sure we're on household setup
    if (!page.url().includes('household/setup')) {
        await page.goto('https://housingconnect.nyc.gov/PublicWeb/household/setup', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
        await page.waitForTimeout(3000);
    }
    
    console.log('URL:', page.url());
    console.log('=== DRIVING THROUGH HOUSEHOLD SETUP ===\n');
    
    // The page has all steps rendered. Let me see what's visible right now.
    // Step 1 shows name + email. Let me click Next to advance to step 2.
    
    // But first — I need to check: is there a "Start Setup" button?
    const startBtn = page.locator('button:has-text("Start Setup")');
    if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Clicking Start Setup...');
        await startBtn.click();
        await page.waitForTimeout(2000);
    }
    
    // Click the first visible Next button
    console.log('--- Clicking Next (Step 1 -> 2) ---');
    const allNextBtns = page.locator('button:has-text("Next")');
    const nextCount = await allNextBtns.count();
    console.log('Next buttons:', nextCount);
    
    // Find the first visible one
    for (let i = 0; i < nextCount; i++) {
        const btn = allNextBtns.nth(i);
        const vis = await btn.isVisible().catch(() => false);
        const dis = await btn.isDisabled().catch(() => true);
        console.log(`  Next[${i}] visible=${vis} disabled=${dis}`);
        if (vis && !dis) {
            console.log('Clicking Next[' + i + ']');
            await btn.click();
            await page.waitForTimeout(2000);
            break;
        }
    }
    
    await page.screenshot({ path: shotDir + 'setup_after_next1.png' }).catch(() => {});
    
    // Now check what step we're on
    console.log('\n--- After Step 1 Next ---');
    const bodyText = await page.locator('body').textContent();
    
    // Check for "Household Members" text
    if (bodyText.includes('Household Members')) {
        console.log('On Step 2: Household Members');
        
        // Look for "Add Member" button
        const addBtn = page.locator('button:has-text("Add Member"), button:has-text("Add")');
        const addCount = await addBtn.count();
        console.log('Add Member buttons:', addCount);
        
        for (let i = 0; i < addCount; i++) {
            const vis = await addBtn.nth(i).isVisible().catch(() => false);
            console.log(`  Add[${i}] visible=${vis}`);
            if (vis) {
                console.log('Clicking Add Member');
                await addBtn.nth(i).click();
                await page.waitForTimeout(2000);
                break;
            }
        }
        
        await page.screenshot({ path: shotDir + 'setup_add_member.png' }).catch(() => {});
        
        // Dump the add member form
        const inputs = await page.locator('input, select, mat-select').all();
        console.log('\nMember form inputs (' + inputs.length + '):');
        for (let i = 0; i < Math.min(inputs.length, 20); i++) {
            try {
                const el = inputs[i];
                const tag = await el.evaluate(e => e.tagName);
                const type = await el.getAttribute('type') || '';
                const id = await el.getAttribute('id') || '';
                const placeholder = await el.getAttribute('placeholder') || '';
                const aria = await el.getAttribute('aria-label') || '';
                const vis = await el.isVisible().catch(() => false);
                const val = await el.inputValue().catch(() => '');
                if (vis) console.log(`  [${i}] ${tag} type=${type} id="${id}" placeholder="${placeholder}" aria="${aria}" value="${val}"`);
            } catch(e) {}
        }
        
        const labels = await page.locator('label').all();
        console.log('Labels:');
        for (const l of labels.slice(0, 20)) {
            try {
                const text = (await l.textContent()).trim().substring(0, 60);
                if (text) console.log('  "' + text + '"');
            } catch(e) {}
        }
        
        const btns = await page.locator('button').all();
        console.log('Buttons:');
        for (const b of btns.slice(0, 15)) {
            try {
                const text = (await b.textContent()).trim().substring(0, 60);
                const dis = await b.isDisabled().catch(() => false);
                const vis = await b.isVisible().catch(() => false);
                if (text && vis) console.log(`  "${text}" disabled=${dis}`);
            } catch(e) {}
        }
        
        // Check for mat-select (relationship, etc.)
        const matSelects = await page.locator('mat-select').all();
        console.log('mat-select (' + matSelects.length + '):');
        for (let i = 0; i < Math.min(matSelects.length, 5); i++) {
            try {
                const text = (await matSelects[i].textContent()).trim().substring(0, 50);
                const vis = await matSelects[i].isVisible().catch(() => false);
                console.log(`  [${i}] visible=${vis} text="${text}"`);
            } catch(e) {}
        }
        
        // If no Add Member visible, maybe household of 1 is default
        // Just click Next to proceed
        if (addCount === 0) {
            console.log('No Add Member button — proceeding to Next');
        }
    }
    
    // Body text snippet
    console.log('\nBody text (first 800):');
    console.log(bodyText.substring(0, 800));
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));