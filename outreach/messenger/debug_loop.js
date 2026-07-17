const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const debugDir = path.join(__dirname, 'debug_screenshots');
if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);

const contacts = [];
const csvPath = path.join(__dirname, 'fbfriends.csv');

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    if (row.message_sent === 'true' || row.message_sent === 'bad') return;
    const profileId = (row.fb_profile_id || '').replace(/^\//, '');
    if (!profileId) return;
    contacts.push({
      name: (row.fb_name || profileId).replace(/\s+/g, '_').replace(/\./g, '_').replace(/\//g, '_'),
      url: `https://www.messenger.com/t/${profileId}`
    });
    if (contacts.length >= 10) return;
  })
  .on('end', async () => {
    console.log(`Loaded ${contacts.length} contacts from CSV`);
    
    try {
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
        
        for (const contact of contacts) {
            console.log(`\n--- ${contact.name} ---`);
            console.log('URL:', contact.url);
            
            try {
                await page.goto(contact.url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
                await page.waitForTimeout(2000);
                
                // BEFORE screenshot
                await page.screenshot({ path: path.join(debugDir, `before_${contact.name}.png`), fullPage: false, timeout: 10000 }).catch(() => {});
                
                // DETECT CONTINUE BUTTON
                let continueClicked = false;
                for (let attempt = 0; attempt < 3; attempt++) {
                    try {
                        const buttons = await page.locator('div[role="button"], button').all();
                        for (const btn of buttons) {
                            const text = await btn.textContent().catch(() => '');
                            const isVisible = await btn.isVisible().catch(() => false);
                            if (isVisible && text.toLowerCase().includes('continue')) {
                                console.log('  Continue button found: "' + text + '" — clicking...');
                                await btn.click();
                                continueClicked = true;
                                await page.waitForTimeout(3000);
                                break;
                            }
                        }
                        if (continueClicked) break;
                        if (attempt < 2) await page.waitForTimeout(2000);
                    } catch(e) {}
                }
                
                if (continueClicked) {
                    console.log('  Continue clicked! Waiting for conversation...');
                    await page.screenshot({ path: path.join(debugDir, `after_continue_${contact.name}.png`), fullPage: false, timeout: 10000 }).catch(() => {});
                }
                
                // Check for textbox
                const tbCount = await page.locator('div[role="textbox"]').count();
                console.log('  Textbox:', tbCount > 0 ? 'FOUND' : 'NOT FOUND');
                
                if (tbCount > 0) {
                    const tb = page.locator('div[role="textbox"]').first();
                    const visible = await tb.isVisible().catch(() => false);
                    console.log('  Visible:', visible);
                    
                    if (visible) {
                        await tb.click().catch(() => {});
                        await page.waitForTimeout(500);
                        
                        await page.keyboard.type('Test - not sending', { delay: 5 });
                        await page.waitForTimeout(500);
                        
                        const text = await tb.textContent().catch(() => '');
                        console.log('  Typed:', text.includes('Test') ? 'YES' : 'NO');
                        
                        // Clear (don't send!)
                        await page.keyboard.press('Control+a');
                        await page.waitForTimeout(200);
                        await page.keyboard.press('Delete');
                        console.log('  Cleared (not sent)');
                    }
                } else {
                    console.log('  MARK AS BAD');
                }
                
            } catch(e) {
                console.log('  ERROR:', e.message.substring(0, 60));
            }
        }
        
        console.log('\n=== DEBUG COMPLETE ===');
        await browser.close();
    } catch (error) {
        console.error('FATAL:', error.message);
        process.exit(1);
    }
  });