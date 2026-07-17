const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Create debug folder
const debugDir = path.join(__dirname, 'debug_screenshots');
if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);

// Read first 10 pending contacts from CSV
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
        
        for (const contact of contacts) {
            console.log(`\n--- ${contact.name} ---`);
            console.log('URL:', contact.url);
            
            try {
                // Navigate
                await page.goto(contact.url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(e => {
                    console.log('  Nav slow');
                });
                
                // Wait for render
                await page.waitForTimeout(3000);
                
                // BEFORE screenshot
                const beforePath = path.join(debugDir, `before_${contact.name}.png`);
                await page.screenshot({ path: beforePath, fullPage: false, timeout: 10000 }).catch(e => {
                    console.log('  Screenshot failed');
                });
                
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
                        
                        // Type test message (DO NOT SEND)
                        await page.keyboard.type('Test - not sending', { delay: 5 });
                        await page.waitForTimeout(500);
                        
                        // AFTER typing screenshot
                        const afterPath = path.join(debugDir, `after_type_${contact.name}.png`);
                        await page.screenshot({ path: afterPath, fullPage: false, timeout: 10000 }).catch(() => {});
                        
                        // Verify content
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
        const files = fs.readdirSync(debugDir);
        console.log(`Screenshots: ${files.length} files in debug_screenshots/`);
        files.forEach(f => console.log(`  ${f}`));
        
        await browser.close();
    } catch (error) {
        console.error('FATAL:', error.message);
        process.exit(1);
    }
  });