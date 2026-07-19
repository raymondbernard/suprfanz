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
    
    // We're on the household setup page
    console.log('=== FILLING HOUSEHOLD PROFILE ===');
    console.log('URL:', page.url());
    
    // The page has all steps in the same DOM. Let me fill what I can see.
    // Step 1 already has name + email filled. Click "Start Setup" to proceed.
    
    // Look for "Start Setup" button
    const startBtn = page.locator('button:has-text("Start Setup")');
    const startVisible = await startBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Start Setup visible:', startVisible);
    
    if (startVisible) {
        await startBtn.click();
        await page.waitForTimeout(2000);
        console.log('Clicked Start Setup');
    }
    
    // Step 2: Add household member
    // Look for "Add Member" button
    const addMemberBtn = page.locator('button:has-text("Add Member")');
    const addMemberVisible = await addMemberBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('\nAdd Member visible:', addMemberVisible);
    
    if (addMemberVisible) {
        await addMemberBtn.click();
        await page.waitForTimeout(2000);
        console.log('Clicked Add Member');
        await page.screenshot({ path: shotDir + 'add_member_form.png' }).catch(() => {});
        
        // Dump the member form fields
        const memberInputs = await page.locator('input, select').all();
        console.log('\nMember form inputs (' + memberInputs.length + '):');
        for (let i = 0; i < Math.min(memberInputs.length, 20); i++) {
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
        console.log('\nMember labels:');
        for (const l of memberLabels.slice(0, 20)) {
            try {
                const text = (await l.textContent()).trim().substring(0, 60);
                if (text) console.log('  "' + text + '"');
            } catch(e) {}
        }
        
        const memberBtns = await page.locator('button').all();
        console.log('\nMember buttons:');
        for (const b of memberBtns.slice(0, 15)) {
            try {
                const text = (await b.textContent()).trim().substring(0, 60);
                const disabled = await b.isDisabled().catch(() => false);
                const visible = await b.isVisible().catch(() => false);
                if (text && visible) console.log(`  "${text}" disabled=${disabled}`);
            } catch(e) {}
        }
        
        // Check for mat-select dropdowns
        const memberSelects = await page.locator('mat-select, select').all();
        console.log('\nMember selects (' + memberSelects.length + '):');
        for (let i = 0; i < Math.min(memberSelects.length, 10); i++) {
            try {
                const s = memberSelects[i];
                const tag = await s.evaluate(el => el.tagName);
                const text = (await s.textContent()).trim().substring(0, 60);
                const visible = await s.isVisible().catch(() => false);
                console.log(`  [${i}] ${tag} visible=${visible} text="${text}"`);
            } catch(e) {}
        }
        
        // Check for mat-radio-group
        const memberRadios = await page.locator('mat-radio-button, mat-radio-group').all();
        console.log('\nMember radios (' + memberRadios.length + '):');
        for (let i = 0; i < Math.min(memberRadios.length, 10); i++) {
            try {
                const r = memberRadios[i];
                const text = (await r.textContent()).trim().substring(0, 60);
                const visible = await r.isVisible().catch(() => false);
                console.log(`  [${i}] visible=${visible} text="${text}"`);
            } catch(e) {}
        }
    }
    
    // Step 3: Address — fill in address
    console.log('\n=== STEP 3: ADDRESS ===');
    
    // Check if "No current living address" checkbox is there
    const noAddrCheckbox = page.locator('#mat-checkbox-1-input');
    const noAddrVisible = await noAddrCheckbox.isVisible({ timeout: 2000 }).catch(() => false);
    console.log('No address checkbox visible:', noAddrVisible);
    
    // Check the address input field
    const addrInput = page.locator('#address, input[placeholder*="address"], input[placeholder*="Address"]');
    const addrVisible = await addrInput.isVisible({ timeout: 2000 }).catch(() => false);
    console.log('Address input visible:', addrVisible);
    if (addrVisible) {
        const addrValue = await addrInput.inputValue().catch(() => '');
        console.log('Address value:', addrValue);
    }
    
    // Dump ALL visible inputs on the page
    console.log('\n=== ALL VISIBLE INPUTS ON PAGE ===');
    const allInputs = await page.locator('input, select, textarea, mat-select').all();
    for (let i = 0; i < Math.min(allInputs.length, 30); i++) {
        try {
            const inp = allInputs[i];
            const tag = await inp.evaluate(el => el.tagName);
            const type = await inp.getAttribute('type') || '';
            const id = await inp.getAttribute('id') || '';
            const placeholder = await inp.getAttribute('placeholder') || '';
            const aria = await inp.getAttribute('aria-label') || '';
            const visible = await inp.isVisible().catch(() => false);
            const value = await inp.inputValue().catch(() => '');
            const text = tag === 'MAT-SELECT' ? (await inp.textContent()).trim().substring(0, 40) : '';
            if (visible) console.log(`  [${i}] ${tag} type=${type} id="${id}" placeholder="${placeholder}" aria="${aria}" value="${value}" text="${text}"`);
        } catch(e) {}
    }
    
    // Dump all buttons
    console.log('\n=== ALL VISIBLE BUTTONS ===');
    const allBtns = await page.locator('button').all();
    for (const b of allBtns.slice(0, 20)) {
        try {
            const text = (await b.textContent()).trim().substring(0, 60);
            const disabled = await b.isDisabled().catch(() => false);
            const visible = await b.isVisible().catch(() => false);
            if (text && visible) console.log(`  "${text}" disabled=${disabled}`);
        } catch(e) {}
    }
    
    await page.screenshot({ path: shotDir + 'household_full_page.png' }).catch(() => {});
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));