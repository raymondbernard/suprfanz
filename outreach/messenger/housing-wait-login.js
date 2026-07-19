const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    let page = null;
    for (const p of context.pages()) {
        try { if (p.url().includes('housingconnect') || p.url().includes('a806')) { page = p; break; } } catch(e) {}
    }
    if (!page) page = context.pages[0];

    const shotDir = 'C:/Users/RayBe/.openclaw/workspace/housing/applications/screenshots/';
    
    console.log('Current URL:', page.url());
    console.log('Waiting for user to log in...');
    console.log('Monitoring for redirect back to housingconnect.nyc.gov...');
    
    // Poll every 3 seconds for up to 5 minutes, checking if we're logged in
    for (let i = 0; i < 100; i++) {
        await page.waitForTimeout(3000);
        
        try {
            const url = page.url();
            
            // Check if we're back on housingconnect (logged in)
            if (url.includes('housingconnect.nyc.gov') && !url.includes('auth') && !url.includes('login')) {
                // Verify by checking dashboard
                await page.goto('https://housingconnect.nyc.gov/PublicWeb/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
                await page.waitForTimeout(3000);
                
                if (!page.url().includes('unauthorized')) {
                    console.log('LOGGED IN! Dashboard URL:', page.url());
                    await page.screenshot({ path: shotDir + 'dashboard_logged_in.png' }).catch(() => {});
                    
                    // Dump dashboard to see what we have
                    const headings = await page.locator('h1, h2, h3').all();
                    console.log('Dashboard headings:');
                    for (const h of headings.slice(0, 10)) {
                        try { console.log('  ' + (await h.textContent()).trim().substring(0, 80)); } catch(e) {}
                    }
                    
                    const links = await page.locator('a').all();
                    console.log('Dashboard links:');
                    for (const a of links.slice(0, 20)) {
                        try {
                            const text = (await a.textContent()).trim().substring(0, 50);
                            const href = await a.getAttribute('href') || '';
                            if (text && href) console.log('  "' + text + '" -> ' + href);
                        } catch(e) {}
                    }
                    
                    console.log('RESULT: LOGIN_OK');
                    break;
                }
            }
            
            if (i % 10 === 0) console.log('Still waiting... (' + (i*3) + 's) URL:', url.substring(0, 80));
        } catch(e) {
            // Page might be navigating
        }
    }
    
    console.log('DONE');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));