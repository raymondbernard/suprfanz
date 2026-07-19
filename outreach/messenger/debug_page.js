const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const ctx = browser.contexts()[0];
    let page = null;
    for (const p of ctx.pages()) {
        try { if (p.url().includes('messenger.com')) { page = p; break; } } catch(e) {}
    }
    if (!page) page = ctx.pages()[0];
    console.log('URL:', page.url());
    
    // Check for textbox
    const tb = page.locator('div[role="textbox"]');
    const tbCount = await tb.count();
    console.log('Textbox count:', tbCount);
    if (tbCount > 0) {
        const vis = await tb.first().isVisible().catch(() => false);
        console.log('Textbox visible:', vis);
    }
    
    // Check for Continue button
    const btns = await page.locator('div[role="button"], button').all();
    console.log('Buttons (' + btns.length + '):');
    for (const b of btns.slice(0, 10)) {
        try {
            const text = (await b.textContent()).trim().substring(0, 40);
            const vis = await b.isVisible().catch(() => false);
            if (text && vis) console.log('  "' + text + '" visible=' + vis);
        } catch(e) {}
    }
    
    // Check page text
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500)).catch(() => '');
    console.log('Body text (first 500):');
    console.log(bodyText.substring(0, 500));
    
    // Check if event link already in conversation
    if (bodyText.includes('971902445574502')) {
        console.log('EVENT_LINK_FOUND: already sent');
    }
    
    // Take JPEG screenshot (fast, no font wait)
    await page.screenshot({ path: 'debug_state.jpg', type: 'jpeg', quality: 60 }).catch(e => console.log('SS error:', e.message));
    console.log('Screenshot: debug_state.jpg');
    
    browser.close();
})().catch(e => console.error('ERROR:', e.message));