#!/usr/bin/env python3
"""
SEND ALL 99 NYC VENUES - Comprehensive Outreach Automation
Processes: emails (Gmail), phone (scripts), web forms (browser), social (tabs)

Updated: Now tracks contacted venues to prevent duplicates
"""

import subprocess
import time
import sys
import urllib.request
import csv
import re
import webbrowser
from datetime import datetime
from playwright.sync_api import sync_playwright

class SendAllVenues:
    def __init__(self):
        self.venues = []
        self.email_venues = []
        self.phone_venues = []
        self.webform_venues = []
        self.social_venues = []
        self.research_venues = []
        self.auto_send = False
        
    def safe_get(self, venue, key, default=''):
        val = venue.get(key, default)
        if val is None:
            return default
        return str(val)
        
    def load_and_categorize(self):
        print("\nLoading all 99 NYC venues...")
        
        with open('cosmic-blues-venues.csv', 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if not row.get('venue'):
                    continue
                self.venues.append(row)
        
        print("Loaded %d venues" % len(self.venues))
        
        # Count already contacted
        already_contacted = sum(1 for v in self.venues if v.get('date_contacted', '').strip())
        print("Already contacted: %d venues" % already_contacted)
        
        # Ask if user wants to retry
        skip_contacted = True
        retry_input = input("\nSkip venues already contacted? [Y/n]: ").lower().strip()
        if retry_input == 'n':
            skip_contacted = False
            print("[RETRY MODE] Will include already-contacted venues")
        
        # Ask for auto-send mode
        self.auto_send = False
        auto_input = input("\nAuto-send emails? [y/N]: ").lower().strip()
        if auto_input == 'y':
            self.auto_send = True
            print("[AUTO MODE] Will auto-send after 3 second delay")
        else:
            print("[MANUAL MODE] Will wait for confirmation after each email")
        
        for venue in self.venues:
            self.categorize_venue(venue, skip_contacted=skip_contacted)
        
        print("\n" + "="*60)
        print("VENUES TO PROCESS")
        print("="*60)
        print("Email:     %d venues" % len(self.email_venues))
        print("Phone:     %d venues" % len(self.phone_venues))
        print("Web forms: %d venues" % len(self.webform_venues))
        print("Social:    %d venues" % len(self.social_venues))
        print("Research:  %d venues" % len(self.research_venues))
        print("="*60)
        
    def categorize_venue(self, venue, skip_contacted=True):
        name = self.safe_get(venue, 'venue')
        vtype = self.safe_get(venue, 'type')
        notes = self.safe_get(venue, 'notes').lower()
        booking = self.safe_get(venue, 'booking_contact')
        contacted = self.safe_get(venue, 'date_contacted')
        
        if vtype in ['CONFIRMED', 'HISTORICAL']:
            return
            
        if 'closed' in notes or 'expired' in notes:
            return
        
        # Skip if already contacted (unless retry mode)
        if skip_contacted and contacted.strip():
            print("  [SKIPPED - already contacted %s] %s" % (contacted, name))
            return
        
        if '@' in booking and 'bounced' not in notes:
            self.email_venues.append(venue)
            return
        
        if '@' in notes and 'bounced' not in notes:
            self.email_venues.append(venue)
            return
        
        if re.search(r'\d{3}-\d{3}-\d{4}', notes):
            self.phone_venues.append(venue)
            return
        
        if 'instagram' in notes:
            self.social_venues.append(venue)
            return
            
        if 'website form' in notes or 'contact form' in notes:
            self.webform_venues.append(venue)
            return
        
        self.research_venues.append(venue)
    
    def extract_email(self, venue):
        booking = self.safe_get(venue, 'booking_contact')
        notes = self.safe_get(venue, 'notes')
        if '@' in booking:
            return booking.strip()
        emails = re.findall(r'[\w.+-]+@[\w-]+\.[\w.-]+', notes)
        if emails:
            return emails[0]
        return None
    
    def extract_phone(self, venue):
        notes = self.safe_get(venue, 'notes')
        phones = re.findall(r'\d{3}-\d{3}-\d{4}', notes)
        if phones:
            return phones[0]
        return None
    
    def get_website(self, venue):
        return self.safe_get(venue, 'website')
    
    def generate_email_body(self, venue):
        name = self.safe_get(venue, 'venue')
        history = "I played at your venue before and would love to return. " if 'played here before' in self.safe_get(venue, 'notes').lower() else ""
        
        subject_map = {
            'Iridium': "Blues booking inquiry - former B.B. King's Resident Band Leader",
            'Zinc': "Jazz-blues booking inquiry - fall 2026",
            'Barbes': "Cosmic blues booking inquiry - fall 2026"
        }
        
        subject = "Cosmic blues booking inquiry - fall dates 2026"
        for key, val in subject_map.items():
            if key in name:
                subject = val
                break
        
        body = """%sI'm Cosmic Ray, former Resident Band Leader at B.B. King's Blues Club NYC (~10 years). I run a cosmic blues project and I'm looking to book dates for September-December 2026.

Cosmic blues with a rotating pool of NYC players. Flexible lineup - scales from solo to full band depending on your room. Self-contained on backline.

Recent show at Gladstone Hotel, Toronto: https://www.youtube.com/watch?v=XKqRV3OGQdo
Instagram: @cosmicbluesband
Phone: 929-361-7136

Can we discuss potential dates?

Best,
Cosmic Ray
The Cosmic Blues Band
929-361-7136
@cosmicbluesband""" % history
        
        return subject, body
    
    def update_csv_contact_date(self, venue_name):
        """Update date_contacted in CSV after successful send"""
        try:
            rows = []
            today = datetime.now().strftime('%Y-%m-%d')
            
            with open('cosmic-blues-venues.csv', 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                fieldnames = reader.fieldnames
                for row in reader:
                    if row.get('venue') == venue_name:
                        row['date_contacted'] = today
                        row['status'] = 'CONTACTED'
                    rows.append(row)
            
            with open('cosmic-blues-venues.csv', 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)
            
            print("  [CSV UPDATED] date_contacted = %s" % today)
        except Exception as e:
            print("  [WARNING] Could not update CSV: %s" % e)
    
    def process_emails(self):
        """Handle all email venues via Gmail"""
        if not self.email_venues:
            print("\nNo email venues to process")
            return 0
        
        print("\n" + "="*60)
        print("PHASE 1: EMAILS (%d venues)" % len(self.email_venues))
        print("="*60)
        
        # Launch Chrome
        chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
        user_data = r"C:\Users\RayBe\AppData\Local\Google\Chrome\User Data"
        
        print("\nLaunching Chrome...")
        try:
            subprocess.run(['taskkill', '/F', '/IM', 'chrome.exe'], capture_output=True)
            time.sleep(3)
        except:
            pass
        
        # Clean lock files
        from pathlib import Path as P
        lock_file = P(user_data) / "Profile 3" / "LOCK"
        if lock_file.exists():
            try: lock_file.unlink()
            except: pass
        for ln in ['SingletonLock', 'SingletonCookie', 'SingletonSocket']:
            lp = P(user_data) / ln
            if lp.exists():
                try: lp.unlink()
                except: pass
        
        process = subprocess.Popen([
            chrome_path,
            '--user-data-dir=%s' % user_data,
            '--profile-directory=Profile 3',
            '--remote-debugging-port=9222',
            '--remote-allow-origins=*',
            '--no-first-run',
            '--start-maximized',
            'https://mail.google.com'
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Wait for Chrome
        start = time.time()
        while time.time() - start < 30:
            try:
                urllib.request.urlopen('http://localhost:9222/json/version', timeout=1)
                print("Chrome ready!")
                time.sleep(3)
                break
            except:
                pass
            time.sleep(0.5)
        else:
            print("Chrome failed to start, skipping emails")
            return 0
        
        # Send emails
        sent = 0
        try:
            with sync_playwright() as p:
                browser = p.chromium.connect_over_cdp("http://localhost:9222")
                context = browser.contexts[0] if browser.contexts else browser.new_context()
                page = context.pages[0] if context.pages else context.new_page()
                
                for i, venue in enumerate(self.email_venues, 1):
                    email = self.extract_email(venue)
                    if not email:
                        continue
                    
                    subject, body = self.generate_email_body(venue)
                    
                    print("\nEmail %d/%d: %s -> %s" % (i, len(self.email_venues), self.safe_get(venue, 'venue'), email))
                    
                    try:
                        page.goto("https://mail.google.com/mail/u/0/#inbox?compose=new")
                        time.sleep(5)  # Wait longer for Gmail to load
                        
                        # Try multiple selectors for To field
                        to_selectors = [
                            'input[peoplekit-id="BillingAtom"]',
                            'input[aria-label="To recipients"]',
                            'textarea[aria-label="To recipients"]',
                            '[role="combobox"][aria-label="To recipients"]',
                            'input[aria-label="To"]',
                            '[name="to"]'
                        ]
                        
                        to_field = None
                        for selector in to_selectors:
                            try:
                                to_field = page.locator(selector).first
                                if to_field.is_visible(timeout=2000):
                                    break
                            except:
                                continue
                        
                        if not to_field:
                            print("[WARNING] Could not find To field")
                            continue
                            
                        to_field.fill(email)
                        to_field.press("Tab")
                        time.sleep(1)
                        
                        # Try multiple selectors for Subject
                        subject_selectors = [
                            'input[name="subjectbox"]',
                            'input[aria-label="Subject"]',
                            'input[placeholder="Subject"]'
                        ]
                        
                        subject_field = None
                        for selector in subject_selectors:
                            try:
                                subject_field = page.locator(selector).first
                                if subject_field.is_visible(timeout=2000):
                                    break
                            except:
                                continue
                        
                        if subject_field:
                            subject_field.fill(subject)
                            time.sleep(0.5)
                        
                        # Try multiple selectors for Body
                        body_selectors = [
                            'div[aria-label="Message Body"]',
                            'div[role="textbox"][aria-label*="Message"]',
                            'div[g_editable="true"]',
                            '.Am.Al'
                        ]
                        
                        body_field = None
                        for selector in body_selectors:
                            try:
                                body_field = page.locator(selector).first
                                if body_field.is_visible(timeout=2000):
                                    break
                            except:
                                continue
                        
                        if body_field:
                            body_field.fill(body)
                            time.sleep(0.5)
                        
                        if self.auto_send:
                            print("[FILLED] Auto-sending in 3 seconds... [CTRL+C to cancel]")
                            time.sleep(3)
                            
                            # Try multiple selectors for Send button
                            send_selectors = [
                                'div[role="button"][aria-label="Send"]',
                                'div[role="button"][data-tooltip="Send"]',
                                'div.T-I.J-J5-Ji.aoO.T-I-atl.L3',
                                '[data-tooltip="Send ‪(Ctrl-Enter)‬"]',
                                'div.T-I.J-J5-Ji.aoO'
                            ]
                            
                            send_button = None
                            for selector in send_selectors:
                                try:
                                    send_button = page.locator(selector).first
                                    if send_button.is_visible(timeout=2000):
                                        break
                                except:
                                    continue
                            
                            if send_button and send_button.is_visible():
                                send_button.click()
                                print("[SENT] Email sent!")
                                time.sleep(2)
                                sent += 1
                                self.update_csv_contact_date(self.safe_get(venue, 'venue'))
                            else:
                                print("[WARNING] Send button not found - please send manually")
                                input("Press Enter after sending manually...")
                                sent += 1
                                self.update_csv_contact_date(self.safe_get(venue, 'venue'))
                        else:
                            print("[FILLED] Review and click Send in Chrome")
                            result = input("[s=Sent, f=Failed, q=Quit]: ").lower().strip()
                            
                            if result == 's':
                                sent += 1
                                self.update_csv_contact_date(self.safe_get(venue, 'venue'))
                            elif result == 'q':
                                print("Quitting...")
                                break
                            else:
                                print("  [NOT COUNTED]")
                        
                    except KeyboardInterrupt:
                        print("\n[QUIT] Stopping...")
                        break
                    except Exception as e:
                        print("[ERROR] %s" % e)
                        print("[CONTINUING] Moving to next venue...")
                        time.sleep(2)
                
                browser.close()
        except Exception as e:
            print("Browser error: %s" % e)
        
        try:
            process.terminate()
        except:
            pass
        
        return sent
    
    def process_webforms(self):
        """Open web forms in browser"""
        if not self.webform_venues:
            return
        
        print("\n" + "="*60)
        print("PHASE 2: WEB FORMS (%d venues)" % len(self.webform_venues))
        print("="*60)
        print("Opening websites in browser...")
        
        for venue in self.webform_venues:
            website = self.get_website(venue)
            name = self.safe_get(venue, 'venue')
            if website:
                print("  - %s: %s" % (name, website))
                webbrowser.open(website)
                time.sleep(1)
        
        print("\n[INFO] Submit forms manually with your info:")
        print("  Name: Cosmic Ray")
        print("  Email: cosmicraymusic@gmail.com")
        print("  Phone: 929-361-7136")
        print("  Video: https://www.youtube.com/watch?v=XKqRV3OGQdo")
        input("\n[ENTER] When done, press Enter...")
    
    def process_social(self):
        """Open social media"""
        if not self.social_venues:
            return
        
        print("\n" + "="*60)
        print("PHASE 3: SOCIAL MEDIA (%d venues)" % len(self.social_venues))
        print("="*60)
        
        for venue in self.social_venues:
            name = self.safe_get(venue, 'venue')
            print("\n%s:" % name)
            print("  DM: @%s" % name.lower().replace(' ', ''))
            print("  Message: Hi! I'm Cosmic Ray, former Resident Band Leader...")
            
        input("\n[ENTER] Send DMs on Instagram, then press Enter...")
    
    def process_phone(self):
        """Generate and show phone scripts"""
        if not self.phone_venues:
            return
        
        print("\n" + "="*60)
        print("PHASE 4: PHONE CALLS (%d venues)" % len(self.phone_venues))
        print("="*60)
        
        for venue in self.phone_venues:
            name = self.safe_get(venue, 'venue')
            phone = self.extract_phone(venue)
            
            print("\n" + "-"*40)
            print("CALL: %s" % name)
            print("PHONE: %s" % phone)
            print("-"*40)
            print('SCRIPT: "Hi, this is Cosmic Ray. Former Resident Band Leader')
            print('at B.B. Kings Blues Club - about 10 years in that room. I run')
            print('cosmic blues and Im looking to book fall dates."')
            print("-"*40)
        
        print("\nYour info:")
        print("  Cosmic Ray")
        print("  929-361-7136")
        print("  cosmicraymusic@gmail.com")
        print("  @cosmicbluesband")
        print("  Former B.B. King's Resident Band Leader (~10 years)")
        
        input("\n[ENTER] Make these calls, then press Enter...")
    
    def process_research(self):
        """Open research venues"""
        if not self.research_venues:
            return
        
        print("\n" + "="*60)
        print("PHASE 5: RESEARCH NEEDED (%d venues)" % len(self.research_venues))
        print("="*60)
        print("Open these in browser and find contact info:\n")
        
        for venue in self.research_venues[:10]:  # First 10
            name = self.safe_get(venue, 'venue')
            website = self.get_website(venue)
            print("  - %s" % name)
            if website:
                webbrowser.open(website)
                time.sleep(0.5)
        
        if len(self.research_venues) > 10:
            print("\n  ... and %d more" % (len(self.research_venues) - 10))
        
        print("\nSearch for:")
        print("  - Instagram @%s" % name.lower().replace(' ', ''))
        print("  - Phone on Google Maps")
        print("  - 'BOOKING' or 'CONTACT' on website")
        
        input("\n[ENTER] Continue...")
    
    def generate_summary(self):
        """Create summary file"""
        with open('SEND_ALL_SUMMARY.txt', 'w') as f:
            f.write("COSMIC RAY - SEND ALL VENUES COMPLETE\n")
            f.write("Time: %s\n\n" % datetime.now().strftime('%Y-%m-%d %H:%M'))
            f.write("EMAILS SENT:\n")
            for v in self.email_venues:
                f.write("  - %s: %s\n" % (self.safe_get(v, 'venue'), self.extract_email(v)))
            f.write("\nPHONE CALLS TO MAKE:\n")
            for v in self.phone_venues:
                phone = self.extract_phone(v)
                if phone:
                    f.write("  - %s: %s\n" % (self.safe_get(v, 'venue'), phone))
            f.write("\nWEB FORMS:\n")
            for v in self.webform_venues:
                f.write("  - %s\n" % self.safe_get(v, 'venue'))
            f.write("\nSOCIAL:\n")
            for v in self.social_venues:
                f.write("  - %s\n" % self.safe_get(v, 'venue'))
        print("\nSummary saved to SEND_ALL_SUMMARY.txt")
    
    def run(self):
        print("="*60)
        print("SEND ALL 99 NYC VENUES")
        print("Complete outreach automation")
        print("="*60)
        
        self.load_and_categorize()
        
        input("\n[READY] Press Enter to start...")
        
        # Process all phases
        self.process_emails()
        self.process_webforms()
        self.process_social()
        self.process_phone()
        self.process_research()
        
        self.generate_summary()
        
        print("\n" + "="*60)
        print("ALL PHASES COMPLETE!")
        print("="*60)
        print("Check SEND_ALL_SUMMARY.txt")
        input("\nPress Enter to exit...")

def main():
    bot = SendAllVenues()
    bot.run()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled.")
        sys.exit(0)
    except Exception as e:
        print("\nError: %s" % e)
        import traceback
        traceback.print_exc()
        input("\nPress Enter to exit...")