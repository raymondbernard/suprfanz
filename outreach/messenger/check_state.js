const { chromium } = require('playwright');
(async () => {
    const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const c = b.contexts()[0];
    for (const p of c.pages()) {
        try {
            if (p.url().includes('messenger')) {
                console.log('URL:', p.url());
                const tbCount = await p.locator('div[role="textbox"]').count().catch(() => 0);
                console.log('Textbox count:', tbCount);
                if (tbCount > 0) {
                    const vis = await p.locator('div[role="textbox"]').first().isVisible().catch(() => false);
                    console.log('Textbox visible:', vis);
                }
                break;
            }
        } catch(e) {}
    }
    b.close();
})().catch(e => console.error(e.message));