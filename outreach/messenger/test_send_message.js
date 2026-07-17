const { chromium } = require('playwright');

(async () => {
    const MSG = `Hey Johan!

Putting together a blues show and immediately thought of you. Come hang! Also, hitting "Interested" on the event page helps other blues fans discover it.

https://www.facebook.com/events/971902445574502`;

    try {
        console.log('Connecting to Chrome...');
        const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
        const context = browser.contexts()[0];
        
        // Find messenger page
        let page = null;
        for (const p of context.pages()) {
            try {
                if (p.url().includes('messenger.com')) { page = p; break; }
            } catch(e) {}
        }
        if (!page) page = context.pages()[0];
        
        console.log('Page URL:', page.url());
        
        // Wait for page to settle
        await page.waitForTimeout(3000);
        
        // Find the textbox
        console.log('Looking for message composer...');
        const textbox = page.locator('div[role="textbox"]').first();
        await textbox.waitFor({ timeout: 15000 });
        console.log('Found textbox!');
        
        // Click to focus
        console.log('Clicking textbox...');
        await textbox.click();
        await page.waitForTimeout(500);
        
        // Type using keyboard.type() - this is what works with Lexical editor
        console.log('Typing message...');
        await page.keyboard.type(MSG, { delay: 10 });
        await page.waitForTimeout(1000);
        
        // Verify
        const text = await textbox.textContent();
        console.log('Textbox content:', JSON.stringify(text.substring(0, 50)));
        
        if (text.includes('Hey Johan')) {
            console.log('SUCCESS: Message is in the composer!');
            console.log('Review it in Messenger and press Enter to send.');
        } else {
            console.log('WARNING: Message may not have been typed correctly');
        }
        
        await browser.close();
    } catch (error) {
        console.error('ERROR:', error.message);
        process.exit(1);
    }
})();