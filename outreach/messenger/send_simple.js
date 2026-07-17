const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EVENT_URL = 'https://www.facebook.com/events/971902445574502';
const debugDir = path.join(__dirname, 'debug_screenshots');
const CSV_PATH = path.join(__dirname, 'fbfriends.csv');
const HISTORY_PATH = path.join(__dirname, 'message_history.json');

const contacts = require('./contacts_100.js').contacts;

const messages = [
    (f) => `Hey ${f}!\n\nPutting together a blues show and immediately thought of you. Come hang! Also, hitting "Interested" on the event page helps other blues fans discover it.\n\n${EVENT_URL}`,
    (f) => `Hi ${f}!\n\nWe've got a blues night coming up that I thought you'd dig. Would love to see you there! If you can, click "Interested" on the event page—it really helps spread the word.\n\n${EVENT_URL}`,
    (f) => `Hey ${f}!\n\nHope you're doing well! I'm organizing a blues show and wanted to invite you. Check it out, and if you're interested, click the "Interested" button on the event page - it helps with visibility!\n\n${EVENT_URL}`,
    (f) => `Hey ${f}! Big news - we're putting together an amazing blues night! Think you'd really love the vibe. Come through! And if you click "Interested" on the event page, it helps other blues lovers find us.\n\n${EVENT_URL}`,
    (f) => `Hi ${f}!\n\nDon't miss out on this blues night we've got coming up! Great music, good times. Would love to have you there. Click "Interested" on the event page to help spread the word to other blues fans!\n\n${EVENT_URL}`,
];

function loadCSV() {
    return new Promise((resolve) => {
        const rows = [];
        fs.createReadStream(CSV_PATH).pipe(require('csv-parser')()).on('data', (r) => rows.push(r)).on('end', () => resolve(rows));
    });
}

function saveCSV(rows) {
    if (!rows.length) return;
    const fields = Object.keys(rows[0]);
    const lines = [fields.join(',')];
    for (const r of rows) {
        lines.push(fields.map(f => { let v = r[f] || ''; return v.includes(',') ? `"${v}"` : v; }).join(','));
    }
    fs.writeFileSync(CSV_PATH, lines.join('\n'));
}

function loadHistory() { try { return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8')); } catch { return {}; } }
function saveHistory(h) { fs.writeFileSync(HISTORY_PATH, JSON.stringify(h, null, 2)); }

(async () => {
    console.log('=== AUTO SEND (SIMPLE) ===');
    console.log('Contacts:', contacts.length);
    
    const csvRows = await loadCSV();
    const history = loadHistory();
    
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    
    let page = null;
    for (const p of context.pages()) {
        try { if (p.url().includes('messenger.com')) { page = p; break; } } catch {}
    }
    if (!page) page = context.pages()[0];
    
    console.log('Page:', page.url());
    
    let sent = 0, bad = 0, errors = 0, skipped = 0;
    
    for (let i = 0; i < contacts.length; i++) {
        const c = contacts[i];
        const msg = messages[i % messages.length](c.first || c.name.split(' ')[0]);
        const safe = c.name.replace(/\s+/g, '_').replace(/\./g, '_');
        const pid = c.url.split('/t/')[1];
        
        process.stdout.write(`[${i+1}/${contacts.length}] ${c.name}: `);
        
        try {
            // Check page alive
            try { await page.url(); } catch {
                console.log('page dead, reconnecting...');
                try { await browser.close(); } catch {}
                const b2 = await chromium.connectOverCDP('http://127.0.0.1:9222');
                const ctx2 = b2.contexts()[0];
                page = ctx2.pages().find(p => { try { return p.url().includes('messenger.com') } catch { return false } }) || ctx2.pages()[0];
                browser = b2;
            }
            
            // Navigate with short timeout
            await page.goto(c.url, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
            await page.waitForTimeout(2000);
            
            // Quick Continue button check (1 try only)
            try {
                const btns = await page.locator('div[role="button"], button').all();
                for (const b of btns) {
                    const t = await b.textContent().catch(() => '');
                    if (await b.isVisible().catch(() => false) && t.toLowerCase().includes('continue')) {
                        process.stdout.write('Continue... ');
                        await b.click();
                        await page.waitForTimeout(2000);
                        break;
                    }
                }
            } catch {}
            
            // Find textbox (short timeout)
            const tb = page.locator('div[role="textbox"]').first();
            await tb.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
            
            if (await page.locator('div[role="textbox"]').count() === 0) {
                console.log('BAD (no textbox)');
                bad++;
                for (const r of csvRows) { if ((r.fb_profile_id||'').replace(/^\//,'') === pid) { r.message_sent='bad'; r.last_error='No textbox'; } }
                saveCSV(csvRows);
                continue;
            }
            
            // Type and send
            await tb.click();
            await page.waitForTimeout(300);
            await page.keyboard.type(msg, { delay: 3 });
            await page.waitForTimeout(200);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);
            
            await page.screenshot({ path: path.join(debugDir, `sent_${safe}.png`), fullPage: false }).catch(() => {});
            
            console.log('SENT');
            sent++;
            
            for (const r of csvRows) { if ((r.fb_profile_id||'').replace(/^\//,'') === pid) { r.message_sent='true'; r.sent_at=new Date().toISOString(); r.last_error=''; } }
            saveCSV(csvRows);
            if (!history[pid]) history[pid] = [];
            history[pid].push({ contact_id: pid, contact_name: c.name, sent_at: new Date().toISOString(), event_url: EVENT_URL });
            saveHistory(history);
            
            // Short delay
            if (i < contacts.length - 1) {
                const d = 3 + Math.floor(Math.random() * 7);
                process.stdout.write(`(${d}s) `);
                await new Promise(r => setTimeout(r, d * 1000));
            }
            
        } catch(e) {
            console.log('ERROR: ' + e.message.substring(0, 40));
            errors++;
            // Try reconnect on next iteration
        }
    }
    
    console.log(`\n=== DONE ===`);
    console.log(`Sent: ${sent} | Bad: ${bad} | Errors: ${errors}`);
    
    try { await browser.close(); } catch {}
})();