#!/usr/bin/env python3
"""
Housing Connect Apply — Automates NYC Housing Connect lottery applications.
Reads applicant profile from JSON, logs in, fills forms via Playwright, tracks in CSV.

Usage: python housing-connect-apply.py [--dry-run] [--lottery ID]
"""

import csv
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from datetime import datetime

HOUSING_DIR = Path(__file__).parent.parent
PROFILE_PATH = HOUSING_DIR / 'applicant-profile.json'
TRACKER_PATH = HOUSING_DIR / 'applications' / 'application-tracker.csv'
SCREENSHOT_DIR = HOUSING_DIR / 'applications' / 'screenshots'
CONFIG_PATH = HOUSING_DIR / 'housing-connect-config.json'
MESSENGER_DIR = Path.home() / '.openclaw' / 'workspace' / 'outreach' / 'messenger'

CHROME_EXE = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PROFILE = 'Profile 3'
DEBUG_PORT = 9222
FIELD_DELAY = 25
PAGE_WAIT = 15
AUTO_SUBMIT = False

def load_config():
    global PROFILE, DEBUG_PORT, FIELD_DELAY, PAGE_WAIT, AUTO_SUBMIT
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            cfg = json.load(f)
            PROFILE = cfg.get('chrome_profile', PROFILE)
            DEBUG_PORT = cfg.get('debug_port', DEBUG_PORT)
            FIELD_DELAY = cfg.get('field_type_delay', FIELD_DELAY)
            PAGE_WAIT = cfg.get('page_load_wait', PAGE_WAIT)
            AUTO_SUBMIT = cfg.get('auto_submit', False)

def is_chrome_connected():
    try:
        urllib.request.urlopen(f'http://127.0.0.1:{DEBUG_PORT}/json/version', timeout=3)
        return True
    except:
        return False

def launch_chrome(url='https://housingconnect.nyc.gov/PublicWeb/'):
    user_data = str(Path.home() / 'AppData' / 'Local' / 'Google' / 'Chrome' / 'User Data')
    args_str = (
        f'--user-data-dir={user_data} '
        f'--profile-directory={PROFILE} '
        f'--start-maximized '
        f'--disable-blink-features=AutomationControlled '
        f'--remote-debugging-port={DEBUG_PORT} '
        f'--remote-allow-origins=* '
        f'--no-first-run --no-default-browser-check '
        f'--no-restore-last-session {url}'
    )
    subprocess.Popen(
        ['powershell', '-Command',
         f"Start-Process -FilePath '{CHROME_EXE}' -ArgumentList '{args_str}'"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    for i in range(20):
        time.sleep(2)
        if is_chrome_connected():
            print(f'Chrome ready ({(i+1)*2}s)')
            return True
    print('Chrome failed to start')
    return False

def ensure_chrome(url='https://housingconnect.nyc.gov/PublicWeb/'):
    if is_chrome_connected():
        return True
    print('Chrome closed, relaunching...')
    return launch_chrome(url)

def load_profile():
    if not PROFILE_PATH.exists():
        print(f'ERROR: {PROFILE_PATH} not found. Create it first.')
        sys.exit(1)
    with open(PROFILE_PATH) as f:
        return json.load(f)

def load_tracker():
    if not TRACKER_PATH.exists():
        print(f'ERROR: {TRACKER_PATH} not found')
        return [], None
    with open(TRACKER_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames
    return rows, fieldnames

def save_tracker(rows, fieldnames):
    TRACKER_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(TRACKER_PATH, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)

def update_row(row, **kwargs):
    for k, v in kwargs.items():
        if k in row:
            row[k] = v

def generate_login_script(profile):
    """Generate Playwright script to log in to Housing Connect."""
    account = profile.get('account', {})
    username = account.get('email', '')
    password = account.get('password', '')

    return f'''const {{ chromium }} = require('playwright');

(async () => {{
    const browser = await chromium.connectOverCDP('http://127.0.0.1:{DEBUG_PORT}');
    const context = browser.contexts()[0];
    let page = null;
    for (const p of context.pages()) {{
        try {{
            if (p.url().includes('housingconnect') || p.url().includes('a806')) {{ page = p; break; }}
        }} catch(e) {{}}
    }}
    if (!page) page = context.pages()[0];

    const shotDir = 'C:/Users/RayBe/.openclaw/workspace/housing/applications/screenshots/';

    try {{
        console.log('Navigating to Housing Connect...');
        await page.goto('https://housingconnect.nyc.gov/PublicWeb/', {{ waitUntil: 'domcontentloaded', timeout: {PAGE_WAIT * 1000} }});
        await page.waitForTimeout(3000);

        console.log('Clicking Log In...');
        await page.locator('a:has-text("Log In")').first().click();
        await page.waitForTimeout(5000);
        console.log('On auth server: ' + page.url());

        const usernameField = page.locator('#Username');
        const loginFormVisible = await usernameField.isVisible({ timeout: 5000 }).catch(() => false);

        if (loginFormVisible) {{
            console.log('Login form detected');

            const captchaFlag = await page.locator('#IsCaptchaEnabled').inputValue().catch(() => 'false');
            if (captchaFlag === 'True' || captchaFlag === 'true') {{
                console.log('CAPTCHA ENABLED');
                console.log('RESULT: CAPTCHA_NEEDED');
                browser.close();
                return;
            }}

            await usernameField.fill({json.dumps(username)});
            await page.waitForTimeout(500);
            await page.locator('#Password').fill({json.dumps(password)});
            await page.waitForTimeout(500);
            await page.locator('button:has-text("Login")').click();

            try {{
                await page.waitForURL(/.*housingconnect\\.nyc\\.gov.*/, {{ timeout: 30000 }});
                console.log('Login successful! URL: ' + page.url());
                console.log('RESULT: LOGIN_OK');
            }} catch(e) {{
                console.log('Login redirect timeout');
                await page.screenshot({{ path: shotDir + 'login_error.png' }}).catch(() => {{}});
                console.log('RESULT: LOGIN_FAILED');
            }}
        }} else {{
            console.log('No login form - checking if logged in...');
            await page.goto('https://housingconnect.nyc.gov/PublicWeb/dashboard', {{ waitUntil: 'domcontentloaded', timeout: {PAGE_WAIT * 1000} }});
            await page.waitForTimeout(3000);
            if (!page.url().includes('unauthorized')) {{
                console.log('Already logged in!');
                console.log('RESULT: LOGIN_OK');
            }} else {{
                console.log('Not logged in');
                console.log('RESULT: LOGIN_FAILED');
            }}
        }}
    }} catch(e) {{
        console.error('ERROR: ' + e.message);
        console.log('RESULT: ERROR');
    }}
    browser.close();
}})();
'''

def generate_apply_script(profile, lottery_id, lottery_name):
    """Generate Playwright script to apply to one lottery."""
    primary = profile['primary_applicant']

    return f'''const {{ chromium }} = require('playwright');

(async () => {{
    const browser = await chromium.connectOverCDP('http://127.0.0.1:{DEBUG_PORT}');
    const context = browser.contexts()[0];
    let page = null;
    for (const p of context.pages()) {{
        try {{
            if (p.url().includes('housingconnect')) {{ page = p; break; }}
        }} catch(e) {{}}
    }}
    if (!page) page = context.pages()[0];

    const shotDir = 'C:/Users/RayBe/.openclaw/workspace/housing/applications/screenshots/';
    const DELAY = {FIELD_DELAY};
    const LOTTERY_ID = '{lottery_id}';

    async function typeSlow(locator, text) {{
        await locator.click();
        await locator.fill('');
        await page.keyboard.type(text, {{ delay: DELAY }});
        await page.waitForTimeout(300);
    }}

    async function safeClick(sel, timeout = 5000) {{
        try {{
            const loc = page.locator(sel).first();
            if (await loc.isVisible({{ timeout }})) {{
                await loc.click();
                return true;
            }}
        }} catch(e) {{}}
        return false;
    }}

    async function safeFill(sel, value, timeout = 5000) {{
        if (!value) return false;
        try {{
            const loc = page.locator(sel).first();
            if (await loc.isVisible({{ timeout }})) {{
                await typeSlow(loc, value);
                return true;
            }}
        }} catch(e) {{}}
        return false;
    }}

    try {{
        console.log('Navigating to lottery ' + LOTTERY_ID);
        await page.goto('https://housingconnect.nyc.gov/PublicWeb/details/' + LOTTERY_ID, {{ waitUntil: 'domcontentloaded', timeout: {PAGE_WAIT * 1000} }});
        await page.waitForTimeout(5000);
        console.log('Detail URL: ' + page.url());
        await page.screenshot({{ path: shotDir + 'lottery_' + LOTTERY_ID + '_detail.png' }}).catch(() => {{}});

        console.log('Looking for Apply Now link...');
        const applyLink = page.locator('a:has-text("Apply Now")').first();
        const applyVisible = await applyLink.isVisible({{ timeout: 5000 }}).catch(() => false);

        if (!applyVisible) {{
            console.log('Apply Now not found');
            console.log('RESULT: LOTTERY_CLOSED');
            browser.close();
            return;
        }}

        console.log('Clicking Apply Now...');
        await applyLink.click();
        await page.waitForTimeout(5000);
        console.log('After Apply URL: ' + page.url());
        await page.screenshot({{ path: shotDir + 'lottery_' + LOTTERY_ID + '_form.png' }}).catch(() => {{}});

        if (page.url().includes('login') || page.url().includes('auth') || page.url().includes('a806')) {{
            console.log('Redirected to login');
            console.log('RESULT: NEED_LOGIN');
            browser.close();
            return;
        }}

        // Dump form structure
        const inputs = await page.locator('input, select, textarea').all();
        console.log('Form inputs: ' + inputs.length);
        for (const inp of inputs.slice(0, 40)) {{
            try {{
                const tag = await inp.evaluate(el => el.tagName);
                const type = await inp.getAttribute('type') || '';
                const name = await inp.getAttribute('name') || '';
                const id = await inp.getAttribute('id') || '';
                const placeholder = await inp.getAttribute('placeholder') || '';
                const visible = await inp.isVisible().catch(() => false);
                if (visible) console.log('  INPUT ' + tag + ' type=' + type + ' name=' + name + ' id=' + id + ' placeholder=' + placeholder);
            }} catch(e) {{}}
        }}

        const labels = await page.locator('label').all();
        console.log('Labels: ' + labels.length);
        for (const l of labels.slice(0, 20)) {{
            try {{
                const text = (await l.textContent()).trim().substring(0, 60);
                if (text) console.log('  LABEL: ' + text);
            }} catch(e) {{}}
        }}

        const btns = await page.locator('button, a[role="button"]').all();
        console.log('Buttons: ' + btns.length);
        for (const b of btns.slice(0, 15)) {{
            try {{
                const text = (await b.textContent()).trim().substring(0, 60);
                const visible = await b.isVisible().catch(() => false);
                if (text && visible) console.log('  BTN: ' + text);
            }} catch(e) {{}}
        }}

        const headings = await page.locator('h1, h2, h3, h4').all();
        console.log('Headings:');
        for (const h of headings.slice(0, 10)) {{
            try {{ console.log('  H: ' + (await h.textContent()).trim().substring(0, 80)); }} catch(e) {{}}
        }}

        // Attempt to fill known field patterns
        console.log('\\nAttempting to fill form fields...');
        const fillResults = [];

        for (const sel of ['input[name="firstName"]', '#firstName', 'input[placeholder*="First"]', 'input[aria-label*="First"]']) {{
            if (await safeFill(sel, {json.dumps(primary.get('first_name', ''))})) {{ fillResults.push('first_name: ' + sel); break; }}
        }}
        for (const sel of ['input[name="lastName"]', '#lastName', 'input[placeholder*="Last"]', 'input[aria-label*="Last"]']) {{
            if (await safeFill(sel, {json.dumps(primary.get('last_name', ''))})) {{ fillResults.push('last_name: ' + sel); break; }}
        }}
        for (const sel of ['input[type="email"]', 'input[name="email"]', '#email', 'input[placeholder*="Email"]']) {{
            if (await safeFill(sel, {json.dumps(primary.get('email', ''))})) {{ fillResults.push('email: ' + sel); break; }}
        }}
        for (const sel of ['input[type="tel"]', 'input[name="phone"]', '#phone', 'input[placeholder*="Phone"]']) {{
            if (await safeFill(sel, {json.dumps(primary.get('phone', ''))})) {{ fillResults.push('phone: ' + sel); break; }}
        }}
        for (const sel of ['input[name="dob"]', '#dob', 'input[placeholder*="birth"]', 'input[placeholder*="MM/DD/YYYY"]']) {{
            if (await safeFill(sel, {json.dumps(primary.get('dob', '').replace('-', '/'))})) {{ fillResults.push('dob: ' + sel); break; }}
        }}
        for (const sel of ['input[name="ssn"]', '#ssn', 'input[placeholder*="SSN"]', 'input[placeholder*="XXX-XX"]']) {{
            if (await safeFill(sel, {json.dumps(primary.get('ssn', ''))})) {{ fillResults.push('ssn: ' + sel); break; }}
        }}
        for (const sel of ['input[name="address"]', '#address', 'input[placeholder*="Address"]', 'input[placeholder*="Street"]']) {{
            if (await safeFill(sel, {json.dumps(primary.get('address', ''))})) {{ fillResults.push('address: ' + sel); break; }}
        }}
        for (const sel of ['input[name="city"]', '#city', 'input[placeholder*="City"]']) {{
            if (await safeFill(sel, {json.dumps(primary.get('city', ''))})) {{ fillResults.push('city: ' + sel); break; }}
        }}
        for (const sel of ['input[name="zip"]', '#zip', 'input[placeholder*="Zip"]', 'input[placeholder*="Postal"]']) {{
            if (await safeFill(sel, {json.dumps(primary.get('zip', ''))})) {{ fillResults.push('zip: ' + sel); break; }}
        }}
        const income = profile.get('income', {{}})
        for (const sel of ['input[name="income"]', '#income', 'input[placeholder*="Income"]', 'input[placeholder*="0.00"]']) {{
            if (await safeFill(sel, str(income.get('annual_income', 0)))) {{ fillResults.push('income: ' + sel); break; }}
        }}

        console.log('\\nFill results:');
        for (const r of fillResults) {{ console.log('  ' + r); }}

        await page.screenshot({{ path: shotDir + 'lottery_' + LOTTERY_ID + '_filled.png' }}).catch(() => {{}});

        console.log('\\nForm fill attempt complete. REVIEW in Chrome before submitting.');
        console.log('RESULT: PARTIAL_FILL');

    }} catch(e) {{
        console.error('ERROR: ' + e.message);
        await page.screenshot({{ path: shotDir + 'lottery_' + LOTTERY_ID + '_error.png' }}).catch(() => {{}});
        console.log('RESULT: ERROR');
    }}
    browser.close();
}})();
'''

def main():
    load_config()

    dry_run = '--dry-run' in sys.argv
    specific_lottery = None
    if '--lottery' in sys.argv:
        idx = sys.argv.index('--lottery')
        if idx + 1 < len(sys.argv):
            specific_lottery = sys.argv[idx + 1]

    print('=' * 60)
    print('HOUSING CONNECT APPLY')
    print('=' * 60)
    print()

    profile = load_profile()
    print(f'Applicant: {profile["primary_applicant"]["first_name"]} {profile["primary_applicant"]["last_name"]}')

    rows, fieldnames = load_tracker()
    if not rows:
        print('No applications to process')
        return

    pending = [r for r in rows if r.get('application_status', 'Not Applied') == 'Not Applied']
    if specific_lottery:
        pending = [r for r in pending if r.get('lottery_id') == specific_lottery]

    print(f'Pending: {len(pending)} | Applied: {len(rows) - len(pending)}')

    if not pending:
        print('All submitted!')
        return

    if dry_run:
        print('\nDRY RUN — no submissions')
        for r in pending[:5]:
            print(f'  {r["lottery_name"][:50]} (ID: {r["lottery_id"]})')
        if len(pending) > 5:
            print(f'  ... and {len(pending) - 5} more')
        return

    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    # Launch Chrome
    print('\nLaunching Chrome...')
    if not launch_chrome():
        print('Failed to launch Chrome')
        return

    # Step 1: Login
    print('\n=== Step 1: Login ===')
    login_script = generate_login_script(profile)
    temp_script = MESSENGER_DIR / '_hc_login.js'
    with open(temp_script, 'w', encoding='utf-8') as f:
        f.write(login_script)

    try:
        result = subprocess.run(['node', str(temp_script)], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=60, cwd=str(MESSENGER_DIR))
        output = result.stdout + result.stderr
        print(output[:500])

        if 'CAPTCHA_NEEDED' in output:
            print('\n*** CAPTCHA DETECTED ***')
            print('Solve the captcha in Chrome, then press ENTER...')
            input()
            result = subprocess.run(['node', str(temp_script)], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=60, cwd=str(MESSENGER_DIR))
            output = result.stdout + result.stderr
            print(output[:500])

        if 'LOGIN_FAILED' in output and 'LOGIN_OK' not in output:
            print('\nLogin failed. Please log in manually in Chrome.')
            print('Press ENTER when logged in...')
            input()
    except subprocess.TimeoutExpired:
        print('Login script timed out')
        print('Please log in manually in Chrome, then press ENTER...')
        input()
    except Exception as e:
        print(f'Login error: {e}')
        print('Please log in manually in Chrome, then press ENTER...')
        input()
    finally:
        if temp_script.exists():
            temp_script.unlink()

    # Step 2: Process each lottery
    print(f'\n=== Step 2: Process {len(pending)} lotteries ===')
    applied = 0
    errors = 0
    skipped = 0

    for i, row in enumerate(pending):
        print(f'\n[{i+1}/{len(pending)}] {row["lottery_name"][:50]}')
        print(f'  {row["address"][:40]}, {row["borough"]} {row["postcode"]} | Deadline: {row["deadline"]}')

        if not ensure_chrome():
            print('  ERROR: Chrome not available')
            errors += 1
            continue

        script = generate_apply_script(profile, row['lottery_id'], row['lottery_name'])
        temp_script = MESSENGER_DIR / '_hc_apply.js'
        with open(temp_script, 'w', encoding='utf-8') as f:
            f.write(script)

        try:
            result = subprocess.run(['node', str(temp_script)], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=90, cwd=str(MESSENGER_DIR))
            output = result.stdout + result.stderr
            print(output[:1000])

            if 'NEED_LOGIN' in output:
                print('  Need to log in first!')
                errors += 1
                break
            elif 'LOTTERY_CLOSED' in output:
                update_row(row, application_status='Closed')
                save_tracker(rows, fieldnames)
                skipped += 1
            elif 'RESULT: ERROR' in output:
                errors += 1
                update_row(row, application_status='Error', notes=output[:100])
                save_tracker(rows, fieldnames)
            elif 'PARTIAL_FILL' in output:
                print('\n  Review the form in Chrome.')
                print('  Press ENTER to mark as applied, or SKIP to skip:')
                user_input = input().strip()
                if user_input.upper() == 'SKIP':
                    skipped += 1
                    continue

                applied += 1
                today = datetime.now().strftime('%Y-%m-%d')
                update_row(row, application_status='Applied', date_applied=today)
                save_tracker(rows, fieldnames)
                print(f'  Marked as applied on {today}')
        except subprocess.TimeoutExpired:
            print('  TIMEOUT')
            errors += 1
            update_row(row, application_status='Error', notes='Timeout')
            save_tracker(rows, fieldnames)
        except Exception as e:
            print(f'  ERROR: {e}')
            errors += 1
            update_row(row, application_status='Error', notes=str(e)[:100])
            save_tracker(rows, fieldnames)
        finally:
            if temp_script.exists():
                temp_script.unlink()

        if i < len(pending) - 1:
            wait = 30
            print(f'  Waiting {wait}s...')
            time.sleep(wait)

    print(f'\n{"=" * 60}')
    print(f'DONE: {applied} applied, {errors} errors, {skipped} skipped')
    print(f'Remaining: {len(pending) - applied}')

if __name__ == '__main__':
    main()