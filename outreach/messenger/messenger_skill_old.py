#!/usr/bin/env python3
"""
Messenger Skill - Facebook Messenger Automation
AGGRESSIVE Continue button clicking
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
CSV_PATH = Path("./fbfriends/fbfriends.csv")


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
        """Create Node.js script that WILL click the button"""
        escaped_message = message.replace('\\', '\\\\').replace('`', '\\`').replace('$', '\\$')
        
        script = f'''const {{ chromium }} = require('playwright');

(async () => {{
    console.log('=== Messenger Automation Started ===');
    
    try {{
        const browser = await chromium.connectOverCDP('http://localhost:9222');
        const context = browser.contexts()[0];
        const page = context.pages()[0];
        
        console.log('Connected. URL:', page.url());
        
        // Wait for page to load - up to 90 seconds
        console.log('Waiting for page to load...');
        await page.waitForTimeout(30000); // Initial 30s wait
        
        let buttonClicked = false;
        let attempts = 0;
        const maxAttempts = 30; // Try for 60 more seconds (2s * 30)
        
        console.log('\\n=== LOOKING FOR CONTINUE BUTTON ===');
        
        while (!buttonClicked && attempts < maxAttempts) {{
            attempts++;
            console.log(`\\nAttempt ${{attempts}}/${{maxAttempts}}...`);
            
            // Method 1: Native XPath click in browser context
            try {{
                const clicked = await page.evaluate(() => {{
                    // Your XPath: //*[@role="button" or self::button][normalize-space()="Continue"]
                    const xpath = "//*[@role='button' or self::button][normalize-space()='Continue']";
                    const result = document.evaluate(
                        xpath, 
                        document, 
                        null, 
                        XPathResult.FIRST_ORDERED_NODE_TYPE, 
                        null
                    );
                    const btn = result.singleNodeValue;
                    
                    if (btn) {{
                        console.log('Found button:', btn.textContent.trim(), 'Tag:', btn.tagName);
                        
                        // Scroll into view
                        btn.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
                        
                        // Click it
                        btn.click();
                        return {{ success: true, text: btn.textContent.trim() }};
                    }}
                    return {{ success: false, reason: 'Not found' }};
                }});
                
                if (clicked.success) {{
                    console.log('✓✓✓ CLICKED CONTINUE BUTTON:', clicked.text);
                    buttonClicked = true;
                    break;
                }}
            }} catch (e) {{
                console.log('XPath method error:', e.message);
            }}
            
            // Method 2: Try querySelector with button text
            if (!buttonClicked) {{
                try {{
                    const clicked = await page.evaluate(() => {{
                        // Find all buttons and click one with "Continue" text
                        const allElements = document.querySelectorAll('*');
                        for (const el of allElements) {{
                            const text = el.textContent?.trim();
                            const role = el.getAttribute('role');
                            
                            if ((el.tagName === 'BUTTON' || role === 'button') && 
                                text && text.includes('Continue')) {{
                                console.log('Found by text:', text);
                                el.scrollIntoView({{ block: 'center' }});
                                el.click();
                                return {{ success: true, text: text }};
                            }}
                        }}
                        return {{ success: false }};
                    }});
                    
                    if (clicked.success) {{
                        console.log('✓✓✓ CLICKED via text search:', clicked.text);
                        buttonClicked = true;
                        break;
                    }}
                }} catch (e) {{
                    console.log('Text search error:', e.message);
                }}
            }}
            
            // Wait 2 seconds before next attempt
            await page.waitForTimeout(2000);
        }}
        
        if (!buttonClicked) {{
            console.log('\\n⚠️ WARNING: Could not click Continue button after all attempts');
        }} else {{
            console.log('\\n✓ Button clicked! Waiting 10 seconds for PIN/conversation...');
            await page.waitForTimeout(10000);
        }}
        
        // Screenshot for verification
        try {{
            await page.screenshot({{ path: 'messenger_state.png', fullPage: true }});
            console.log('Screenshot saved: messenger_state.png');
        }} catch(e) {{}}
        
        // Type the message
        console.log('\\n=== TYPING MESSAGE ===');
        try {{
            const composer = page.locator('[contenteditable="true"]').last;
            await composer.waitFor({{ timeout: 15000 }});
            await composer.fill(`{escaped_message}`);
            console.log('✓ Message typed successfully!');
        }} catch (e) {{
            console.log('Could not type message:', e.message);
        }}
        
        await browser.close();
        console.log('\\n=== DONE ===');
        
    }} catch (error) {{
        console.error('Fatal error:', error.message);
        process.exit(1);
    }}
}})();
'''
        return script
    
    def run_node_script(self, contact: Contact, message: str) -> bool:
        """Run Node.js Playwright script"""
        script_content = self.create_type_script(contact, message)
        
        temp_script = Path('./fbfriends/temp_type_message.js')
        temp_script.write_text(script_content, encoding='utf-8')
        
        try:
            print("\n🤖 Starting automation...")
            print("   Will check for Continue button every 2 seconds")
            print("   for up to 90 seconds...")
            print("   DO NOT press anything. Let it run!\n")
            
            result = subprocess.run(
                ['node', str(temp_script)],
                capture_output=True,
                text=True,
                timeout=180,
                cwd='.'
            )
            
            if result.stdout:
                print(result.stdout)
            if result.stderr:
                print("STDERR:", result.stderr)
                
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
                print("   Automation will click Continue and type message\n")
                
                # Generate message
                message = self.generate_message(contact)
                print(f"Message to send:\n{'-'*50}")
                print(message)
                print(f"{'-'*50}\n")
                
                # Run automation
                confirm = input("Start? (y/n): ").strip().lower()
                
                if confirm == 'y':
                    success = self.run_node_script(contact, message)
                    if success:
                        print("\n✅ Done!")
                        sent_count += 1
                    else:
                        print("\n⚠️  Check messenger_state.png")
                
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
        print("🎸 Messenger Skill - AGGRESSIVE MODE")
        print("   Will keep trying to click Continue button!")
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
                print(f"  Button detection: AGGRESSIVE (retries every 2s)")
                
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
