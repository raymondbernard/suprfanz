const { chromium } = require('playwright');
const profiles = process.argv[2] ? JSON.parse(process.argv[2]) : [];

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    
    for (let idx = 0; idx < profiles.length; idx++) {
        const p = profiles[idx];
        const pid = p.fb_profile_id.replace(/^\//, '');
        console.log(`\n[${idx+1}/${profiles.length}] Checking: ${p.fb_name} (${pid})`);
        
        let page = null;
        try {
            page = await context.newPage();
            await page.goto(`https://www.messenger.com/t/${pid}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await page.waitForTimeout(3000);
            
            // Check for Continue button
            let continueClicked = false;
            for (let attempt = 0; attempt < 3; attempt++) {
                const btn = page.locator('div[role="button"]:has-text("Continue"), button:has-text("Continue")');
                const count = await btn.count();
                for (let i = 0; i < count; i++) {
                    if (await btn.nth(i).isVisible().catch(() => false)) {
                        await btn.nth(i).click();
                        await page.waitForTimeout(2000);
                        continueClicked = true;
                        break;
                    }
                }
                if (continueClicked) break;
                if (attempt < 2) await page.waitForTimeout(1500);
            }
            
            // Check for textbox
            try {
                await page.waitForSelector('div[role="textbox"]', { state: 'visible', timeout: 7000 });
                console.log(`  ✓ VALID - Textbox found${continueClicked ? ' (after Continue click)' : ''}`);
            } catch (e) {
                console.log(`  ✗ BAD - No textbox found`);
            }
        } catch (e) {
            console.log(`  ✗ ERROR - ${e.message.substring(0, 80)}`);
        } finally {
            if (page) await page.close().catch(() => {});
        }
    }
    
    browser.close();
    console.log('\nDone.');
})().catch(e => console.error('Fatal:', e.message));
