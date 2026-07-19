const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    let page = context.pages()[0];
    
    // Navigate to Matt Giambo's conversation
    console.log('Navigating to Matt Giambo...');
    await page.goto('https://www.messenger.com/t/djg112', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('NAV_ERR: ' + e.message));
    await page.waitForTimeout(4000);
    
    // Get conversation text
    const mainText = await page.locator('[role="main"]').first().evaluate(el => el.innerText).catch(() => '');
    
    if (mainText.match(/couldn't send|failed to send|unable to send|couldn't deliver|not delivered|message not sent/i)) {
        console.log('VERDICT: FAILED');
        const matches = mainText.match(/couldn't send|failed to send|unable to send|couldn't deliver|not delivered|message not sent/gi);
        console.log('MATCHES: ' + JSON.stringify(matches));
    } else if (mainText.includes('971902445574502')) {
        console.log('VERDICT: SENT — event link confirmed in conversation');
    } else {
        console.log('VERDICT: UNKNOWN');
        console.log('PREVIEW: ' + mainText.substring(0, 600).replace(/\n/g, ' | '));
    }
    
    // Also check sidebar for "Message failed to send"
    const sidebarText = await page.evaluate(() => {
        const sidebar = document.querySelector('[role="navigation"], [aria-label*="Chat" i]');
        return sidebar ? sidebar.innerText.substring(0, 500) : '';
    }).catch(() => '');
    if (sidebarText.match(/failed to send/i)) {
        console.log('SIDEBAR: "Message failed to send" found in sidebar');
    }
    
    browser.close();
})().catch(e => console.error('ERROR: ' + e.message));