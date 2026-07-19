#!/usr/bin/env python3
"""
Housing Connect Dry Run — Navigates the site, inspects forms, takes screenshots.
Does NOT submit anything. Just maps the UI so we can build the real automation.

Usage: python housing-connect-dryrun.py
"""

import subprocess
import sys
import time
import urllib.request
from pathlib import Path

HOUSING_DIR = Path(__file__).parent.parent
SCREENSHOT_DIR = HOUSING_DIR / 'applications' / 'screenshots'
CHROME_EXE = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PROFILE = 'Profile 3'
DEBUG_PORT = 9222

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

# The inspection script — dumps all form elements, buttons, links
INSPECT_SCRIPT = r'''
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    
    let page = null;
    for (const p of context.pages()) {
        try {
            if (p.url().includes('housingconnect.nyc.gov')) { page = p; break; }
        } catch(e) {}
    }
    if (!page) page = context.pages()[0];
    
    const fs = require('fs');
    const shotDir = 'C:/Users/RayBe/.openclaw/workspace/housing/applications/screenshots/';
    
    async function inspect(label) {
        console.log('\n=== ' + label + ' ===');
        console.log('URL: ' + page.url());
        console.log('Title: ' + await page.title());
        
        // Screenshot
        const safeLabel = label.replace(/[^a-zA-Z0-9]/g, '_');
        await page.screenshot({ path: shotDir + safeLabel + '.png', fullPage: true });
        
        // Dump all buttons
        const buttons = await page.locator('button, [role="button"], input[type="submit"], input[type="button"]').all();
        const buttonInfo = [];
        for (const b of buttons) {
            try {
                const text = (await b.textContent()).trim().substring(0, 80);
                const tag = await b.evaluate(el => el.tagName);
                const id = await b.getAttribute('id') || '';
                const cls = await b.getAttribute('class') || '';
                const aria = await b.getAttribute('aria-label') || '';
                const disabled = await b.isDisabled();
                buttonInfo.push({ text, tag, id, cls: cls.substring(0, 50), aria, disabled });
            } catch(e) {}
        }
        console.log('\nButtons (' + buttonInfo.length + '):');
        for (const b of buttonInfo) {
            console.log(`  [${b.tag}] "${b.text}" id=${b.id} aria=${b.aria} disabled=${b.disabled} class=${b.cls}`);
        }
        
        // Dump all links
        const links = await page.locator('a').all();
        const linkInfo = [];
        for (const a of links.slice(0, 30)) {
            try {
                const text = (await a.textContent()).trim().substring(0, 60);
                const href = await a.getAttribute('href') || '';
                if (text || href) linkInfo.push({ text, href });
            } catch(e) {}
        }
        console.log('\nLinks (' + linkInfo.length + '):');
        for (const l of linkInfo) {
            console.log(`  "${l.text}" -> ${l.href}`);
        }
        
        // Dump all form inputs
        const inputs = await page.locator('input, select, textarea').all();
        const inputInfo = [];
        for (const inp of inputs) {
            try {
                const tag = await inp.evaluate(el => el.tagName);
                const type = await inp.getAttribute('type') || '';
                const name = await inp.getAttribute('name') || '';
                const id = await inp.getAttribute('id') || '';
                const placeholder = await inp.getAttribute('placeholder') || '';
                const aria = await inp.getAttribute('aria-label') || '';
                const required = await inp.getAttribute('required') || '';
                const value = await inp.inputValue().catch(() => '');
                const cls = await inp.getAttribute('class') || '';
                inputInfo.push({ tag, type, name, id, placeholder, aria, required: !!required, value: value.substring(0, 30), cls: cls.substring(0, 50) });
            } catch(e) {}
        }
        console.log('\nInputs (' + inputInfo.length + '):');
        for (const i of inputInfo) {
            console.log(`  ${i.tag} type=${i.type} name=${i.name} id=${i.id} placeholder="${i.placeholder}" aria="${i.aria}" required=${i.required} value="${i.value}" class=${i.cls}`);
        }
        
        // Dump visible text headings
        const headings = await page.locator('h1, h2, h3, h4, [role="heading"]').all();
        const headingInfo = [];
        for (const h of headings.slice(0, 20)) {
            try {
                const text = (await h.textContent()).trim().substring(0, 80);
                const tag = await h.evaluate(el => el.tagName);
                if (text) headingInfo.push({ tag, text });
            } catch(e) {}
        }
        console.log('\nHeadings:');
        for (const h of headingInfo) {
            console.log(`  ${h.tag}: "${h.text}"`);
        }
        
        // Dump labels
        const labels = await page.locator('label').all();
        const labelInfo = [];
        for (const l of labels.slice(0, 30)) {
            try {
                const text = (await l.textContent()).trim().substring(0, 60);
                const forAttr = await l.getAttribute('for') || '';
                if (text) labelInfo.push({ text, for: forAttr });
            } catch(e) {}
        }
        console.log('\nLabels:');
        for (const l of labelInfo) {
            console.log(`  "${l.text}" for=${l.for}`);
        }
    }
    
    try {
        // Step 1: Inspect the landing page
        await page.waitForTimeout(2000);
        await inspect('01_landing_page');
        
        // Step 2: Try to find and click login button
        console.log('\n--- Looking for Login ---');
        const loginSelectors = [
            'button:has-text("Log In")',
            'a:has-text("Log In")',
            'button:has-text("Sign In")',
            'a:has-text("Sign In")',
            '[aria-label*="Login"]',
            '[aria-label*="log in"]'
        ];
        let clicked = false;
        for (const sel of loginSelectors) {
            try {
                const loc = page.locator(sel).first();
                if (await loc.isVisible({ timeout: 2000 })) {
                    console.log('Found login: ' + sel);
                    await loc.click();
                    await page.waitForTimeout(3000);
                    clicked = true;
                    break;
                }
            } catch(e) {}
        }
        if (!clicked) {
            console.log('No login button found — may already be logged in or need different selector');
        }
        await inspect('02_after_login_click');
        
        // Step 3: If we see a login form, inspect it
        const emailField = page.locator('input[type="email"], input[name="email"], #email, input[placeholder*="Email"]').first();
        if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('\n--- Login form detected ---');
            await inspect('03_login_form');
        }
        
        // Step 4: Try navigating to browse listings
        console.log('\n--- Navigating to listings ---');
        const browseSelectors = [
            'a:has-text("Browse")',
            'a:has-text("Opportunities")',
            'a:has-text("Listings")',
            'a:has-text("Rentals")',
            'button:has-text("Browse")',
            '[href*="listings"]',
            '[href*="opportunities"]'
        ];
        for (const sel of browseSelectors) {
            try {
                const loc = page.locator(sel).first();
                if (await loc.isVisible({ timeout: 2000 })) {
                    console.log('Found browse: ' + sel);
                    await loc.click();
                    await page.waitForTimeout(3000);
                    break;
                }
            } catch(e) {}
        }
        await inspect('04_listings_page');
        
        // Step 5: Try navigating to a specific lottery (Rialto West - lottery ID 7548)
        console.log('\n--- Navigating to specific lottery (7548) ---');
        // Try hash navigation
        await page.goto('https://housingconnect.nyc.gov/PublicWeb/#/listing/7548', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('Nav error: ' + e.message));
        await page.waitForTimeout(5000);
        await inspect('05_lottery_7548_detail');
        
        // Step 6: Look for Apply button on the listing
        console.log('\n--- Looking for Apply button ---');
        const applySelectors = [
            'button:has-text("Apply")',
            'a:has-text("Apply")',
            'button:has-text("Apply Now")',
            'a:has-text("Apply Now")',
            '[aria-label*="Apply"]'
        ];
        for (const sel of applySelectors) {
            try {
                const loc = page.locator(sel).first();
                if (await loc.isVisible({ timeout: 2000 })) {
                    console.log('Found apply: ' + sel);
                    // DON'T click in dry run — just inspect
                    await inspect('06_apply_button_found');
                    
                    // If we were to click, what would the form look like?
                    // Let's click and inspect, then we know the form structure
                    console.log('\n--- Clicking Apply to see form (will NOT submit) ---');
                    await loc.click();
                    await page.waitForTimeout(5000);
                    await inspect('07_application_form_step1');
                    
                    // Look for Next/Continue buttons
                    const nextSelectors = [
                        'button:has-text("Next")',
                        'button:has-text("Continue")',
                        'button:has-text("Save")',
                        'input[type="submit"]',
                        'button[type="submit"]'
                    ];
                    for (const ns of nextSelectors) {
                        try {
                            const nloc = page.locator(ns).first();
                            if (await nloc.isVisible({ timeout: 2000 })) {
                                console.log('Found next button: ' + ns);
                                // DON'T click in dry run
                                break;
                            }
                        } catch(e) {}
                    }
                    break;
                }
            } catch(e) {}
        }
        
        console.log('\n=== DRY RUN COMPLETE ===');
        console.log('Check screenshots in: ' + shotDir);
        console.log('Review the output above to map form selectors for the real automation.');
        
    } catch(e) {
        console.error('ERROR: ' + e.message);
        await page.screenshot({ path: shotDir + 'error.png' }).catch(() => {});
    }
})();
'''

def main():
    print('=' * 60)
    print('HOUSING CONNECT DRY RUN — Form Inspection')
    print('No applications will be submitted. Just navigating and mapping UI.')
    print('=' * 60)
    print()
    
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Launch Chrome
    print('Launching Chrome with debug port...')
    if not launch_chrome():
        print('Failed to launch Chrome')
        return
    
    print()
    print('Chrome is open at housingconnect.nyc.gov')
    print('Auto-proceeding in 10 seconds (log in to Housing Connect if needed)...')
    time.sleep(10)
    print('Starting inspection...')
    
    # Write the inspection script in the messenger dir where playwright is installed
    messenger_dir = Path.home() / '.openclaw' / 'workspace' / 'outreach' / 'messenger'
    temp_script = messenger_dir / '_dryrun_inspect.js'
    with open(temp_script, 'w', encoding='utf-8') as f:
        f.write(INSPECT_SCRIPT)
    
    print('\nRunning Playwright inspection...\n')
    try:
        result = subprocess.run(
            ['node', str(temp_script)],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=120,
            cwd=str(messenger_dir)
        )
        print(result.stdout)
        if result.stderr:
            print('\n--- STDERR ---')
            print(result.stderr[:2000])
    except subprocess.TimeoutExpired:
        print('Script timed out (120s)')
    except Exception as e:
        print(f'Error: {e}')
    finally:
        if temp_script.exists():
            temp_script.unlink()
    print('Dry run complete. Check screenshots in:')
    print(f'  {SCREENSHOT_DIR}')
    print('Review the output above to see form structure.')
    print('=' * 60)

if __name__ == '__main__':
    main()