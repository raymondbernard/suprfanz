const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const EVENT_URL = 'https://www.facebook.com/events/971902445574502';
const DAILY_LIMIT = 200;
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
    (f) => `Hi ${f}! Thinking of you and wanted to personally invite you to our upcoming blues show. It would mean a lot to have you there. If you can, click "Interested" on the event page - every bit helps!\n\n${EVENT_URL}`,
    (f) => `Hey ${f}!\n\nAs a fellow music lover, I wanted to reach out about our blues show. Your support would mean the world to us! Click "Interested" on the event page to help us reach more blues fans.\n\n${EVENT_URL}`,
    (f) => `Hey ${f},\n\nBlues show coming up - you're invited! Click "Interested" on the event page to help with visibility.\n\n${EVENT_URL}`,
    (f) => `Hey ${f}!\n\nEver been to a live blues show that just hit different? We're creating one of those nights. Curious if you'd be into it? Click "Interested" on the event page and help other blues fans discover it too!\n\n${EVENT_URL}`,
    (f) => `Hi ${f}!\n\nQuick favor - would you mind checking out our upcoming blues event? I'd love your support! Clicking "Interested" on the event page really helps with visibility for blues fans in the area.\n\n${EVENT_URL}`,
    (f) => `Hey ${f}!\n\nGot a blues night coming up that's gonna be special. Would be great to have you in the room. Hit "Interested" on the event page if you can - it really helps us reach more people!\n\n${EVENT_URL}`,
    (f) => `Hi ${f}!\n\nMusic, good people, and blues - that's the plan for our next show. Would love to see you there! Click "Interested" on the event page to help us spread the word.\n\n${EVENT_URL}`,
    (f) => `Hey ${f},\n\nPutting together another night of cosmic blues. You've been on my list of people who'd appreciate it. Come through! And hit "Interested" on the event page to help other blues fans find us.\n\n${EVENT_URL}`,
    (f) => `Hey ${f}! 🎸\n\nWe're back at it with another blues night. Always love seeing you at shows. If you can make it, click "Interested" on the event page - helps the blues community find us!\n\n${EVENT_URL}`,
    (f) => `Hi ${f}!\n\nJust wanted to drop you a line about our next blues show. Really hoping you can make it this time! Clicking "Interested" on the event page goes a long way for visibility.\n\n${EVENT_URL}`,
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
    for (const r of rows) { lines.push(fields.map(f => { let v = r[f] || ''; return v.includes(',') ? `"${v}"` : v; }).join(',')); }
    fs.writeFileSync(CSV_PATH, lines.join('\n'));
}
function loadHistory() { try { return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8')); } catch { return {}; } }
function saveHistory(h) { fs.writeFileSync(HISTORY_PATH, JSON.stringify(h, null, 2)); }

async function isChromeUp() {
    try { const r = await fetch('http://127.0.0.1:9222/json/version'); return r.ok; } catch { return false; }
}

async function relaunchChrome(url) {
    console.log('  Relaunching Chrome...');
    const ud = 'C:\\Users\\RayBe\\AppData\\Local\\Google\\Chrome\\User Data';
    const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    // Clean locks
    try { fs.unlinkSync(path.join(ud, 'Profile 3', 'LOCK')); } catch {}
    try { fs.unlinkSync(path.join(ud, 'Profile 3', 'DevToolsActivePort')); } catch {}
    try { fs.unlinkSync(path.join(ud, 'Profile 3', 'Current Session')); } catch {}
    try { fs.unlinkSync(path.join(ud, 'Profile 3', 'Current Tabs')); } catch {}
    for (const f of ['SingletonLock','SingletonCookie','SingletonSocket']) { try { fs.unlinkSync(path.join(ud, f)); } catch {} }
    
    exec(`start "" "${chrome}" --user-data-dir="${ud}" --profile-directory=Profile 3 --start-maximized --disable-blink-features=AutomationControlled --remote-debugging-port=9222 --remote-allow-origins=* --no-first-run --no-default-browser-check --no-restore-last-session ${url || 'https://www.messenger.com'}`);
    
    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        if (await isChromeUp()) { console.log('  Chrome back up!'); return true; }
    }
    console.log('  Chrome relaunch FAILED');
    return false;
}

async function connect() {
    try {
        const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
        const ctx = b.contexts()[0];
        let p = null;
        for (const pg of ctx.pages()) { try { if (pg.url().includes('messenger.com')) { p = pg; break; } } catch {} }
        if (!p) p = ctx.pages()[0];
        if (!p) { p = await ctx.newPage(); await p.goto('https://www.messenger.com').catch(() => {}); }
        return { browser: b, page: p };
    } catch { return null; }
}

(async () => {
    console.log('=== AUTO SEND V3 (AUTO-RELAUNCH) ===');
    
    const csvRows = await loadCSV();
    const history = loadHistory();
    const today = new Date().toISOString().substring(0, 10);
    const sentToday = csvRows.filter(r => (r.sent_at || '').startsWith(today) && r.message_sent === 'true').length;
    console.log(`Sent today: ${sentToday}/${DAILY_LIMIT}`);
    
    if (sentToday >= DAILY_LIMIT) { console.log('DAILY LIMIT REACHED!'); process.exit(0); }
    
    const remaining = DAILY_LIMIT - sentToday;
    const toSend = contacts.slice(0, Math.min(remaining, contacts.length));
    console.log(`Batch: ${toSend.length} contacts\n`);
    
    let { browser, page } = await connect() || {};
    if (!page) {
        console.log('Chrome not up, launching...');
        await relaunchChrome();
        const c = await connect();
        browser = c?.browser; page = c?.page;
    }
    if (!page) { console.log('FATAL: No Chrome'); process.exit(1); }
    
    let sent = 0, bad = 0, errors = 0;
    
    for (let i = 0; i < toSend.length; i++) {
        const c = toSend[i];
        const msg = messages[Math.floor(Math.random() * messages.length)](c.first || c.name.split(' ')[0]);
        const safe = c.name.replace(/\s+/g, '_').replace(/\./g, '_');
        const pid = c.url.split('/t/')[1];
        
        process.stdout.write(`[${i+1}/${toSend.length}] ${c.name}: `);
        
        try {
            // Check page alive
            let pageAlive = true;
            try { await page.url(); } catch { pageAlive = false; }
            
            if (!pageAlive) {
                console.log('page dead, relaunching...');
                try { await browser.close(); } catch {}
                if (!await isChromeUp()) {
                    await relaunchChrome(c.url);
                } else {
                    const conn = await connect();
                    if (conn) { browser = conn.browser; page = conn.page; }
                }
                if (!page) {
                    const conn = await connect();
                    if (conn) { browser = conn.browser; page = conn.page; }
                }
                if (!page) { console.log('Could not reconnect! Stopping.'); break; }
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
                console.log('BAD');
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
            
            console.log('SENT');
            sent++;
            
            for (const r of csvRows) { if ((r.fb_profile_id||'').replace(/^\//,'') === pid) { r.message_sent='true'; r.sent_at=new Date().toISOString(); r.last_error=''; } }
            saveCSV(csvRows);
            if (!history[pid]) history[pid] = [];
            history[pid].push({ contact_id: pid, contact_name: c.name, sent_at: new Date().toISOString(), event_url: EVENT_URL });
            saveHistory(history);
            
            if (sentToday + sent >= DAILY_LIMIT) { console.log(`\nDAILY LIMIT ${DAILY_LIMIT}! Stop.`); break; }
            
            if (i < toSend.length - 1) {
                const d = 3 + Math.floor(Math.random() * 9);
                process.stdout.write(`(${d}s) `);
                await new Promise(r => setTimeout(r, d * 1000));
            }
        } catch(e) {
            console.log('ERR: ' + e.message.substring(0, 40));
            errors++;
            // Reconnect for next contact
            try { await browser.close(); } catch {}
            await new Promise(r => setTimeout(r, 2000));
            if (!await isChromeUp()) { await relaunchChrome(); }
            const conn = await connect();
            if (conn) { browser = conn.browser; page = conn.page; }
        }
    }
    
    console.log(`\n=== DONE ===`);
    console.log(`Sent: ${sent} | Bad: ${bad} | Errors: ${errors}`);
    console.log(`Total today: ${sentToday + sent}/${DAILY_LIMIT}`);
    try { await browser.close(); } catch {}
})();