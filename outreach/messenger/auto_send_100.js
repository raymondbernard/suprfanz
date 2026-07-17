const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const EVENT_URL = 'https://www.facebook.com/events/971902445574502';
const EVENT_ID = '971902445574502';
const debugDir = path.join(__dirname, 'debug_screenshots');
const CSV_PATH = path.join(__dirname, 'fbfriends.csv');
const HISTORY_PATH = path.join(__dirname, 'message_history.json');

let contacts = [];
try {
    contacts = require('./contacts_100.js').contacts;
} catch(e) {
    console.error('Could not load contacts:', e.message);
    process.exit(1);
}

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
];

function loadCSV() {
    return new Promise((resolve) => {
        const rows = [];
        fs.createReadStream(CSV_PATH).pipe(csv()).on('data', (r) => rows.push(r)).on('end', () => resolve(rows));
    });
}

function saveCSV(rows) {
    if (rows.length === 0) return;
    const fields = Object.keys(rows[0]);
    const header = fields.join(',');
    const lines = rows.map(r => fields.map(f => {
        let v = r[f] || '';
        if (v.includes(',')) v = `"${v}"`;
        return v;
    }).join(','));
    fs.writeFileSync(CSV_PATH, header + '\n' + lines.join('\n'));
}

function loadHistory() {
    try { return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8')); } catch { return {}; }
}

function saveHistory(h) {
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(h, null, 2));
}

async function isChromeUp() {
    try {
        const resp = await fetch('http://127.0.0.1:9222/json/version');
        return resp.ok;
    } catch { return false; }
}

async function relaunchChrome(url) {
    console.log('  Relaunching Chrome...');
    const { exec } = require('child_process');
    const userData = 'C:\\Users\\RayBe\\AppData\\Local\\Google\\Chrome\\User Data';
    const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const args = [
        `--user-data-dir=${userData}`,
        '--profile-directory=Profile 3',
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        '--remote-debugging-port=9222',
        '--remote-allow-origins=*',
        '--no-first-run',
        '--no-default-browser-check',
        '--no-restore-last-session',
        url || 'https://www.messenger.com'
    ].join(' ');
    exec(`start "" "${chrome}" ${args}`);
    
    // Wait for port
    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        if (await isChromeUp()) {
            console.log('  Chrome is back up!');
            return true;
        }
    }
    console.log('  Chrome relaunch failed!');
    return false;
}

(async () => {
    console.log('=== AUTO SEND — 100 CONTACTS (FIXED) ===');
    console.log('Event:', EVENT_URL);
    console.log('Batch:', contacts.length, 'contacts');
    console.log('');
    
    const csvRows = await loadCSV();
    const history = loadHistory();
    console.log('CSV rows:', csvRows.length, '| History entries:', Object.keys(history).length);
    
    let browser = null;
    let page = null;
    let sent = 0, errors = 0, alreadySent = 0, bad = 0;
    
    async function connect() {
        try {
            browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
            const context = browser.contexts()[0];
            page = null;
            for (const p of context.pages()) {
                try {
                    if (p.url().includes('messenger.com')) { page = p; break; }
                } catch(e) {}
            }
            if (!page) page = context.pages()[0];
            if (!page) {
                page = await context.newPage();
                await page.goto('https://www.messenger.com').catch(() => {});
            }
            console.log('Connected. Page:', page.url());
            return true;
        } catch(e) {
            console.log('Connection failed:', e.message.substring(0, 50));
            return false;
        }
    }
    
    if (!await connect()) {
        console.log('Chrome not running. Relaunching...');
        await relaunchChrome('https://www.messenger.com');
        if (!await connect()) {
            console.log('FATAL: Could not connect to Chrome');
            process.exit(1);
        }
    }
    
    for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const msg = messages[i % messages.length](contact.first || contact.name.split(' ')[0]);
        const safeName = (contact.name || 'unknown').replace(/\s+/g, '_').replace(/\./g, '_').replace(/\//g, '_');
        const pid = contact.url.split('/t/')[1];
        
        console.log(`\n[${i+1}/${contacts.length}] ${contact.name} — ${contact.url}`);
        
        try {
            // Check if page is still alive
            let pageAlive = true;
            try {
                await page.url();
            } catch {
                pageAlive = false;
            }
            
            if (!pageAlive) {
                console.log('  Page closed! Reconnecting...');
                try { await browser.close(); } catch {}
                if (!await isChromeUp()) {
                    await relaunchChrome(contact.url);
                }
                if (!await connect()) {
                    console.log('  Could not reconnect! Stopping.');
                    break;
                }
            }
            
            // Navigate
            await page.goto(contact.url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
            await page.waitForTimeout(2000);
            
            // Screenshot before
            await page.screenshot({ path: path.join(debugDir, `send_before_${safeName}.png`), fullPage: false, timeout: 5000 }).catch(() => {});
            
            // Click Continue button
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const btns = await page.locator('div[role="button"], button').all();
                    for (const b of btns) {
                        const t = await b.textContent().catch(() => '');
                        if (await b.isVisible().catch(() => false) && t.toLowerCase().includes('continue')) {
                            console.log('  Clicking Continue...');
                            await b.click();
                            await page.waitForTimeout(3000);
                            break;
                        }
                    }
                } catch(e) {}
                await page.waitForTimeout(1500);
            }
            
            // Wait for textbox
            const tb = page.locator('div[role="textbox"]').first();
            await tb.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
            
            const tbCount = await page.locator('div[role="textbox"]').count();
            if (tbCount === 0) {
                console.log('  BAD: No textbox');
                bad++;
                for (const row of csvRows) {
                    if ((row.fb_profile_id || '').replace(/^\//, '') === pid) {
                        row.message_sent = 'bad';
                        row.last_error = 'BAD PROFILE: No textbox';
                    }
                }
                saveCSV(csvRows);
                continue;
            }
            
            // Check if already sent — ONLY check the conversation messages area, not the whole page
            // The event ID could appear in the URL bar or sidebar, so we check the message content specifically
            let pageText = '';
            try {
                // Get text from the conversation area only (not the whole page)
                const msgArea = page.locator('[role="main"], [data-testid="conversation], div.x1n2onr6').first();
                if (await msgArea.count() > 0) {
                    pageText = await msgArea.innerText().catch(() => '');
                }
                if (!pageText) {
                    pageText = await page.evaluate(() => {
                        // Get text from the main conversation area, not the sidebar
                        const main = document.querySelector('[role="main"]') || document.querySelector('div[data-testid="conversation"]');
                        return main ? main.innerText : '';
                    }).catch(() => '');
                }
            } catch {}
            
            if (pageText.includes(EVENT_ID)) {
                console.log('  ALREADY SENT');
                alreadySent++;
                for (const row of csvRows) {
                    if ((row.fb_profile_id || '').replace(/^\//, '') === pid) {
                        row.message_sent = 'true';
                        row.sent_at = new Date().toISOString();
                    }
                }
                saveCSV(csvRows);
                if (!history[pid]) history[pid] = [];
                history[pid].push({ contact_id: pid, contact_name: contact.name, sent_at: new Date().toISOString(), event_url: EVENT_URL });
                saveHistory(history);
                continue;
            }
            
            // Type and send
            console.log('  Typing + sending...');
            await tb.click();
            await page.waitForTimeout(500);
            await page.keyboard.type(msg, { delay: 3 });
            await page.waitForTimeout(300);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
            
            await page.screenshot({ path: path.join(debugDir, `send_after_${safeName}.png`), fullPage: false, timeout: 5000 }).catch(() => {});
            
            console.log('  SENT!');
            sent++;
            
            for (const row of csvRows) {
                if ((row.fb_profile_id || '').replace(/^\//, '') === pid) {
                    row.message_sent = 'true';
                    row.sent_at = new Date().toISOString();
                    row.last_error = '';
                }
            }
            saveCSV(csvRows);
            
            if (!history[pid]) history[pid] = [];
            history[pid].push({ contact_id: pid, contact_name: contact.name, sent_at: new Date().toISOString(), event_url: EVENT_URL });
            saveHistory(history);
            
            // Delay between sends
            if (i < contacts.length - 1) {
                const delay = 5 + Math.floor(Math.random() * 10);
                console.log(`  Waiting ${delay}s...`);
                await new Promise(r => setTimeout(r, delay * 1000));
            }
            
        } catch(e) {
            console.log('  ERROR:', e.message.substring(0, 60));
            errors++;
            // Don't mark as bad immediately — might be a temporary connection issue
            // Only mark as bad if it's a textbox/navigation error
            if (e.message.includes('Target page') || e.message.includes('Target context') || e.message.includes('Browser')) {
                console.log('  Connection lost, will retry on next contact...');
                // Try to reconnect
                try { await browser.close(); } catch {}
                await new Promise(r => setTimeout(r, 3000));
                if (await isChromeUp()) {
                    await connect();
                } else {
                    await relaunchChrome(contacts[Math.min(i+1, contacts.length-1)].url);
                    await connect();
                }
            } else {
                for (const row of csvRows) {
                    if ((row.fb_profile_id || '').replace(/^\//, '') === pid) {
                        row.message_sent = 'bad';
                        row.last_error = 'ERROR: ' + e.message.substring(0, 60);
                    }
                }
                saveCSV(csvRows);
            }
        }
    }
    
    console.log(`\n=== BATCH COMPLETE ===`);
    console.log(`Sent: ${sent} | Already sent: ${alreadySent} | Bad: ${bad} | Errors: ${errors}`);
    console.log(`Total processed: ${sent + alreadySent + bad + errors}/${contacts.length}`);
    console.log(`You can close Chrome now.`);
    
    try { await browser.close(); } catch {}
})();