const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    const pages = context.pages();
    let page = pages[0];
    if (!page) page = await context.newPage();
    
    await page.goto('https://housingconnect.nyc.gov/PublicWeb/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
    await page.waitForTimeout(3000);
    
    // Click the "Log In" button (it's a <button>, not <a>)
    console.log('Clicking Log In button...');
    const loginBtn = page.locator('button:has-text("Log In")').first();
    const visible = await loginBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Login button visible:', visible);
    
    if (visible) {
        await loginBtn.click();
        await page.waitForTimeout(5000);
        console.log('After click URL:', page.url());
    } else {
        // Try the link
        console.log('Trying Log In link...');
        await page.locator('a:has-text("Log In")').first().click().catch(() => {});
        await page.waitForTimeout(5000);
        console.log('After link click URL:', page.url());
    }
    
    // Now we should be on the auth server login page
    // Wait for the user to log in
    console.log('');
    console.log('========================================');
    console.log('PLEASE LOG IN IN THE CHROME WINDOW');
    console.log('Script will detect login and continue');
    console.log('========================================');
    
    for (let i = 0; i < 120; i++) {
        await page.waitForTimeout(3000);
        try {
            const url = page.url();
            if (url.includes('housingconnect.nyc.gov') && !url.includes('a806') && !url.includes('login')) {
                // Check dashboard
                await page.goto('https://housingconnect.nyc.gov/PublicWeb/dashboard', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
                await page.waitForTimeout(2000);
                if (!page.url().includes('unauthorized')) {
                    console.log('LOGIN OK! Dashboard:', page.url());
                    
                    // Now navigate to household setup
                    await page.goto('https://housingconnect.nyc.gov/PublicWeb/household/setup', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => {});
                    await page.waitForTimeout(3000);
                    console.log('Household setup URL:', page.url());
                    
                    // Take screenshot
                    await page.screenshot({ path: 'C:/Users/RayBe/.openclaw/workspace/housing/applications/screenshots/household_setup_ready.png' }).catch(() => {});
                    
                    // Quick dump
                    const inputs = await page.locator('input, button, label').all();
                    console.log('Elements on household setup:', inputs.length);
                    
                    const btns = await page.locator('button').all();
                    console.log('Buttons:');
                    for (const b of btns.slice(0, 10)) {
                        try {
                            const text = (await b.textContent()).trim().substring(0, 60);
                            const disabled = await b.isDisabled().catch(() => false);
                            const vis = await b.isVisible().catch(() => false);
                            if (text && vis) console.log('  "' + text + '" disabled=' + disabled);
                        } catch(e) {}
                    }
                    
                    console.log('RESULT: READY_TO_FILL');
                    break;
                }
            }
            if (i % 10 === 0) console.log('Waiting for login... (' + (i*3) + 's)');
        } catch(e) {}
    }
    
    console.log('DONE');
    browser.close();
})().catch(e => console.error('ERROR:', e.message));