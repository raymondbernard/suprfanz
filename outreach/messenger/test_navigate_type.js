const { chromium } = require('playwright');

(async () => {
    try {
        console.log('Connecting to Chrome...');
        const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
        const context = browser.contexts()[0];
        
        let page = null;
        for (const p of context.pages()) {
            try {
                console.log('  Page URL:', p.url());
                if (p.url().includes('messenger.com')) { page = p; break; }
            } catch(e) {}
        }
        if (!page) {
            console.log('No messenger page found, using first page');
            page = context.pages()[0];
        }
        
        if (!page) {
            console.log('No pages found at all!');
            process.exit(1);
        }
        
        console.log('Using page:', page.url());
        
        // Navigate to a test contact
        const url = 'https://www.messenger.com/t/jvipper';
        console.log('Navigating to:', url);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 }).catch(e => {
            console.log('networkidle failed:', e.message);
        });
        
        console.log('Current URL after goto:', page.url());
        
        // Wait for textbox
        console.log('Waiting for textbox...');
        const textbox = page.locator('div[role="textbox"]').first();
        await textbox.waitFor({ state: 'visible', timeout: 15000 }).catch(e => {
            console.log('Textbox not found:', e.message);
        });
        
        const count = await page.locator('div[role="textbox"]').count();
        console.log('Textbox count:', count);
        
        if (count > 0) {
            const isVisible = await textbox.isVisible();
            console.log('Textbox visible:', isVisible);
            
            console.log('Clicking...');
            await textbox.click();
            await page.waitForTimeout(500);
            
            console.log('Typing...');
            await page.keyboard.type('test message 123', { delay: 3 });
            await page.waitForTimeout(300);
            
            console.log('Pressing Enter to send...');
            await page.keyboard.press('Enter');
            console.log('SUCCESS!');
        } else {
            console.log('No textbox found - page may not have loaded properly');
        }
        
        await browser.close();
    } catch (error) {
        console.error('ERROR:', error.message);
        process.exit(1);
    }
})();