const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EVENT_URL = 'https://www.facebook.com/events/971902445574502';
const DAILY_LIMIT = 200;
const debugDir = path.join(__dirname, 'debug_screenshots');
const CSV_PATH = path.join(__dirname, 'fbfriends.csv');
const HISTORY_PATH = path.join(__dirname, 'message_history.json');

const contacts = require('./contacts_100.js').contacts;

// 15 message templates for more variety
const messages = [
    (f) => `Hey ${f}!\n\nPutting together a blues show and immediately thought of you. Come hang! Also, hitting "Interested" on the event page helps other blues fans discover it.\n\n${EVENT_URL}`,
    (f) => `Hi ${f}!\n\nWe've got a blues night coming up that I thought you'd dig. Would love to see you there! If you can, click "Interested" on the event page—it really helps spread the word.\n\n${EVENT_URL}`,
    (f) => `Hey ${f}!\n\nHope you're doing well! I'm organizing a blues show and wanted to invite you. Check it out, and if you're interested, click the "Interested" button on the event page - it helps with visibility!\n\n${EVENT_URL}`,
    (f) => `Hey ${f}! Big news - we're putting together an amazing blues night! Think you'd really love the vibe. Come through! And if you click "Interested" on the event page, it helps other blues lovers find us.\n\n${EVENT_URL}`,
    (f) => `Hi ${f}!\n\nDon't miss out on this blues night we've got coming up! Great music, good times. Would love to have you there. Click "Interested" on the event page to help spread the word to other blues fans!\n\n${EVENT_URL}`,
    (f) => `Hi ${f}! Thinking of you and wanted to personally invite you to our upcoming blues show. It would mean a lot to have you there. If you can, click "Interested" on the event page - every bit helps!\n\n${EVENT_URL}`,
    (f) => `Hey ${f}!\n\nAs a fellow music lover, I wanted to reach out about our blues show. Your support would mean the world to us! Click "Interested" on the event page to help us reach more blues fans.\n\n${EVENT_URL}`,
    (f) => `Hey ${f},\n\nBlues show coming up - you're invited! Click "Interested" on the event page to help with visibility.\n\n${EVENT_URL}`,
    (f) => `Hey ${f}!\n\nEver been to a live blues show that just hit different? We're creating one of those nights. Curious if you'd be into it? Click "Interested" on the event page and help other blues fans discover it too!\n\n${EVENT_URL}`,
    (f) => `Hi ${f}!\n\nQuick favor - would you mind checking out our upcoming blues event? I'd love your support! Clicking "Interested" on the event page really helps with visibility for blues fans in the area.\n\n${EVENT_URL}`,
    (f) => `Hey ${f}! 🎸\n\nWe're back at it with another blues night. Always love seeing you at shows. If you can make it, click "Interested" on the event page - helps the blues community find us!\n\n${EVENT_URL}`,
    (f) => `Hi ${f}!\n\nJust wanted to drop you a line about our next blues show. Really hoping you can make it this time! Clicking "Interested" on the event page goes a long way for visibility.\n\n${EVENT_URL}`,
    (f) => `Hey ${f}!\n\nGot a blues night coming up that's gonna be special. Would be great to have you in the room. Hit "Interested" on the event page if you can - it really helps us reach more people!\n\n${EVENT_URL}`,
    (f) => `Hi ${f}!\n\nMusic, good people, and blues - that's the plan for our next show. Would love to see you there! Click "Interested" on the event page to help us spread the word.\n\n${EVENT_URL}`,
    (f) => `Hey ${f},\n\nPutting together another night of cosmic blues. You've been on my list of people who'd appreciate it. Come through! And hit "Interested" on the event page to help other blues fans find us.\n\n${EVENT_URL}`,
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

function countSentToday(csvRows) {
    const today = new Date().toISOString().substring(0, 10);
    return csvRows.filter(r => (r.sent_at || '').startsWith(today) && r.message_sent === 'true').length;
}

(async () => {
    console.log('=== AUTO SEND (VARIETY + DAILY LIMIT) ===');
    
    const csvRows = await loadCSV();
    const history = loadHistory();
    
    const sentToday = countSentToday(csvRows);
    console.log(`Sent today: ${sentToday}/${DAILY_LIMIT}`);
    
    if (sentToday >= DAILY_LIMIT) {
        console.log('DAILY LIMIT REACHED! Stopping to avoid being blocked.');
        process.exit(0);
    }
    
    const remaining = DAILY_LIMIT - sentToday;
    const toSend = contacts.slice(0, Math.min(remaining, contacts.length));
    console.log(`Can send: ${remaining} more today`);
    console.log(`Batch: ${toSend.length} contacts`);
    console.log('');
    
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    
    let page = null;
    for (const p of context.pages()) {
        try { if (p.url().includes('messenger.com')) { page = p; break; } } catch {}
    }
    if (!page) page = context.pages()[0];
    
    console.log('Page:', page.url());
    
    let sent = 0, bad = 0, errors = 0;
    let totalSentThisRun = 0;
    
    for (let i = 0; i < toSend.length; i++) {
        const c = toSend[i];
        // Pick a random message template for variety
        const msgIdx = Math.floor(Math.random() * messages.length);
        const msg = messages[msgIdx](c.first || c.name.split(' ')[0]);
        const safe = c.name.replace(/\s+/g, '_').replace(/\./g, '_');
        const pid = c.url.split('/t/')[1];
        
        process.stdout.write(`[${i+1}/${toSend.length}] ${c.name}: `);
        
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
            
            // Navigate
            await page.goto(c.url, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
            await page.waitForTimeout(2000);
            
            // Quick Continue button check
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
            
            // Find textbox
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
            totalSentThisRun++;
            
            for (const r of csvRows) { if ((r.fb_profile_id||'').replace(/^\//,'') === pid) { r.message_sent='true'; r.sent_at=new Date().toISOString(); r.last_error=''; } }
            saveCSV(csvRows);
            if (!history[pid]) history[pid] = [];
            history[pid].push({ contact_id: pid, contact_name: c.name, sent_at: new Date().toISOString(), event_url: EVENT_URL });
            saveHistory(history);
            
            // Check daily limit
            if (sentToday + totalSentThisRun >= DAILY_LIMIT) {
                console.log(`\nDAILY LIMIT REACHED (${DAILY_LIMIT})! Stopping.`);
                break;
            }
            
            // Delay between sends (varied: 3-12s)
            if (i < toSend.length - 1) {
                const d = 3 + Math.floor(Math.random() * 9);
                process.stdout.write(`(${d}s) `);
                await new Promise(r => setTimeout(r, d * 1000));
            }
            
        } catch(e) {
            console.log('ERROR: ' + e.message.substring(0, 40));
            errors++;
        }
    }
    
    console.log(`\n=== DONE ===`);
    console.log(`Sent this run: ${sent} | Bad: ${bad} | Errors: ${errors}`);
    console.log(`Total sent today: ${sentToday + totalSentThisRun}/${DAILY_LIMIT}`);
    
    try { await browser.close(); } catch {}
})();