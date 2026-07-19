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

    // Navigate to lottery detail
    console.log('=== Lottery 7569 (1760 3rd Avenue) ===');
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/details/7569', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(5000);
    
    // Scroll down to find Apply button
    console.log('Scrolling to find Apply button...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: shotDir + 'lottery_scrolled.png' }).catch(() => {});
    
    // Check ALL buttons on the page (visible or not)
    const allBtns = await page.locator('button').all();
    console.log('\nAll buttons (' + allBtns.length + '):');
    for (let i = 0; i < allBtns.length; i++) {
        try {
            const b = allBtns[i];
            const text = (await b.textContent()).trim().substring(0, 60);
            const visible = await b.isVisible().catch(() => false);
            const disabled = await b.isDisabled().catch(() => false);
            const box = await b.boundingBox().catch(() => null);
            console.log('  [' + i + '] "' + text + '" visible=' + visible + ' disabled=' + disabled + (box ? ' y=' + Math.round(box.y) : ' no-box'));
        } catch(e) {}
    }
    
    // Also check for links with "Apply" text
    const applyLinks = await page.locator('a:has-text("Apply")').all();
    console.log('\nApply links (' + applyLinks.length + '):');
    for (const a of applyLinks) {
        try {
            const text = (await a.textContent()).trim();
            const href = await a.getAttribute('href') || '';
            const visible = await a.isVisible().catch(() => false);
            console.log('  "' + text + '" href=' + href + ' visible=' + visible);
        } catch(e) {}
    }
    
    // Check for elements with "Apply" in their text content
    const applyElements = await page.locator('*:has-text("Apply")').all();
    console.log('\nElements containing "Apply" (' + applyElements.length + '):');
    for (const el of applyElements.slice(0, 15)) {
        try {
            const tag = await el.evaluate(e => e.tagName);
            const text = (await el.textContent()).trim().substring(0, 80);
            const visible = await el.isVisible().catch(() => false);
            if (visible && tag !== 'HTML' && tag !== 'BODY') console.log('  ' + tag + ': "' + text + '"');
        } catch(e) {}
    }
    
    // Try a different lottery — let's try 7548 (Rialto West) which is listed as Active
    console.log('\n=== Trying lottery 7548 (Rialto West) ===');
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/details/7548', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(5000);
    console.log('URL:', page.url());
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: shotDir + 'rialto_detail.png' }).catch(() => {});
    
    const rialtoBtns = await page.locator('button').all();
    console.log('\nRialto buttons (' + rialtoBtns.length + '):');
    for (let i = 0; i < rialtoBtns.length; i++) {
        try {
            const text = (await rialtoBtns[i].textContent()).trim().substring(0, 60);
            const visible = await rialtoBtns[i].isVisible().catch(() => false);
            const disabled = await rialtoBtns[i].isDisabled().catch(() => false);
            console.log('  [' + i + '] "' + text + '" visible=' + visible + ' disabled=' + disabled);
        } catch(e) {}
    }
    
    // Check tabs — maybe Apply is under a tab
    const tabs = await page.locator('[role="tab"], [class*="tab"], .nav-link').all();
    console.log('\nTabs (' + tabs.length + '):');
    for (const t of tabs.slice(0, 10)) {
        try {
            const text = (await t.textContent()).trim().substring(0, 60);
            const visible = await t.isVisible().catch(() => false);
            console.log('  "' + text + '" visible=' + visible);
        } catch(e) {}
    }
    
    // Check headings to understand page layout
    const headings = await page.locator('h1, h2, h3, h4, h5').all();
    console.log('\nHeadings:');
    for (const h of headings.slice(0, 20)) {
        try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
    }
    
    // Check if there's a login wall message
    const bodyText = await page.locator('body').textContent();
    if (bodyText.includes('log in') || bodyText.includes('login') || bodyText.includes('register')) {
        const lower = bodyText.toLowerCase();
        for (const term of ['log in to apply', 'must log in', 'please log in', 'need to log in', 'sign in to apply', 'create an account']) {
            if (lower.includes(term)) console.log('\n*** Found: "' + term + '" ***');
        }
    }
    
    console.log('\n=== DONE ===');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));