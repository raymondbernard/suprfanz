const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create debug folder
const debugDir = path.join(__dirname, 'debug_screenshots');
if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);

(async () => {
    try {
        console.log('Connecting to Chrome...');
        const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
        const context = browser.contexts()[0];
        
        let page = null;
        for (const p of context.pages()) {
            try {
                if (p.url().includes('messenger.com')) { page = p; break; }
            } catch(e) {}
        }
        if (!page) page = context.pages()[0];
        
        console.log('Using page:', page.url());
        
        // Test contacts - first 5 from CSV
        const contacts = [
            { name: 'Jernej_Bervar', url: 'https://www.messenger.com/t/jernej.bervar' },
            { name: 'Johan_Vipper', url: 'https://www.messenger.com/t/jvipper' },
            { name: 'Em_Jay', url: 'https://www.messenger.com/t/jen.doyon.1' },
            { name: 'Frank_Fois', url: 'https://www.messenger.com/t/FrankFoisMusic' },
            { name: 'David_Fleming', url: 'https://www.messenger.com/t/dracon' },
        ];
        
        for (const contact of contacts) {
            console.log(`\n--- ${contact.name} ---`);
            console.log('Navigating to:', contact.url);
            
            try {
                await page.goto(contact.url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(e => {
                    console.log('  Nav slow:', e.message.substring(0, 50));
                });
                
                // Wait 3 seconds for render
                await page.waitForTimeout(3000);
                
                // BEFORE screenshot (after nav, before anything)
                const beforePath = path.join(debugDir, `before_${contact.name}.png`);
                await page.screenshot({ path: beforePath, fullPage: false });
                console.log('  Before screenshot saved');
                
                // Check for textbox
                const tbCount = await page.locator('div[role="textbox"]').count();
                console.log('  Textbox count:', tbCount);
                
                if (tbCount > 0) {
                    const tb = page.locator('div[role="textbox"]').first();
                    const visible = await tb.isVisible().catch(() => false);
                    console.log('  Textbox visible:', visible);
                    
                    // Click it
                    if (visible) {
                        await tb.click().catch(e => console.log('  Click failed:', e.message.substring(0, 50)));
                        await page.waitForTimeout(1000);
                        
                        // AFTER click screenshot
                        const afterPath = path.join(debugDir, `after_click_${contact.name}.png`);
                        await page.screenshot({ path: afterPath, fullPage: false });
                        console.log('  After click screenshot saved');
                        
                        // Type test message (DO NOT SEND)
                        await page.keyboard.type('Test message - not sending', { delay: 5 });
                        await page.waitForTimeout(500);
                        
                        // AFTER typing screenshot
                        const typedPath = path.join(debugDir, `after_type_${contact.name}.png`);
                        await page.screenshot({ path: typedPath, fullPage: false });
                        console.log('  After typing screenshot saved');
                        
                        // Check what's in the textbox
                        const text = await tb.textContent().catch(() => 'could not read');
                        console.log('  Textbox content:', JSON.stringify(text.substring(0, 50)));
                        
                        // Clear the message (don't send!)
                        await page.keyboard.press('Control+a');
                        await page.waitForTimeout(200);
                        await page.keyboard.press('Delete');
                        await page.waitForTimeout(500);
                        console.log('  Cleared (NOT sent)');
                    }
                } else {
                    console.log('  NO TEXTBOX FOUND');
                    // Take extra screenshot
                    const errPath = path.join(debugDir, `error_${contact.name}.png`);
                    await page.screenshot({ path: errPath, fullPage: false });
                }
                
            } catch(e) {
                console.log('  ERROR:', e.message.substring(0, 80));
                const errPath = path.join(debugDir, `error_${contact.name}.png`);
                await page.screenshot({ path: errPath, fullPage: false }).catch(() => {});
            }
        }
        
        console.log('\n=== DEBUG COMPLETE ===');
        console.log(`Screenshots saved to: ${debugDir}`);
        const files = fs.readdirSync(debugDir);
        files.forEach(f => console.log(`  ${f}`));
        
        await browser.close();
    } catch (error) {
        console.error('FATAL:', error.message);
        process.exit(1);
    }
})();