#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Smart batch sender — sends one at a time, takes screenshots, reports results.
Usage: python smart_send.py [batch_size]
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
from datetime import datetime, timezone

DATA_DIR = Path(__file__).parent.resolve()
CSV_PATH = DATA_DIR / "fbfriends.csv"
SHOT_DIR = DATA_DIR
EVENT_URL = "https://www.facebook.com/events/971902445574502"

MESSAGES = [
    "Hey {n}!\n\nPutting together a blues show and immediately thought of you. Come hang! Also, hitting \"Interested\" on the event page helps other blues fans discover it.\n\n{u}",
    "Hi {n}!\n\nWe've got a blues night coming up that I thought you'd dig. Would love to see you there! If you can, click \"Interested\" on the event page.\n\n{u}",
    "Hey {n} - been a minute! Got a blues show coming up and you crossed my mind. Would be great to catch up and hear some live music. Tap \"Interested\" on the event page if you can make it.\n\n{u}",
    "Hey {n}!\n\nHope you're doing well! I'm organizing a blues show and wanted to invite you. Clicking \"Interested\" on the event page helps with visibility!\n\n{u}",
    "Yo {n}! Blues show coming up, thought you might wanna swing by. No pressure but clicking \"Interested\" on the event page really helps us out.\n\n{u}",
    "Hey {n}! Big news - we're putting together an amazing blues night! Think you'd really love the vibe. Come through! Click \"Interested\" on the event page.\n\n{u}",
    "{n}!! We're back with another blues night and it's gonna be a good one. Come vibe with us - smash that \"Interested\" button on the event page.\n\n{u}",
    "Hi {n}!\n\nDon't miss out on this blues night! Great music, good times. Click \"Interested\" on the event page to help spread the word!\n\n{u}",
    "Hey {n}, the last blues night was packed and this one's shaping up to be even bigger. Don't sleep on it! Hit \"Interested\" on the event page.\n\n{u}",
    "Hi {n}! Thinking of you and wanted to personally invite you to our upcoming blues show. Click \"Interested\" on the event page - every bit helps!\n\n{u}",
    "Hey {n}, hope life's treating you well. Personal invite to our next blues show - always love having you in the room. \"Interested\" on the event page helps reach more folks.\n\n{u}",
    "Hey {n}!\n\nAs a fellow music lover, your support would mean the world! Click \"Interested\" on the event page to help us reach more blues fans.\n\n{u}",
    "Hi {n} - you've always supported live music and that means everything. Got another blues show coming up. Clicking \"Interested\" goes a long way.\n\n{u}",
    "Hi {n}!\n\nWe're building something special with this blues show. Come join the community! Click \"Interested\" on the event page.\n\n{u}",
    "Hey {n}! The blues community's growing and you're a big part of it. Tap \"Interested\" on the event page to help us keep building.\n\n{u}",
    "Hey {n},\n\nBlues show coming up - you're invited! Click \"Interested\" on the event page to help with visibility.\n\n{u}",
    "{n} - blues night, coming up soon. You in? \"Interested\" on the event page helps a ton.\n\n{u}",
    "Hey {n}!\n\nEver been to a live blues show that just hit different? We're creating one of those nights. Click \"Interested\" on the event page!\n\n{u}",
    "Hi {n}! What's your go-to blues track? We're putting together a night of classics and deep cuts. \"Interested\" on the event page helps other blues lovers find us.\n\n{u}",
    "Hi {n}!\n\nQuick favor - would you mind checking out our upcoming blues event? Clicking \"Interested\" really helps with visibility.\n\n{u}",
    "Hey {n}, small ask - could you tap \"Interested\" on our blues event page? It costs nothing but really boosts our reach. Would love to see you there!\n\n{u}",
    "Hey {n}! Remember the last time we caught live music? Those were the nights. Got another blues show coming up - let's do it again. Tap \"Interested\".\n\n{u}",
    "Hi {n} - thinking back to some great nights of live music. Got another one coming up and you should be there. \"Interested\" on the event page helps fill the room.\n\n{u}",
    "Hey {n}! As someone who knows good music - our blues show is gonna deliver. Come through! \"Interested\" on the event page helps other music folks find us.\n\n{u}",
    "Hi {n}, you know the blues better than most. We're putting on a night of the real stuff - Chicago blues, Delta blues, the classics. Tap \"Interested\".\n\n{u}",
    "Hey {n}! It's been too long. What better way to reconnect than over some live blues? Got a show coming up - come hang. \"Interested\" helps with visibility.\n\n{u}",
    "Hi {n} - been way too long! I've got a blues night coming up and it'd be the perfect excuse to catch up. Click \"Interested\" and let's make it happen.\n\n{u}",
    "Hey {n}! Consider this your personal invite to our next blues night. Good music, good people, good vibes. Tap \"Interested\" on the event page.\n\n{u}",
    "Hi {n}! You're officially invited to our upcoming blues show. \"Interested\" on the event page goes a long way!\n\n{u}",
    "Hey {n}! If you love the blues - and I know you do - this night is for you. Muddy Waters, B.B. King, Howlin' Wolf, the real deal. Come through!\n\n{u}",
    "Hi {n}! We're doing a night of blues classics - the stuff that made the genre. If that's your jam, you need to be there. Tap \"Interested\".\n\n{u}",
]

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
            pid = row.get('fb_profile_id', '').lstrip('/')
            if not pid:
                continue
            name = row.get('fb_name', '')
            first = row.get('fb_first_name', '') or (name.split()[0] if name else 'friend')
            contacts.append({
                'name': name,
                'first': first,
                'pid': pid,
                'url': f"https://www.messenger.com/t/{pid}",
            })
            if limit > 0 and len(contacts) >= limit:
                break
    return contacts

def gen_message(contact):
    template = random.choice(MESSAGES)
    return template.format(n=contact['first'], u=EVENT_URL)

def update_csv(pid, success, error=None):
    rows = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fnames = [fn for fn in reader.fieldnames if fn and fn.strip()]
        for row in reader:
            # Clean row — only keep keys that are in fnames
            clean = {}
            for fn in fnames:
                clean[fn] = row.get(fn, '')
            rp = clean.get('fb_profile_id', '').lstrip('/')
            if rp == pid.lstrip('/') and rp:
                if success:
                    clean['message_sent'] = 'true'
                    clean['sent_at'] = datetime.now(timezone.utc).isoformat()
                    clean['last_error'] = ''
                elif error == 'bad':
                    clean['message_sent'] = 'bad'
                    clean['last_error'] = 'BAD PROFILE'
                else:
                    clean['message_sent'] = 'false'
                    clean['last_error'] = (error or '')[:100]
            rows.append(clean)
    with open(CSV_PATH, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fnames, extrasaction='ignore')
        w.writeheader()
        w.writerows(rows)

def send_one(contact):
    """Send to one contact. Returns (success, screenshots)."""
    msg = gen_message(contact)
    safe = contact['name'].replace(' ', '_').replace('.', '_').replace('/', '_')
    
    # Write message to temp file
    msg_file = DATA_DIR / '_msg.txt'
    msg_file.write_text(msg, encoding='utf-8')
    
    # Run the Playwright script
    result = subprocess.run(
        ['node', 'send_one.js', contact['url'], str(msg_file), contact['name']],
        capture_output=True, text=True,
        encoding='utf-8', errors='replace',
        timeout=25,
        cwd=str(DATA_DIR)
    )
    
    output = result.stdout + result.stderr
    
    # Parse screenshots from output
    screenshots = []
    for line in output.split('\n'):
        if 'SCREENSHOT:' in line:
            screenshots.append(line.replace('SCREENSHOT:', '').strip())
    
    # Print output
    for line in output.strip().split('\n'):
        if line.strip():
            print('  ' + line.strip())
    
    # Clean up
    msg_file.unlink(missing_ok=True)
    
    # Determine result — only SENT and ALREADY_SENT mark as sent
    if 'RESULT: SENT' in output:
        return 'sent', screenshots
    elif 'ALREADY_SENT' in output:
        return 'already', screenshots
    elif 'RESULT: FAILED' in output:
        return 'failed', screenshots  # Don't mark as sent!
    elif 'RESULT: UNCONFIRMED' in output:
        return 'unconfirmed', screenshots  # Don't mark as sent!
    elif 'ABORT_NAME_MISMATCH' in output or 'NAME_MISMATCH' in output:
        return 'abort_name_mismatch', screenshots  # CRITICAL: name didn't match!
    elif 'ABORT_FINAL_CHECK' in output:
        return 'abort_final_check', screenshots  # CRITICAL: name disappeared!
    elif 'NO_TEXTBOX' in output:
        return 'bad', screenshots  # Bad profile
    else:
        return 'error', screenshots

def main():
    batch = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    
    print('=' * 60)
    print('SMART MESSENGER SENDER')
    print('=' * 60)
    
    if not is_chrome_connected():
        print('Chrome not responding! Run launcher first.')
        return
    
    contacts = load_contacts(limit=batch + 50)  # Load a few extra in case of bad profiles
    print(f'Pending: {len(contacts)} | Batch: {batch}')
    print()
    
    sent = 0
    errors = 0
    already = 0
    
    for i, c in enumerate(contacts[:batch]):
        # Check Chrome health before each contact
        if not is_chrome_connected():
            print('  Chrome died — relaunching...')
            import subprocess as sp, time as _time
            ud = os.path.join(os.environ.get('LOCALAPPDATA',''), 'Google', 'Chrome', 'User Data')
            p3 = os.path.join(ud, 'Profile 3')
            for fn in ['LOCK','DevToolsActivePort','Current Session','Current Tabs']:
                try: os.remove(os.path.join(p3, fn))
                except: pass
            for fn in ['SingletonLock','SingletonCookie','SingletonSocket']:
                try: os.remove(os.path.join(ud, fn))
                except: pass
            chrome_exe = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
            args_str = f'--user-data-dir="{ud}" --profile-directory=Profile 3 --start-maximized --disable-blink-features=AutomationControlled --remote-debugging-port=9222 --remote-allow-origins=* --no-first-run --no-default-browser-check --no-restore-last-session https://www.messenger.com'
            sp.Popen(['powershell', '-Command', f"Start-Process -FilePath '{chrome_exe}' -ArgumentList '{args_str}'"], stdout=sp.DEVNULL, stderr=sp.DEVNULL)
            _time.sleep(12)
            if not is_chrome_connected():
                print('  Chrome relaunch FAILED — aborting batch')
                break
        
        safe_name = c["name"].encode("ascii", "replace").decode()
        print(f'[{i+1}/{batch}] {safe_name}')
        print(f'  URL: {c["url"]}')
        
        try:
            result, shots = send_one(c)
            
            if result == 'sent':
                sent += 1
                update_csv(c['pid'], True)
                print(f'  -> SENT! Screenshots: {", ".join(shots)}')
            elif result == 'already':
                already += 1
                update_csv(c['pid'], True)
                print(f'  -> ALREADY SENT (marked in CSV)')
            elif result == 'failed':
                errors += 1
                update_csv(c['pid'], False, 'couldnt_send')
                print(f'  -> FAILED (couldn\'t send - NOT marked as sent)')
            elif result == 'unconfirmed':
                errors += 1
                update_csv(c['pid'], False, 'unconfirmed')
                print(f'  -> UNCONFIRMED (not marked as sent)')
            elif result == 'abort_name_mismatch':
                # CRITICAL: Name mismatch detected - DO NOT mark as sent, STOP batch
                update_csv(c['pid'], False, 'name_mismatch_aborted')
                print(f'  -> ABORTED: NAME MISMATCH! Stopping batch for safety.')
                print('  CRITICAL: Check screenshots - name in message did not match contact!')
                return  # Stop entire batch immediately
            elif result == 'abort_final_check':
                # CRITICAL: Name disappeared before send - STOP batch
                update_csv(c['pid'], False, 'final_check_aborted')
                print(f'  -> ABORTED: Name disappeared before send! Stopping batch.')
                return  # Stop entire batch immediately
            elif result == 'bad':
                errors += 1
                update_csv(c['pid'], False, 'bad')
                print(f'  -> FAILED. Bad profile. Screenshots: {", ".join(shots)}')
            else:
                errors += 1
                update_csv(c['pid'], False, 'unknown_error')
                print(f'  -> ERROR. Screenshots: {", ".join(shots)}')
        except subprocess.TimeoutExpired:
            errors += 1
            update_csv(c['pid'], False, 'bad')
            print(f'  -> TIMEOUT (marked bad)')
        except Exception as e:
            errors += 1
            update_csv(c['pid'], False, str(e)[:80])
            print(f'  -> ERROR: {e}')
        
        print()
        
        if i < batch - 1:
            delay = random.randint(3, 8)
            print(f'  Waiting {delay}s...')
            time.sleep(delay)
            print()
    
    print('=' * 60)
    print(f'DONE: {sent} sent, {already} already sent, {errors} errors')
    print('=' * 60)

if __name__ == '__main__':
    main()