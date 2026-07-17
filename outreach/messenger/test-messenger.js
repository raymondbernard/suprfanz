const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');
const csv = require('csv-parse/sync');

// Configuration
const PROFILE_DIR = 'Profile 3';
const CSV_PATH = './fbfriends.csv';
const TEST_MODE = true; // Set to false to actually send messages

async function loadContacts() {
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const records = csv.parse(content, {
    columns: true,
    skip_empty_lines: true
  });
  return records.filter(r => r.message_sent !== 'true').slice(0, 2); // Test with first 2 contacts only
}

async function generateMessage(contact) {
  const firstName = contact.fb_first_name;
  return `Hi ${firstName}!

This is a test message from Cosmic Ray. If you're seeing this, the messenger automation is working! 🎸

No action needed - just testing the system.`;
}

async function sendMessage(page, message) {
  // Find and fill the message composer
  const composer = page.locator('[contenteditable="true"]').last();
  await composer.waitFor({ timeout: 10000 });
  await composer.fill(message);

  if (TEST_MODE) {
    console.log('  [TEST MODE] Message would be sent:');
    console.log('  ---');
    console.log('  ' + message.split('\n').join('\n  '));
    console.log('  ---');
    return true;
  } else {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    return true;
  }
}

(async () => {
  console.log('🎸 Messenger Skill Test');
  console.log('======================\n');

  if (TEST_MODE) {
    console.log('⚠️  TEST MODE: Messages will NOT be sent\n');
  } else {
    console.log('⚠️  LIVE MODE: Messages WILL be sent!\n');
  }

  // Load contacts
  console.log('Loading contacts from CSV...');
  const contacts = await loadContacts();
  console.log(`Found ${contacts.length} contacts to test with\n`);

  // Launch browser with Profile 3
  console.log('Launching Chrome with Profile 3...');
  const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');

  const browser = await chromium.launchPersistentContext(
    path.join(userDataDir, PROFILE_DIR),
    {
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    }
  );

  const page = browser.pages()[0] || await browser.newPage();

  // Test with first 2 contacts
  for (const contact of contacts) {
    console.log(`\n📨 Processing: ${contact.fb_name} (${contact.fb_profile_id})`);

    try {
      // Navigate to Messenger conversation
      const messengerUrl = `https://www.messenger.com/t${contact.fb_profile_id}`;
      console.log(`  Opening: ${messengerUrl}`);
      await page.goto(messengerUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Check if logged in
      const url = page.url();
      if (url.includes('login')) {
        console.log('  ❌ Not logged in. Please log into Facebook first.');
        break;
      }

      // Generate personalized message
      const message = await generateMessage(contact);

      // Send or preview message
      await sendMessage(page, message);

      console.log('  ✅ Success!');

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }

    // Wait between messages
    await page.waitForTimeout(3000);
  }

  console.log('\n✨ Test complete!');
  console.log('Close the browser window when ready.');

  // Keep browser open for review
  await new Promise(() => {});
})();
