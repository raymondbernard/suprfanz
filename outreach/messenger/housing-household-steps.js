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
    console.log('URL:', page.url());
    console.log('\n=== STEP 1: Account Confirmation ===');
    
    // Check current values
    const firstName = await page.locator('#firstName').inputValue().catch(() => '');
    const lastName = await page.locator('#lastName').inputValue().catch(() => '');
    console.log('First name:', firstName);
    console.log('Last name:', lastName);
    
    // Check email fields
    const emailVisible = await page.locator('#email').isVisible({ timeout: 2000 }).catch(() => false);
    if (emailVisible) {
        const email = await page.locator('#email').inputValue().catch(() => '');
        console.log('Email:', email);
    }
    
    // Click Next to go to step 2
    console.log('\nClicking Next...');
    const nextBtn = page.locator('button:has-text("Next")').first();
    const nextDisabled = await nextBtn.isDisabled().catch(() => true);
    console.log('Next disabled:', nextDisabled);
    
    if (!nextDisabled) {
        await nextBtn.click();
        await page.waitForTimeout(3000);
        console.log('After Next URL:', page.url());
        await page.screenshot({ path: shotDir + 'household_step2.png' }).catch(() => {});
        
        // Inspect step 2
        console.log('\n=== STEP 2: Household Members ===');
        
        const headings = await page.locator('h1, h2, h3, h4, h5').all();
        console.log('Headings:');
        for (const h of headings.slice(0, 10)) {
            try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
        }
        
        const inputs = await page.locator('input, select, textarea').all();
        console.log('\nInputs (' + inputs.length + '):');
        for (let i = 0; i < Math.min(inputs.length, 20); i++) {
            try {
                const inp = inputs[i];
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
        
        const labels = await page.locator('label').all();
        console.log('\nLabels:');
        for (const l of labels.slice(0, 15)) {
            try {
                const text = (await l.textContent()).trim().substring(0, 60);
                if (text) console.log('  "' + text + '"');
            } catch(e) {}
        }
        
        const btns = await page.locator('button').all();
        console.log('\nButtons:');
        for (const b of btns.slice(0, 10)) {
            try {
                const text = (await b.textContent()).trim().substring(0, 60);
                const disabled = await b.isDisabled().catch(() => false);
                const visible = await b.isVisible().catch(() => false);
                if (text && visible) console.log(`  "${text}" disabled=${disabled}`);
            } catch(e) {}
        }
        
        // Click Next again to go to step 3
        const nextBtn2 = page.locator('button:has-text("Next")').first();
        const next2Disabled = await nextBtn2.isDisabled().catch(() => true);
        console.log('\nNext (step 2) disabled:', next2Disabled);
        
        if (!next2Disabled) {
            await nextBtn2.click();
            await page.waitForTimeout(3000);
            console.log('After Next2 URL:', page.url());
            await page.screenshot({ path: shotDir + 'household_step3.png' }).catch(() => {});
            
            // Inspect step 3
            console.log('\n=== STEP 3: Household Location ===');
            
            const h3s = await page.locator('h1, h2, h3, h4, h5').all();
            console.log('Headings:');
            for (const h of h3s.slice(0, 10)) {
                try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
            }
            
            const step3Inputs = await page.locator('input, select, textarea').all();
            console.log('\nInputs (' + step3Inputs.length + '):');
            for (let i = 0; i < Math.min(step3Inputs.length, 20); i++) {
                try {
                    const inp = step3Inputs[i];
                    const tag = await inp.evaluate(el => el.tagName);
                    const type = await inp.getAttribute('type') || '';
                    const id = await inp.getAttribute('id') || '';
                    const placeholder = await inp.getAttribute('placeholder') || '';
                    const visible = await inp.isVisible().catch(() => false);
                    const value = await inp.inputValue().catch(() => '');
                    if (visible) console.log(`  [${i}] ${tag} type=${type} id="${id}" placeholder="${placeholder}" value="${value}"`);
                } catch(e) {}
            }
            
            const step3Labels = await page.locator('label').all();
            console.log('\nLabels:');
            for (const l of step3Labels.slice(0, 20)) {
                try {
                    const text = (await l.textContent()).trim().substring(0, 60);
                    if (text) console.log('  "' + text + '"');
                } catch(e) {}
            }
            
            const step3Btns = await page.locator('button').all();
            console.log('\nButtons:');
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
            console.log('\nBody text (first 1500):');
            console.log(bodyText.substring(0, 1500));
        }
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));