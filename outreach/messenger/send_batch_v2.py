#!/usr/bin/env python3
"""
Non-interactive batch sender — bypasses the terminal menu.
Reads the same CSV, generates varied messages, sends via Playwright.
"""

import csv
import json
import os
import subprocess
import sys
import time
import random
import urllib.request
from pathlib import Path
from datetime import datetime

DATA_DIR = Path(__file__).parent.resolve()
CSV_PATH = DATA_DIR / "fbfriends.csv"
HISTORY_PATH = DATA_DIR / "message_history.json"
CHROME_EXE = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE = "Profile 3"
EVENT_URL = "https://www.facebook.com/events/971902445574502"

def is_chrome_connected():
    try:
        urllib.request.urlopen("http://127.0.0.1:9222/json/version", timeout=3)
        return True
    except:
        return False

def load_contacts(limit=0):
    contacts = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('message_sent') in ('true', 'bad'):
                continue
            profile_id = row.get('fb_profile_id', '').lstrip('/')
            if not profile_id:
                continue
            contacts.append({
                'name': row.get('fb_name', ''),
                'first_name': row.get('fb_first_name', '') or row.get('fb_name', '').split()[0] if row.get('fb_name','') else '',
                'profile_id': profile_id,
                'messenger_url': f"https://www.messenger.com/t/{profile_id}",
            })
            if limit > 0 and len(contacts) >= limit:
                break
    return contacts

def generate_message(contact):
    first_name = contact['first_name'] or contact['name'].split()[0] if contact['name'] else 'friend'
    url = EVENT_URL
    
    styles = [
        f"Hey {first_name}!\n\nPutting together a blues show and immediately thought of you. Come hang! Also, hitting \"Interested\" on the event page helps other blues fans discover it.\n\n{url}",
        f"Hi {first_name}!\n\nWe've got a blues night coming up that I thought you'd dig. Would love to see you there! If you can, click \"Interested\" on the event page.\n\n{url}",
        f"Hey {first_name} - been a minute! Got a blues show coming up and you crossed my mind. Would be great to catch up and hear some live music. Tap \"Interested\" on the event page if you can make it.\n\n{url}",
        f"Hey {first_name}!\n\nHope you're doing well! I'm organizing a blues show and wanted to invite you. Check it out - clicking \"Interested\" on the event page helps with visibility!\n\n{url}",
        f"Yo {first_name}! Blues show coming up, thought you might wanna swing by. No pressure but clicking \"Interested\" on the event page really helps us out.\n\n{url}",
        f"Hey {first_name}! Big news - we're putting together an amazing blues night! Think you'd really love the vibe. Come through! Click \"Interested\" on the event page to help other blues lovers find us.\n\n{url}",
        f"{first_name}!! We're back with another blues night and it's gonna be a good one. Come vibe with us - and smash that \"Interested\" button on the event page to help us pack the room.\n\n{url}",
        f"Hi {first_name}!\n\nDon't miss out on this blues night we've got coming up! Great music, good times. Click \"Interested\" on the event page to help spread the word!\n\n{url}",
        f"Hey {first_name}, the last blues night was packed and this one's shaping up to be even bigger. Don't sleep on it! Hit \"Interested\" on the event page to lock it in.\n\n{url}",
        f"Hi {first_name}! Thinking of you and wanted to personally invite you to our upcoming blues show. It would mean a lot to have you there. Click \"Interested\" on the event page - every bit helps!\n\n{url}",
        f"Hey {first_name}, hope life's treating you well. Wanted to send a personal invite to our next blues show - always love having you in the room. \"Interested\" on the event page helps us reach more folks.\n\n{url}",
        f"Hey {first_name}!\n\nAs a fellow music lover, I wanted to reach out about our blues show. Your support would mean the world to us! Click \"Interested\" on the event page to help us reach more blues fans.\n\n{url}",
        f"Hi {first_name} - you've always supported live music and that means everything. Got another blues show coming up. Clicking \"Interested\" on the event page goes a long way for us.\n\n{url}",
        f"Hi {first_name}!\n\nWe're building something special with this blues show and would love for you to be part of it. Come join the community! Help us spread the word by clicking \"Interested\" on the event page.\n\n{url}",
        f"Hey {first_name}! The blues community's growing and you're a big part of it. Next show's coming up. Tap \"Interested\" on the event page to help us keep building.\n\n{url}",
        f"Hey {first_name},\n\nBlues show coming up - you're invited! Click \"Interested\" on the event page to help with visibility.\n\n{url}",
        f"{first_name} - blues night, coming up soon. You in? Link below. \"Interested\" on the event page helps a ton.\n\n{url}",
        f"Hey {first_name}!\n\nEver been to a live blues show that just hit different? We're creating one of those nights. Click \"Interested\" on the event page and help other blues fans discover it too!\n\n{url}",
        f"Hi {first_name}! What's your go-to blues track? We're putting together a night of classics and deep cuts. Come check it out - \"Interested\" on the event page helps other blues lovers find us.\n\n{url}",
        f"Hi {first_name}!\n\nQuick favor - would you mind checking out our upcoming blues event? I'd love your support! Clicking \"Interested\" on the event page really helps with visibility.\n\n{url}",
        f"Hey {first_name}, small ask - could you tap \"Interested\" on our blues event page? It costs nothing but really boosts our reach. And of course, would love to see you there!\n\n{url}",
        f"Hey {first_name}! Remember the last time we caught live music? Those were the nights. Got another blues show coming up - let's do it again. Tap \"Interested\" on the event page.\n\n{url}",
        f"Hi {first_name} - thinking back to some great nights of live music. Got another one coming up and you should be there. \"Interested\" on the event page helps us fill the room.\n\n{url}",
        f"Hey {first_name}! As someone who knows good music when they hear it - our blues show is gonna deliver. Come through and bring your ears. \"Interested\" on the event page helps other music folks find us.\n\n{url}",
        f"Hi {first_name}, you know the blues better than most. We're putting on a night of the real stuff - Chicago blues, Delta blues, the classics. Tap \"Interested\" on the event page to help us reach the right audience.\n\n{url}",
        f"Hey {first_name}! It's been too long. What better way to reconnect than over some live blues? Got a show coming up - come hang. \"Interested\" on the event page helps us with visibility.\n\n{url}",
        f"Hi {first_name} - been way too long since I've seen you! I've got a blues night coming up and it'd be the perfect excuse to catch up. Click \"Interested\" on the event page and let's make it happen.\n\n{url}",
        f"Hey {first_name}! Consider this your personal invite to our next blues night. Good music, good people, good vibes. Tap \"Interested\" on the event page to help us spread the word.\n\n{url}",
        f"Hi {first_name}! You're officially invited to our upcoming blues show. No plus-one needed - just bring yourself and your love for live music. \"Interested\" on the event page goes a long way!\n\n{url}",
        f"Hey {first_name}! If you love the blues - and I know you do - this night is for you. Muddy Waters, B.B. King, Howlin' Wolf, the real deal. Come through! \"Interested\" on the event page helps other blues heads find us.\n\n{url}",
        f"Hi {first_name}! We're doing a night of blues classics - the stuff that made the genre. If that's your jam, you need to be there. Tap \"Interested\" on the event page to help us reach more blues lovers.\n\n{url}",
    ]
    return random.choice(styles)

def create_playwright_script(message, messenger_url, contact_name):
    escaped = message.replace('\\', '\\\\').replace('`', '\\`').replace('$', '\\$')
    safe_name = contact_name.replace(' ', '_').replace('.', '_').replace('/', '_')
    
    return f'''const {{ chromium }} = require('playwright');
(async () => {{
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    let page = null;
    for (const p of context.pages()) {{
        try {{ if (p.url().includes('messenger.com')) {{ page = p; break; }} }} catch(e) {{}}
    }}
    if (!page) page = context.pages()[0];
    
    console.log('Navigating to: {messenger_url}');
    await page.goto('{messenger_url}', {{ waitUntil: 'domcontentloaded', timeout: 10000 }}).catch(e => console.log('Nav slow'));
    await page.waitForTimeout(2000);
    
    // Check for Continue button
    const btns = await page.locator('div[role="button"], button').all();
    for (const btn of btns) {{
        try {{
            const text = await btn.textContent();
            const vis = await btn.isVisible();
            if (vis && text.toLowerCase().includes('continue')) {{
                await btn.click();
                await page.waitForTimeout(3000);
                break;
            }}
        }} catch(e) {{}}
    }}
    
    // Wait for textbox
    try {{
        await page.waitForSelector('div[role="textbox"]', {{ state: 'visible', timeout: 15000 }});
    }} catch(e) {{
        console.log('ERROR: No textbox');
        process.exit(1);
    }}
    
    // Check if already sent
    const pageText = await page.evaluate(() => document.body.innerText).catch(() => '');
    if (pageText.includes('971902445574502')) {{
        console.log('ALREADY_SENT');
        process.exit(2);
    }}
    
    // Type and send
    const textbox = page.locator('div[role="textbox"]').first();
    await textbox.click();
    await page.waitForTimeout(500);
    await page.keyboard.type(`{escaped}`, {{ delay: 3 }});
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    console.log('SUCCESS');
    
    try {{ await page.screenshot({{ path: 'after_{safe_name}.png' }}); }} catch(e) {{}}
    await browser.close();
}})();
'''

def update_csv(contact, success, error=None):
    rows = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            rp = row.get('fb_profile_id', '').lstrip('/')
            cp = contact['profile_id'].lstrip('/')
            if rp == cp and rp:
                if success:
                    row['message_sent'] = 'true'
                    row['sent_at'] = datetime.utcnow().isoformat()
                    row['last_error'] = ''
                elif error == 'bad':
                    row['message_sent'] = 'bad'
                    row['last_error'] = 'BAD PROFILE'
                else:
                    row['message_sent'] = 'false'
                    row['last_error'] = error or ''
            rows.append(row)
    with open(CSV_PATH, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

def main():
    batch_size = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    
    print('=' * 60)
    print('MESSENGER BATCH SENDER - varied messages')
    print('=' * 60)
    
    contacts = load_contacts(limit=0)
    print(f'Pending: {len(contacts)}')
    print(f'Batch size: {batch_size}')
    print()
    
    if not contacts:
        print('No pending contacts!')
        return
    
    if not is_chrome_connected():
        print('Chrome debug port not responding!')
        print('Run run_messenger_terminal.bat first')
        return
    
    sent = 0
    errors = 0
    
    for i, contact in enumerate(contacts[:batch_size]):
        msg = generate_message(contact)
        print(f'[{i+1}/{batch_size}] {contact["name"]}')
        print(f'  URL: {contact["messenger_url"]}')
        print(f'  Message: {msg[:80]}...')
        
        script = create_playwright_script(msg, contact['messenger_url'], contact['name'])
        temp = DATA_DIR / 'temp_send.js'
        temp.write_text(script, encoding='utf-8')
        
        try:
            result = subprocess.run(
                ['node', str(temp)],
                capture_output=True, text=True,
                encoding='utf-8', errors='replace',
                timeout=30, cwd=str(DATA_DIR)
            )
            output = result.stdout + result.stderr
            print(f'  Output: {output[:100]}')
            
            if 'SUCCESS' in output or result.returncode == 0:
                print('  SENT!')
                update_csv(contact, success=True)
                sent += 1
            elif 'ALREADY_SENT' in output or result.returncode == 2:
                print('  Already sent — marking as sent')
                update_csv(contact, success=True)
                sent += 1
            elif 'No textbox' in output or 'not found' in output.lower():
                print('  BAD PROFILE')
                update_csv(contact, success=False, error='bad')
                errors += 1
            else:
                print(f'  ERROR: {output[:80]}')
                update_csv(contact, success=False, error=output[:80])
                errors += 1
        except subprocess.TimeoutExpired:
            print('  TIMEOUT')
            update_csv(contact, success=False, error='bad')
            errors += 1
        except Exception as e:
            print(f'  EXCEPTION: {e}')
            update_csv(contact, success=False, error=str(e)[:80])
            errors += 1
        finally:
            if temp.exists():
                temp.unlink()
        
        if i < batch_size - 1:
            delay = random.randint(5, 15)
            print(f'  Waiting {delay}s...')
            time.sleep(delay)
        
        print()
    
    print('=' * 60)
    print(f'BATCH COMPLETE: {sent} sent, {errors} errors')
    print('=' * 60)

if __name__ == '__main__':
    main()