const { chromium } = require('playwright');
(async () => {
    const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const c = b.contexts()[0];
    let page = null;
    for (const p of c.pages()) {
        try { if (p.url().includes('messenger.com')) { page = p; break; } } catch(e) {}
    }
    if (!page) { console.log('No page'); b.close(); return; }
    
    // Navigate to a specific contact
    const testUrl = 'https://www.messenger.com/t/phyllis.r.charney';
    console.log('Before nav URL:', page.url());
    await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav err:', e.message));
    await page.waitForTimeout(3000);
    console.log('After nav URL:', page.url());
    
    // Check if the conversation actually changed
    const tb = page.locator('div[role="textbox"]').first();
    const tbVis = await tb.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Textbox visible:', tbVis);
    
    // Check for Continue button (Facebook shows this for contacts you haven't messaged before)
    const allBtns = await page.locator('div[role="button"], button').all();
    console.log('Buttons (' + allBtns.length + '):');
    for (let i = 0; i < Math.min(allBtns.length, 15); i++) {
        try {
            const text = (await allBtns[i].textContent()).trim().substring(0, 60);
            const vis = await allBtns[i].isVisible().catch(() => false);
            if (text && vis) console.log('  [' + i + '] "' + text + '"');
        } catch(e) {}
    }
    
    // Check for the contact's name in the page
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 800)).catch(() => '');
    console.log('Body text (first 800):');
    console.log(bodyText);
    
    // Take screenshot
    await page.screenshot({ path: 'after_nav_phyllis.jpg', type: 'jpeg', quality: 50 }).catch(() => {});
    console.log('Screenshot: after_nav_phyllis.jpg');
    
    b.close();
})().catch(e => console.error(e.message));