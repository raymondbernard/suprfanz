#!/usr/bin/env python3
"""
Messenger Skill - Facebook Messenger Automation
"""

import subprocess
import time
import random
import csv
import json
import os
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional

# Configuration
CHROME_EXE = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA_DIR = Path.home() / "AppData" / "Local" / "Google" / "Chrome" / "User Data"
PROFILE = "Profile 3"
CSV_PATH = Path("./fbfriends.csv")


@dataclass
class Contact:
    fb_usr_id: str
    fb_first_name: str
    fb_last_name: str
    fb_name: str
    fb_profile_id: str
    message_sent: str
    sent_at: str
    last_error: str


@dataclass
class Event:
    title: str
    url: str
    description: str


class MessengerSkill:
    def __init__(self):
        self.event = Event(
            title="Cosmic Blues Band Live",
            url="https://www.facebook.com/events/971902445574502",
            description="A night of blues and roots music with the Cosmic Blues Band!"
        )
        
    def load_contacts(self, limit: int = 0) -> List[Contact]:
        """Load contacts that haven't been messaged yet"""
        contacts = []
        
        with open(CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Skip already sent
                if row.get('message_sent') == 'true':
                    continue
                    
                contact = Contact(
                    fb_usr_id=row.get('fb_usr_id', ''),
                    fb_first_name=row.get('fb_first_name', ''),
                    fb_last_name=row.get('fb_last_name', ''),
                    fb_name=row.get('fb_name', ''),
                    fb_profile_id=row.get('fb_profile_id', ''),
                    message_sent=row.get('message_sent', ''),
                    sent_at=row.get('sent_at', ''),
                    last_error=row.get('last_error', '')
                )
                contacts.append(contact)
                
                if limit > 0 and len(contacts) >= limit:
                    break
                    
        return contacts
    
    def generate_message(self, contact: Contact) -> str:
        """Generate personalized message"""
        first_name = contact.fb_first_name
        
        styles = [
            f"Hey {first_name}!\n\nPutting together a blues show and immediately thought of you. Come hang! Also, hitting \"Interested\" on the event page helps other blues fans discover it.\n\n{self.event.url}",
            f"Hi {first_name}!\n\nWe've got a blues night coming up that I thought you'd dig. Would love to see you there! If you can, click \"Interested\" on the event page—it really helps spread the word.\n\n{self.event.url}",
            f"Hi {first_name}!\n\n{self.event.description}\n\nClick \"Interested\" here if you're curious: {self.event.url}",
        ]
        return random.choice(styles)
    
    def launch_chrome(self, url: str):
        """Launch Chrome with Profile 3"""
        cmd = [
            CHROME_EXE,
            f"--profile-directory={PROFILE}",
            "--start-maximized",
            "--disable-blink-features=AutomationControlled",
            "--remote-debugging-port=9222",
            url
        ]
        
        print(f"\n🚀 Launching Chrome with Profile 3...")
        print(f"   URL: {url}")
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        return process
    
    def create_type_script(self, contact: Contact, message: str) -> str:
        """Create Node.js script with 60 second wait"""
        escaped_message = message.replace('\\', '\\\\').replace('`', '\\`').replace('$', '\\$')
        
        script = f'''
const {{ chromium }} = require('playwright');

(async () => {{
    console.log('Connecting to Chrome...');
    
    try {{
        const browser = await chromium.connectOverCDP('http://localhost:9222');
        const context = browser.contexts()[0];
        const page = context.pages()[0];
        
        console.log('Current URL:', page.url());
        
        // Wait 60 seconds for page to fully load
        console.log('Waiting 60 seconds for page to load...');
        await page.waitForTimeout(60000);
        
        console.log('Page loaded. Checking for Continue button...');
        console.log('Looking for: div > div > div > div[role="button"]');
        
        // Take screenshot for debugging
        try {{
            await page.screenshot({{ path: 'before_continue.png' }});
            console.log('Screenshot saved: before_continue.png');
        }} catch(e) {{}}
        
        // Check for Continue button
        let buttonClicked = false;
        try {{
            const buttons = await page.locator('div > div > div > div[role="button"]').all();
            console.log(`Found ${{buttons.length}} buttons with selector`);
            
            for (let i = 0; i < buttons.length; i++) {{
                const btn = buttons[i];
                const text = await btn.textContent().catch(() => '');
                const isVisible = await btn.isVisible().catch(() => false);
                console.log(`Button ${{i}}: "${{text}}" (visible: ${{isVisible}})`);
                
                if (isVisible && (text.includes('Continue') || text.includes('Continue as'))) {{
                    console.log('Clicking Continue button...');
                    await btn.click();
                    buttonClicked = true;
                    console.log('✓ Clicked!');
                    await page.waitForTimeout(5000);
                    break;
                }}
            }}
            
            if (!buttonClicked) {{
                console.log('No Continue button found with that selector');
            }}
        }} catch (e) {{
            console.log('Error finding button:', e.message);
        }}
        
        // Wait for PIN entry if needed
        console.log('Waiting for PIN/conversation...');
        await page.waitForTimeout(10000);
        
        // Take screenshot after
        try {{
            await page.screenshot({{ path: 'after_continue.png' }});
            console.log('Screenshot saved: after_continue.png');
        }} catch(e) {{}}
        
        // Type the message
        console.log('Looking for message composer...');
        const composer = page.locator('[contenteditable="true"]').last;
        await composer.waitFor({{ timeout: 15000 }});
        
        console.log('Typing message...');
        await composer.fill(`{escaped_message}`);
        
        console.log('\\n✅ Message typed!');
        
        await browser.close();
        
    }} catch (error) {{
        console.error('Error:', error.message);
        process.exit(1);
    }}
}})();
'''
        return script
    
    def run_node_script(self, contact: Contact, message: str) -> bool:
        """Run Node.js Playwright script"""
        script_content = self.create_type_script(contact, message)
        
        temp_script = Path('./temp_type_message.js')
        temp_script.write_text(script_content, encoding='utf-8')
        
        try:
            print("\n🤖 Running automation (will wait 60 seconds for page load)...")
            print("   Do NOT press anything. Let it run...\n")
            
            result = subprocess.run(
                ['node', str(temp_script)],
                capture_output=True,
                text=True,
                timeout=120,  # 2 minute timeout
                cwd='./outreach/fbfriends'
            )
            
            if result.stdout:
                print(result.stdout)
            if result.stderr:
                print("Stderr:", result.stderr)
                
            return result.returncode == 0
            
        except subprocess.TimeoutExpired:
            print("⏱️  Script timed out")
            return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
        finally:
            if temp_script.exists():
                temp_script.unlink()
    
    def send_message_with_rate_limit(
        self,
        contacts: List[Contact],
        batch_size: int = 5,
        min_delay: int = 30,
        max_delay: int = 120,
        dry_run: bool = True
    ):
        """Send messages"""
        total = len(contacts)
        print(f"\n🎯 Messenger Outreach")
        print(f"   Total contacts: {total}")
        print(f"   Batch size: {batch_size}")
        print(f"   Mode: {'DRY RUN' if dry_run else 'LIVE'}\n")
        
        if dry_run:
            print("=" * 60)
            print("PREVIEW MODE")
            print("=" * 60 + "\n")
            
            for i, contact in enumerate(contacts[:3], 1):
                message = self.generate_message(contact)
                print(f"\n{i}. To: {contact.fb_name}")
                print(f"   Message:\n   {'-'*40}")
                for line in message.split('\n'):
                    print(f"   {line}")
                print(f"   {'-'*40}")
            return
        
        # Live mode
        sent_count = 0
        
        for i, contact in enumerate(contacts, 1):
            if batch_size > 0 and sent_count >= batch_size:
                print(f"\n✅ Batch limit reached")
                break
            
            print(f"\n{'='*60}")
            print(f"Message {i}/{total}: {contact.fb_name}")
            print(f"{'='*60}")
            
            try:
                # Launch Chrome
                messenger_url = f"https://www.messenger.com/t{contact.fb_profile_id}"
                chrome_process = self.launch_chrome(messenger_url)
                
                print("\n⏳ Chrome launched!")
                print("   Automation will wait 60 seconds for page load...")
                print("   Then click Continue button and type message.\n")
                
                # Generate message
                message = self.generate_message(contact)
                print(f"Message to send:\n{'-'*50}")
                print(message)
                print(f"{'-'*50}\n")
                
                # Run automation
                confirm = input("Start auto-type? (y/n): ").strip().lower()
                
                if confirm == 'y':
                    success = self.run_node_script(contact, message)
                    if success:
                        print("\n✅ Automation complete!")
                        sent_count += 1
                    else:
                        print("\n⚠️  Automation had issues. Check screenshots.")
                
                input("\n👉 Press ENTER when done...")
                
                # Close Chrome
                chrome_process.terminate()
                time.sleep(2)
                
            except Exception as e:
                print(f"❌ Error: {e}")
            
            # Rate limiting
            if i < len(contacts) and (batch_size == 0 or sent_count < batch_size):
                delay = random.randint(min_delay, max_delay)
                print(f"\n⏱️  Waiting {delay}s...")
                time.sleep(delay)
        
        print(f"\n{'='*60}")
        print(f"✅ Complete! Processed {sent_count} messages")
        print(f"{'='*60}\n")
    
    def interactive_menu(self):
        """Interactive menu"""
        print("\n" + "=" * 60)
        print("🎸 Messenger Skill - Profile 3")
        print("   Waits 60 seconds for page load")
        print("=" * 60)
        
        while True:
            print("\nOptions:")
            print("1. Preview messages")
            print("2. Send test to 1 contact")
            print("3. Send batch")
            print("4. Settings")
            print("5. Exit")
            
            choice = input("\nSelect (1-5): ").strip()
            
            if choice == "1":
                contacts = self.load_contacts(limit=5)
                self.send_message_with_rate_limit(contacts, dry_run=True)
                
            elif choice == "2":
                contacts = self.load_contacts(limit=1)
                if contacts:
                    self.send_message_with_rate_limit(
                        contacts, batch_size=1, dry_run=False
                    )
                else:
                    print("No contacts!")
                    
            elif choice == "3":
                batch = input("Batch size (default 5): ").strip()
                batch_size = int(batch) if batch.isdigit() else 5
                
                contacts = self.load_contacts()
                self.send_message_with_rate_limit(
                    contacts, batch_size=batch_size, dry_run=False
                )
                    
            elif choice == "4":
                print(f"\nSettings:")
                print(f"  Chrome: {CHROME_EXE}")
                print(f"  Profile: {PROFILE}")
                print(f"  CSV: {CSV_PATH}")
                print(f"  Wait time: 60 seconds")
                print(f"  Button selector: div > div > div > div[role='button']")
                
            elif choice == "5":
                print("\nGoodbye!")
                break
                
            else:
                print("Invalid choice!")


def main():
    skill = MessengerSkill()
    skill.interactive_menu()


if __name__ == "__main__":
    main()
