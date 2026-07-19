const { chromium } = require('playwright');
(async () => {
    const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const c = b.contexts()[0];
    let page = null;
    for (const p of c.pages()) {
        try { if (p.url().includes('messenger.com')) { page = p; break; } } catch(e) {}
    }
    if (!page) { console.log('No messenger page'); b.close(); return; }
    console.log('URL:', page.url());
    
    // Check for Continue button
    const allBtns = await page.locator('div[role="button"], button, a[role="button"]').all();
    console.log('All buttons (' + allBtns.length + '):');
    for (let i = 0; i < Math.min(allBtns.length, 25); i++) {
        try {
            const text = (await allBtns[i].textContent()).trim().substring(0, 50);
            const vis = await allBtns[i].isVisible().catch(() => false);
            if (text && vis) console.log('  [' + i + '] "' + text + '"');
        } catch(e) {}
    }
    
    // Check textbox
    const tb = await page.locator('div[role="textbox"]').count().catch(() => 0);
    console.log('Textbox count:', tb);
    
    // Check for dialog/modal
    const dialog = page.locator('[role="dialog"], [aria-modal="true"]');
    const dialogCount = await dialog.count().catch(() => 0);
    console.log('Dialog count:', dialogCount);
    if (dialogCount > 0) {
        const dialogText = await dialog.first().textContent().catch(() => '');
        console.log('Dialog text (first 300):', dialogText.substring(0, 300));
    }
    
    // Body text
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500)).catch(() => '');
    console.log('Body text (first 500):');
    console.log(bodyText);
    
    // Screenshot
    await page.screenshot({ path: 'analysis_now.jpg', type: 'jpeg', quality: 40 }).catch(() => {});
    console.log('Screenshot: analysis_now.jpg');
    
    b.close();
})().catch(e => console.error(e.message));