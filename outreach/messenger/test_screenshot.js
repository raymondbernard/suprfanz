const { chromium } = require('playwright');

(async () => {
    try {
        console.log('Connecting to Chrome...');
        const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
        const context = browser.contexts()[0];
        
        let page = null;
        for (const p of context.pages()) {
            try {
                console.log('  Page:', p.url());
                if (p.url().includes('messenger.com')) { page = p; break; }
            } catch(e) {}
        }
        if (!page) page = context.pages()[0];
        
        console.log('Using page:', page.url());
        
        // Navigate
        const url = 'https://www.messenger.com/t/jvipper';
        console.log('Navigating to:', url);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(e => {
            console.log('Nav slow:', e.message);
        });
        
        console.log('Current URL:', page.url());
        
        // BEFORE screenshot
        await page.screenshot({ path: 'before_test.png', fullPage: false });
        console.log('Before screenshot saved');
        
        // Wait for textbox
        console.log('Waiting for textbox...');
        try {
            await page.waitForSelector('div[role="textbox"]', { state: 'visible', timeout: 15000 });
            console.log('Textbox visible');
        } catch(e) {
            console.log('Textbox not found:', e.message);
            await page.waitForTimeout(5000);
        }
        
        const textbox = page.locator('div[role="textbox"]').first();
        const count = await page.locator('div[role="textbox"]').count();
        console.log('Textbox count:', count);
        
        if (count > 0) {
            console.log('Clicking...');
            await textbox.click();
            await page.waitForTimeout(500);
            
            console.log('Typing...');
            await page.keyboard.type('Hey Johan! Test message from automation.', { delay: 3 });
            await page.waitForTimeout(300);
            
            // AFTER (before send) screenshot
            await page.screenshot({ path: 'after_typing.png', fullPage: false });
            console.log('After typing screenshot saved');
            
            console.log('Pressing Enter to send...');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
            
            // AFTER send screenshot
            await page.screenshot({ path: 'after_send.png', fullPage: false });
            console.log('After send screenshot saved');
            
            console.log('SUCCESS!');
        } else {
            console.log('No textbox found');
            await page.screenshot({ path: 'error_no_textbox.png', fullPage: false });
        }
        
        await browser.close();
    } catch (error) {
        console.error('ERROR:', error.message);
        process.exit(1);
    }
})();