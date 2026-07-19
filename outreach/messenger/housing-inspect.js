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

    // Step 1: Navigate to lottery listings page
    console.log('=== Navigating to lottery listings ===');
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/search-lotteries', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(4000);
    
    console.log('URL:', page.url());
    await page.screenshot({ path: shotDir + '02_lottery_listings.png', fullPage: true });
    
    // Dump all links that look like lottery listings
    const links = await page.locator('a').all();
    console.log('\nLinks (' + links.length + '):');
    for (const a of links.slice(0, 50)) {
        try {
            const text = (await a.textContent()).trim().substring(0, 80);
            const href = await a.getAttribute('href') || '';
            if (text && (href.includes('lottery') || href.includes('listing') || text.length > 10)) {
                console.log('  "' + text + '" -> ' + href);
            }
        } catch(e) {}
    }
    
    // Buttons
    const buttons = await page.locator('button').all();
    console.log('\nButtons (' + buttons.length + '):');
    for (const b of buttons.slice(0, 25)) {
        try {
            const text = (await b.textContent()).trim().substring(0, 60);
            if (text) console.log('  ' + text);
        } catch(e) {}
    }
    
    // Headings
    const headings = await page.locator('h1, h2, h3, h4, [class*="title"]').all();
    console.log('\nHeadings/titles:');
    for (const h of headings.slice(0, 20)) {
        try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
    }
    
    // Inputs
    const inputs = await page.locator('input, select').all();
    console.log('\nInputs (' + inputs.length + '):');
    for (const inp of inputs.slice(0, 20)) {
        try {
            const tag = await inp.evaluate(el => el.tagName);
            const name = await inp.getAttribute('name') || '';
            const id = await inp.getAttribute('id') || '';
            const placeholder = await inp.getAttribute('placeholder') || '';
            const type = await inp.getAttribute('type') || '';
            console.log('  ' + tag + ' type=' + type + ' name=' + name + ' id=' + id + ' placeholder=' + placeholder);
        } catch(e) {}
    }
    
    // Step 2: Try clicking on first lottery listing
    console.log('\n=== Trying to open first lottery ===');
    // Look for links that go to lottery details
    const lotteryLinks = await page.locator('a[href*="lottery"], a[href*="listing"]').all();
    console.log('Lottery links found: ' + lotteryLinks.length);
    if (lotteryLinks.length > 0) {
        const firstLink = lotteryLinks[0];
        const href = await firstLink.getAttribute('href');
        const text = (await firstLink.textContent()).trim();
        console.log('First lottery: "' + text + '" -> ' + href);
        await firstLink.click();
        await page.waitForTimeout(5000);
        console.log('After click URL:', page.url());
        await page.screenshot({ path: shotDir + '03_lottery_detail.png', fullPage: true });
        
        // Inspect the lottery detail page
        console.log('\n--- Lottery Detail Page ---');
        
        // Look for Apply button
        const applyBtns = await page.locator('button:has-text("Apply"), a:has-text("Apply"), button:has-text("Apply Now")').all();
        console.log('Apply buttons: ' + applyBtns.length);
        for (const b of applyBtns.slice(0, 5)) {
            try {
                const text = (await b.textContent()).trim();
                const visible = await b.isVisible().catch(() => false);
                console.log('  "' + text + '" visible=' + visible);
            } catch(e) {}
        }
        
        // All buttons on detail page
        const allBtns = await page.locator('button, [role="button"]').all();
        console.log('\nAll buttons (' + allBtns.length + '):');
        for (const b of allBtns.slice(0, 25)) {
            try {
                const text = (await b.textContent()).trim().substring(0, 60);
                if (text) console.log('  ' + text);
            } catch(e) {}
        }
        
        // Headings
        const h2s = await page.locator('h1, h2, h3').all();
        console.log('\nHeadings:');
        for (const h of h2s.slice(0, 15)) {
            try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
        }
        
        // If there's an Apply button, click it to see the form
        if (applyBtns.length > 0) {
            console.log('\n=== Clicking Apply to see form (NOT submitting) ===');
            try {
                await applyBtns[0].click();
                await page.waitForTimeout(5000);
                console.log('After Apply click URL:', page.url());
                await page.screenshot({ path: shotDir + '04_application_form.png', fullPage: true });
                
                // Dump form structure
                const formInputs = await page.locator('input, select, textarea, [role="radio"], [role="checkbox"]').all();
                console.log('\nForm inputs (' + formInputs.length + '):');
                for (const inp of formInputs.slice(0, 40)) {
                    try {
                        const tag = await inp.evaluate(el => el.tagName);
                        const type = await inp.getAttribute('type') || '';
                        const name = await inp.getAttribute('name') || '';
                        const id = await inp.getAttribute('id') || '';
                        const placeholder = await inp.getAttribute('placeholder') || '';
                        const aria = await inp.getAttribute('aria-label') || '';
                        const visible = await inp.isVisible().catch(() => false);
                        if (visible) console.log('  ' + tag + ' type=' + type + ' name=' + name + ' id=' + id + ' placeholder="' + placeholder + '" aria="' + aria + '"');
                    } catch(e) {}
                }
                
                // Labels
                const labels = await page.locator('label, [class*="label"], [class*="Label"]').all();
                console.log('\nLabels (' + labels.length + '):');
                for (const l of labels.slice(0, 30)) {
                    try {
                        const text = (await l.textContent()).trim().substring(0, 60);
                        if (text) console.log('  "' + text + '"');
                    } catch(e) {}
                }
                
                // Step indicators
                const steps = await page.locator('[class*="step"], [class*="Step"], [class*="progress"], [class*="Progress"]').all();
                console.log('\nStep indicators (' + steps.length + '):');
                for (const s of steps.slice(0, 10)) {
                    try {
                        const text = (await s.textContent()).trim().substring(0, 60);
                        if (text) console.log('  ' + text);
                    } catch(e) {}
                }
                
                // Buttons
                const formBtns = await page.locator('button').all();
                console.log('\nForm buttons (' + formBtns.length + '):');
                for (const b of formBtns.slice(0, 15)) {
                    try {
                        const text = (await b.textContent()).trim().substring(0, 60);
                        const disabled = await b.isDisabled().catch(() => false);
                        if (text) console.log('  "' + text + '" disabled=' + disabled);
                    } catch(e) {}
                }
                
                // Headings
                const formH = await page.locator('h1, h2, h3, h4').all();
                console.log('\nForm headings:');
                for (const h of formH.slice(0, 10)) {
                    try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
                }
                
            } catch(e) {
                console.log('Apply click error: ' + e.message);
            }
        }
    }
    
    console.log('\n=== INSPECTION COMPLETE ===');
    console.log('Screenshots saved to: ' + shotDir);
    browser.close();
})().catch(e => console.error('ERROR:', e.message));