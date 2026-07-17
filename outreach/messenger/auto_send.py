#!/usr/bin/env python3
"""Auto-send script - sends to NY contacts without interactive prompts."""
import subprocess, time, random, csv, json, os, urllib.request
from pathlib import Path
from datetime import datetime

CHROME_EXE = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE = "Profile 3"
DATA_DIR = Path(__file__).parent.resolve()
CSV_PATH = DATA_DIR / "fbfriends.csv"
HISTORY_PATH = DATA_DIR / "message_history.json"
EVENT_URL = "https://www.facebook.com/events/971902445574502"
EVENT_ID = "971902445574502"
BATCH_SIZE = 5
DELAY_MIN = 5
DELAY_MAX = 15

def is_chrome_up():
    try:
        urllib.request.urlopen("http://127.0.0.1:9222/json/version", timeout=3)
        return True
    except:
        return False

def load_ny_profiles():
    profiles = set()
    fcsv = DATA_DIR / "contacts" / "fb_friend.csv"
    if not fcsv.exists():
        return profiles
    ny_kw = ['new york', 'nyc', 'brooklyn', 'manhattan', 'queens', 'bronx', 'staten island', 'astoria', 'harlem', 'long island', 'hoboken', 'jersey city', 'yonkers', 'white plains', ', ny']
    with open(fcsv, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 5: continue
            loc = (row[3] if len(row) > 3 else '').lower()
            pid = (row[4] if len(row) > 4 else '').lstrip('/')
            if pid and any(k in loc for k in ny_kw):
                profiles.add(pid)
    return profiles

def load_history():
    if not HISTORY_PATH.exists():
        return {}
    with open(HISTORY_PATH, 'r') as f:
        return json.load(f)

def save_history(hist):
    with open(HISTORY_PATH, 'w') as f:
        json.dump(hist, f, indent=2)

def load_contacts(ny_profiles, history):
    contacts = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('message_sent') in ('true', 'bad'):
                continue
            pid = row.get('fb_profile_id', '').lstrip('/')
            if not pid: continue
            if pid in history and any(h.get('event_url') == EVENT_URL for h in history.get(pid, [])):
                continue
            if ny_profiles and pid not in ny_profiles:
                continue
            contacts.append({
                'name': row.get('fb_name', pid),
                'first_name': row.get('fb_first_name', ''),
                'profile_id': pid,
                'url': f"https://www.messenger.com/t/{pid}"
            })
    return contacts

def generate_message(contact):
    first = contact['first_name'] or contact['name'].split()[0]
    styles = [
        f"Hey {first}!\n\nPutting together a blues show and immediately thought of you. Come hang! Also, hitting \"Interested\" on the event page helps other blues fans discover it.\n\n{EVENT_URL}",
        f"Hi {first}!\n\nWe've got a blues night coming up that I thought you'd dig. Would love to see you there! If you can, click \"Interested\" on the event page-it really helps spread the word.\n\n{EVENT_URL}",
        f"Hey {first}!\n\nHope you're doing well! I'm organizing a blues show and wanted to invite you. Check it out, and if you're interested, click the \"Interested\" button on the event page - it helps with visibility!\n\n{EVENT_URL}",
        f"Hey {first}! Big news - we're putting together an amazing blues night! Think you'd really love the vibe. Come through! And if you click \"Interested\" on the event page, it helps other blues lovers find us.\n\n{EVENT_URL}",
        f"Hi {first}!\n\nDon't miss out on this blues night we've got coming up! Great music, good times. Would love to have you there. Click \"Interested\" on the event page to help spread the word to other blues fans!\n\n{EVENT_URL}",
        f"Hi {first}! Thinking of you and wanted to personally invite you to our upcoming blues show. It would mean a lot to have you there. If you can, click \"Interested\" on the event page - every bit helps!\n\n{EVENT_URL}",
    ]
    return random.choice(styles)

def update_csv(contact, success, error=''):
    rows = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fields = reader.fieldnames
        for row in reader:
            rp = row.get('fb_profile_id', '').lstrip('/')
            if rp == contact['profile_id'] and rp:
                if success:
                    row['message_sent'] = 'true'
                    row['sent_at'] = datetime.utcnow().isoformat()
                    row['last_error'] = ''
                else:
                    row['message_sent'] = 'bad'
                    row['last_error'] = f"BAD PROFILE: {error}"
            rows.append(row)
    with open(CSV_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

def send_to_contact(contact, message):
    safe_name = contact['name'].replace(' ', '_').replace('.', '_').replace('/', '_')
    escaped = message.replace('\\', '\\\\').replace('`', '\\`').replace('$', '\\$')
    
    script = f'''const {{ chromium }} = require('playwright');
(async () => {{
    try {{
        const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
        const context = browser.contexts()[0];
        let page = null;
        for (const p of context.pages()) {{
            try {{ if (p.url().includes('messenger.com')) {{ page = p; break; }} }} catch(e) {{}}
        }}
        if (!page) page = context.pages()[0];
        
        console.log('Navigating to: {contact["url"]}');
        await page.goto('{contact["url"]}', {{ waitUntil: 'domcontentloaded', timeout: 10000 }}).catch(() => {{}});
        await page.waitForTimeout(2000);
        
        // Screenshot before
        try {{ await page.screenshot({{ path: 'debug_screenshots/before_{safe_name}.png', fullPage: false }}); }} catch(e) {{}}
        
        // Click Continue button if present
        for (let i = 0; i < 5; i++) {{
            try {{
                const btns = await page.locator('div[role="button"], button').all();
                for (const b of btns) {{
                    const t = await b.textContent().catch(() => '');
                    if (await b.isVisible() && t.toLowerCase().includes('continue')) {{
                        console.log('Clicking Continue...');
                        await b.click();
                        await page.waitForTimeout(3000);
                        break;
                    }}
                }}
            }} catch(e) {{}}
            await page.waitForTimeout(2000);
        }}
        
        // Wait for textbox
        const tb = page.locator('div[role="textbox"]').first();
        await tb.waitFor({{ state: 'visible', timeout: 15000 }}).catch(() => {{
            console.error('ERROR: No textbox found');
            process.exit(1);
        }});
        
        // Check if already sent
        const pageText = await page.evaluate(() => document.body.innerText).catch(() => '');
        if (pageText.includes('{EVENT_ID}')) {{
            console.log('ALREADY_SENT');
            process.exit(2);
        }}
        
        // Type and send
        await tb.click();
        await page.waitForTimeout(500);
        await page.keyboard.type(`{escaped}`, {{ delay: 3 }});
        await page.waitForTimeout(300);
        await page.keyboard.press('Enter');
        
        console.log('SUCCESS');
        try {{ await page.screenshot({{ path: 'debug_screenshots/after_{safe_name}.png', fullPage: false }}); }} catch(e) {{}}
        
        await browser.close();
    }} catch (e) {{
        console.error('ERROR:', e.message);
        process.exit(1);
    }}
}})();'''

    temp = DATA_DIR / "temp_auto_send.js"
    temp.write_text(script, encoding='utf-8')
    
    try:
        result = subprocess.run(['node', str(temp)], capture_output=True, text=True,
                                encoding='utf-8', errors='replace', timeout=60, cwd=str(DATA_DIR))
        stdout = result.stdout or ''
        return result.returncode, stdout
    except subprocess.TimeoutExpired:
        return 1, 'Timeout'
    finally:
        if temp.exists():
            temp.unlink()

# Main
print("=== AUTO SEND SCRIPT ===")
print(f"Event: {EVENT_URL}")
print(f"Batch size: {BATCH_SIZE}")

# Check Chrome
if not is_chrome_up():
    print("Chrome debug port not responding! Run run_messenger_terminal.bat first.")
    sys.exit(1)
print("Chrome is up.")

# Load data
ny_profiles = load_ny_profiles()
print(f"NY profiles: {len(ny_profiles)}")
history = load_history()
contacts = load_contacts(ny_profiles, history)
print(f"Pending NY contacts: {len(contacts)}")

if not contacts:
    print("No contacts to send to!")
    sys.exit(0)

# Send batch
to_send = contacts[:BATCH_SIZE]
print(f"\nSending to {len(to_send)} contacts...\n")

sent = 0
errors = 0

for i, contact in enumerate(to_send, 1):
    print(f"[{i}/{len(to_send)}] {contact['name']} — {contact['url']}")
    
    if not is_chrome_up():
        print("   Chrome closed! Cannot continue.")
        break
    
    message = generate_message(contact)
    print(f"   Message: {message[:60]}...")
    
    code, stdout = send_to_contact(contact, message)
    
    if code == 0 or 'SUCCESS' in stdout:
        print("   SENT!")
        # Update history
        if contact['profile_id'] not in history:
            history[contact['profile_id']] = []
        history[contact['profile_id']].append({
            'contact_id': contact['profile_id'],
            'contact_name': contact['name'],
            'sent_at': datetime.utcnow().isoformat(),
            'message_hash': hash(message) & 0xFFFFFFFF,
            'event_url': EVENT_URL
        })
        save_history(history)
        update_csv(contact, success=True)
        sent += 1
    elif code == 2 or 'ALREADY_SENT' in stdout:
        print("   Already sent! Skipping.")
        update_csv(contact, success=True)
        sent += 1
    else:
        err = stdout[:60]
        print(f"   FAILED: {err}")
        update_csv(contact, success=False, error=err)
        errors += 1
    
    # Delay
    if i < len(to_send):
        delay = random.randint(DELAY_MIN, DELAY_MAX)
        print(f"   Waiting {delay}s...")
        time.sleep(delay)

print(f"\n=== BATCH COMPLETE ===")
print(f"Sent: {sent} | Errors: {errors}")
print(f"You can close Chrome now.")