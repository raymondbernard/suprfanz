#!/usr/bin/env python3
"""
SEND MEDIA PRESS RELEASES - Sends personalized pitch emails to blues media contacts
Uses the same Gmail/Playwright automation as the venue outreach script.
"""

import subprocess
import time
import sys
import urllib.request
import csv
import os
from pathlib import Path
from datetime import datetime
from playwright.sync_api import sync_playwright

CHROME_EXE = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE = "Profile 3"
DATA_DIR = Path(__file__).parent.parent.parent  # workspace root
MEDIA_CSV = Path(__file__).parent / "media_contacts.csv"
TRACKED_CSV = Path(__file__).parent / "media_contacts.csv"  # same file, we add tracking columns

# Email templates by category
SUBJECT = "New NYC blues from former B.B. King's bandleader — EPK available"

def get_template(category, contact_name, outlet_name):
    first = contact_name or "there"
    
    if category == "Radio":
        body = f"""Hi {first},

I'm Cosmic Ray, former Resident Band Leader at B.B. King's Blues Club in NYC. I'm reaching out with new music from The Cosmic Blues Band that I think your listeners would love.

We play raw, high-energy cosmic blues — the kind of sound that filled B.B. King's for a decade. Live clips from our recent Toronto residency:

https://youtu.be/XKqRV3OGQdo

Would you be open to:
- Spinning a track?
- Having me in for a live in-studio set?
- A quick phone interview about the NYC blues scene post-B.B. King's?

Full EPK and tracks available on request.

Best,
Cosmic Ray
929-361-7136
@cosmicbluesband"""
    elif category == "Industry":
        body = f"""Hi {first},

I'm reaching out about potential booking/coverage opportunities. I led the house band at B.B. King's Blues Club in Times Square for nearly a decade, and I'm now booking select dates with The Cosmic Blues Band for fall/winter 2026.

We're flexible — solo to full band — and self-contained on backline. Recent residency at the Gladstone Hotel in Toronto. Full EPK, stage plot, and live clips available.

Would love to discuss what might work for you.

Best,
Cosmic Ray
cosmicraymusic@gmail.com
929-361-7136
@cosmicbluesband"""
    else:
        # Magazine, Blog, Organization
        body = f"""Hi {first},

Cosmic Ray here — I ran the house band at B.B. King's Blues Club in Times Square for nearly a decade. I'm back with The Cosmic Blues Band, booking select dates for fall 2026.

We've got a fresh EPK with live clips from our recent Toronto residency, high-res photos, and a story your readers will care about: the B.B. King's era closing, and what comes next.

Would you be interested in:
- A feature or interview?
- Reviewing our live video clips?
- Covering an upcoming show?

Live video: https://youtu.be/XKqRV3OGQdo
Full EPK attached. Happy to send anything else you need.

Best,
Cosmic Ray
929-361-7136
@cosmicbluesband"""
    
    return body


class SendMedia:
    def __init__(self):
        self.contacts = []
        self.auto_send = False
    
    def load_contacts(self):
        """Load media contacts from CSV"""
        print("\nLoading media contacts...")
        
        if not MEDIA_CSV.exists():
            print(f"ERROR: {MEDIA_CSV} not found!")
            return
        
        with open(MEDIA_CSV, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Skip already contacted
                if row.get('date_contacted', '').strip():
                    continue
                if not row.get('email', '').strip():
                    continue
                self.contacts.append(row)
        
        print(f"Loaded {len(self.contacts)} media contacts to email")
        
        # Show breakdown by category
        cats = {}
        for c in self.contacts:
            cat = c.get('category', 'Unknown')
            cats[cat] = cats.get(cat, 0) + 1
        for cat, count in sorted(cats.items()):
            print(f"  {cat}: {count}")
    
    def launch_chrome(self):
        """Launch Chrome with debug port"""
        user_data = str(Path.home() / "AppData" / "Local" / "Google" / "Chrome" / "User Data")
        
        print("\nLaunching Chrome...")
        try:
            subprocess.run(['taskkill', '/F', '/IM', 'chrome.exe', '/T'],
                         capture_output=True, timeout=10)
        except: pass
        time.sleep(5)
        
        # Clean locks
        lock = Path(user_data) / "Profile 3" / "LOCK"
        if lock.exists():
            try: lock.unlink()
            except: pass
        for f in ['DevToolsActivePort', 'Current Session', 'Current Tabs']:
            p = Path(user_data) / "Profile 3" / f
            if p.exists():
                try: p.unlink()
                except: pass
        for f in ['SingletonLock', 'SingletonCookie', 'SingletonSocket']:
            p = Path(user_data) / f
            if p.exists():
                try: p.unlink()
                except: pass
        
        subprocess.Popen([
            CHROME_EXE,
            f'--user-data-dir={user_data}',
            '--profile-directory=Profile 3',
            '--start-maximized',
            '--disable-blink-features=AutomationControlled',
            '--remote-debugging-port=9222',
            '--remote-allow-origins=*',
            '--no-first-run',
            '--no-default-browser-check',
            '--no-restore-last-session',
            'https://mail.google.com'
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Wait for port
        print("Waiting for Chrome...")
        for i in range(15):
            time.sleep(2)
            try:
                urllib.request.urlopen("http://127.0.0.1:9222/json/version", timeout=2)
                print("Chrome is ready!")
                return True
            except:
                pass
        print("Chrome failed to start!")
        return False
    
    def send_email(self, contact):
        """Send a personalized email via Gmail using Playwright"""
        email = contact['email']
        contact_name = contact.get('contact_name', '') or email.split('@')[0]
        outlet = contact.get('outlet_name', '')
        category = contact.get('category', '')
        
        body = get_template(category, contact_name, outlet)
        
        # Build Gmail compose URL
        import urllib.parse
        params = urllib.parse.urlencode({
            'to': email,
            'subject': SUBJECT,
            'body': body
        })
        compose_url = f"https://mail.google.com/mail/?view=cm&fs=1&{params}"
        
        print(f"  To: {email}")
        print(f"  Subject: {SUBJECT}")
        print(f"  Outlet: {outlet} ({category})")
        
        if not self.auto_send:
            confirm = input("\n  Send this email? [y/n/q]: ").strip().lower()
            if confirm == 'q':
                return 'quit'
            if confirm != 'y':
                print("  Skipped.")
                return 'skipped'
        
        # Use Playwright to open Gmail compose and send
        with sync_playwright() as p:
            browser = p.chromium.connectOverCDP("http://127.0.0.1:9222")
            context = browser.contexts()[0]
            
            # Find Gmail tab or create new one
            page = None
            for pg in context.pages:
                try:
                    if 'mail.google.com' in pg.url():
                        page = pg
                        break
                except: pass
            
            if notpage:
                page = context.new_page()
            
            # Navigate to compose URL
            page.goto(compose_url, wait_until='domcontentloaded', timeout=15000)
            time.sleep(3)
            
            if self.auto_send:
                # Auto-send: find send button and click
                try:
                    send_btn = page.locator('div[role="button"][aria-label*="Send"], div[role="button"]:has-text("Send")').first()
                    send_btn.click()
                    time.sleep(2)
                    print("  SENT (auto)")
                except:
                    print("  Could not auto-send. Please send manually.")
                    input("  Press ENTER when sent...")
            else:
                print("  Gmail compose opened. Review and click Send.")
                input("  Press ENTER when sent...")
            
            browser.close()
        
        return 'sent'
    
    def update_csv(self, contact, status):
        """Update CSV with contact status"""
        rows = []
        fieldnames = None
        
        with open(MEDIA_CSV, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            # Add tracking columns if not present
            if 'date_contacted' not in fieldnames:
                fieldnames = list(fieldnames) + ['date_contacted', 'status']
            for row in reader:
                email = row.get('email', '')
                if email == contact.get('email', ''):
                    row['date_contacted'] = datetime.now().strftime('%Y-%m-%d')
                    row['status'] = status
                rows.append(row)
        
        with open(MEDIA_CSV, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
    
    def run(self):
        """Main run"""
        print("=" * 60)
        print("  MEDIA PRESS RELEASE SENDER")
        print("  Cosmic Blues Band — Blues Media Outreach")
        print("=" * 60)
        
        self.load_contacts()
        
        if not self.contacts:
            print("\nNo contacts to email!")
            return
        
        # Ask mode
        auto = input("\nAuto-send? [y/N]: ").strip().lower()
        self.auto_send = (auto == 'y')
        
        if self.auto_send:
            print("[AUTO MODE] Will auto-send after 3s delay")
        else:
            print("[MANUAL MODE] Will wait for confirmation after each email")
        
        # Launch Chrome
        if not self.launch_chrome():
            print("Could not launch Chrome!")
            return
        
        sent = 0
        skipped = 0
        errors = 0
        
        for i, contact in enumerate(self.contacts, 1):
            print(f"\n{'='*60}")
            print(f"  Email {i}/{len(self.contacts)}")
            print(f"{'='*60}")
            
            result = self.send_email(contact)
            
            if result == 'quit':
                print("\nQuitting...")
                break
            elif result == 'sent':
                self.update_csv(contact, 'sent')
                sent += 1
                if self.auto_send:
                    time.sleep(3)
            elif result == 'skipped':
                self.update_csv(contact, 'skipped')
                skipped += 1
            else:
                self.update_csv(contact, 'error')
                errors += 1
        
        print(f"\n{'='*60}")
        print(f"  COMPLETE")
        print(f"  Sent: {sent} | Skipped: {skipped} | Errors: {errors}")
        print(f"{'='*60}")


if __name__ == "__main__":
    sender = SendMedia()
    sender.run()