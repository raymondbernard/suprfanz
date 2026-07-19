const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    
    const pages = context.pages();
    let page = pages[0];
    if (!page) page = await context.newPage();
    
    // Navigate to Housing Connect main page
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav:', e.message));
    await page.waitForTimeout(3000);
    console.log('URL:', page.url());
    
    // Check if we see "Log In" (not logged in)
    const loginLink = page.locator('a:has-text("Log In")').first();
    const loginVisible = await loginLink.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Log In link visible:', loginVisible);
    
    if (loginVisible) {
        console.log('Clicking Log In...');
        await loginLink.click();
        await page.waitForTimeout(5000);
        console.log('Login page URL:', page.url());
        console.log('');
        console.log('========================================');
        console.log('PLEASE LOG IN IN THE CHROME WINDOW');
        console.log('The script will wait for you to complete login.');
        console.log('Once you see the Housing Connect dashboard,');
        console.log('the script will detect it and continue.');
        console.log('========================================');
        
        // Wait for redirect back to housingconnect dashboard
        for (let i = 0; i < 60; i++) {
            await page.waitForTimeout(5000);
            try {
                const url = page.url();
                if (url.includes('housingconnect.nyc.gov') && !url.includes('login') && !url.includes('auth') && !url.includes('a806')) {
                    // Check if we're really logged in
                    await page.goto('https://housingconnect.nyc.gov/PublicWeb/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
                    await page.waitForTimeout(3000);
                    if (!page.url().includes('unauthorized')) {
                        console.log('LOGIN SUCCESSFUL! Dashboard:', page.url());
                        console.log('RESULT: LOGIN_OK');
                        break;
                    }
                }
                if (i % 6 === 0) console.log('Still waiting... (' + (i*5) + 's)');
            } catch(e) {}
        }
    } else {
        // Check if already logged in
        await page.goto('https://housingconnect.nyc.gov/PublicWeb/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(3000);
        if (!page.url().includes('unauthorized')) {
            console.log('Already logged in!');
            console.log('RESULT: LOGIN_OK');
        } else {
            console.log('Not logged in and no Log In link found');
            console.log('RESULT: LOGIN_FAILED');
        }
    }
    
    browser.close();
})().catch(e => console.error('ERROR:', e.message));