const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EVENT_URL = 'https://www.facebook.com/events/971902445574502';
const EVENT_ID = '971902445574502';
const debugDir = path.join(__dirname, 'debug_screenshots');

// First 5 NY contacts to send to
const contacts = [
    { name: 'Allen Halcomb', first: 'Allen', url: 'https://www.messenger.com/t/allen.halcomb.5' },
    { name: 'Frank Fois', first: 'Frank', url: 'https://www.messenger.com/t/FrankFoisMusic' },
    { name: 'David Fleming', first: 'David', url: 'https://www.messenger.com/t/dracon' },
    { name: 'Eleanor Sabo', first: 'Eleanor', url: 'https://www.messenger.com/t/MsEllie' },
    { name: 'Gonzalo Catalan', first: 'Gonzalo', url: 'https://www.messenger.com/t/gcatalanw' },
];

const messages = [
    (f) => `Hey ${f}!\n\nPutting together a blues show and immediately thought of you. Come hang! Also, hitting "Interested" on the event page helps other blues fans discover it.\n\n${EVENT_URL}`,
    (f) => `Hi ${f}!\n\nWe've got a blues night coming up that I thought you'd dig. Would love to see you there! If you can, click "Interested" on the event page—it really helps spread the word.\n\n${EVENT_URL}`,
    (f) => `Hey ${f}!\n\nHope you're doing well! I'm organizing a blues show and wanted to invite you. Check it out, and if you're interested, click the "Interested" button on the event page - it helps with visibility!\n\n${EVENT_URL}`,
    (f) => `Hey ${f}! Big news - we're putting together an amazing blues night! Think you'd really love the vibe. Come through! And if you click "Interested" on the event page, it helps other blues lovers find us.\n\n${EVENT_URL}`,
    (f) => `Hi ${f}!\n\nDon't miss out on this blues night we've got coming up! Great music, good times. Would love to have you there. Click "Interested" on the event page to help spread the word to other blues fans!\n\n${EVENT_URL}`,
];

(async () => {
    console.log('=== AUTO SEND ===');
    console.log('Event:', EVENT_URL);
    console.log('Batch:', contacts.length, 'contacts');
    console.log('');
    
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
        
        let sent = 0, errors = 0;
        
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            const msg = messages[i % messages.length](contact.first);
            const safeName = contact.name.replace(/\s+/g, '_').replace(/\./g, '_');
            
            console.log(`\n[${i+1}/${contacts.length}] ${contact.name} — ${contact.url}`);
            console.log('  Message:', msg.substring(0, 50) + '...');
            
            try {
                // Navigate
                console.log('  Navigating...');
                await page.goto(contact.url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
                await page.waitForTimeout(2000);
                
                // Screenshot before
                await page.screenshot({ path: path.join(debugDir, `send_before_${safeName}.png`), fullPage: false }).catch(() => {});
                
                // Click Continue button if present
                let continueClicked = false;
                for (let attempt = 0; attempt < 5; attempt++) {
                    try {
                        const btns = await page.locator('div[role="button"], button').all();
                        for (const b of btns) {
                            const t = await b.textContent().catch(() => '');
                            if (await b.isVisible().catch(() => false) && t.toLowerCase().includes('continue')) {
                                console.log('  Clicking Continue...');
                                await b.click();
                                continueClicked = true;
                                await page.waitForTimeout(3000);
                                break;
                            }
                        }
                        if (continueClicked) break;
                        if (attempt < 4) await page.waitForTimeout(2000);
                    } catch(e) {}
                }
                
                // Wait for textbox
                const tb = page.locator('div[role="textbox"]').first();
                await tb.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {
                    console.log('  ERROR: No textbox found');
                });
                
                const tbCount = await page.locator('div[role="textbox"]').count();
                if (tbCount === 0) {
                    console.log('  FAILED: No textbox — marking as bad');
                    errors++;
                    continue;
                }
                
                // Check if already sent
                const pageText = await page.evaluate(() => document.body.innerText).catch(() => '');
                if (pageText.includes(EVENT_ID)) {
                    console.log('  ALREADY SENT — skipping');
                    sent++;
                    continue;
                }
                
                // Type and send
                console.log('  Typing message...');
                await tb.click();
                await page.waitForTimeout(500);
                await page.keyboard.type(msg, { delay: 3 });
                await page.waitForTimeout(300);
                
                console.log('  Pressing Enter to send...');
                await page.keyboard.press('Enter');
                await page.waitForTimeout(2000);
                
                // Screenshot after
                await page.screenshot({ path: path.join(debugDir, `send_after_${safeName}.png`), fullPage: false }).catch(() => {});
                
                console.log('  SENT!');
                sent++;
                
                // Delay between messages
                if (i < contacts.length - 1) {
                    const delay = 5 + Math.floor(Math.random() * 10);
                    console.log(`  Waiting ${delay}s...`);
                    await new Promise(r => setTimeout(r, delay * 1000));
                }
                
            } catch(e) {
                console.log('  ERROR:', e.message.substring(0, 60));
                errors++;
            }
        }
        
        console.log(`\n=== BATCH COMPLETE ===`);
        console.log(`Sent: ${sent} | Errors: ${errors}`);
        console.log(`You can close Chrome now.`);
        
        await browser.close();
    } catch (error) {
        console.error('FATAL:', error.message);
        process.exit(1);
    }
})();