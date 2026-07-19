const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    const pages = context.pages();
    let page = pages[0];
    if (!page) page = await context.newPage();
    
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
    await page.waitForTimeout(3000);
    
    // Dump all links and buttons
    const links = await page.locator('a').all();
    console.log('Links (' + links.length + '):');
    for (const a of links.slice(0, 25)) {
        try {
            const text = (await a.textContent()).trim().substring(0, 40);
            const href = await a.getAttribute('href') || '';
            if (text) console.log('  "' + text + '" -> ' + href);
        } catch(e) {}
    }
    
    const btns = await page.locator('button').all();
    console.log('\nButtons (' + btns.length + '):');
    for (const b of btns.slice(0, 15)) {
        try {
            const text = (await b.textContent()).trim().substring(0, 60);
            if (text) console.log('  "' + text + '"');
        } catch(e) {}
    }
    
    // Body text
    const bodyText = await page.locator('body').textContent();
    console.log('\nBody text (first 600):');
    console.log(bodyText.substring(0, 600));
    
    browser.close();
})().catch(e => console.error('ERROR:', e.message));