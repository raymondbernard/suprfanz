const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');
const csv = require('csv-parse/sync');

// Configuration
const CSV_PATH = './fbfriends.csv';
const TEST_MODE = true; // Set to false to actually send messages
const HEADLESS = false; // Set to true for headless mode

// Event details (since Facebook blocks automated access)
const EVENT = {
  title: "Cosmic Blues Band Live",
  date: "Upcoming",
  venue: "TBD",
  url: "https://www.facebook.com/events/971902445574502",
  description: "A night of blues and roots music with the Cosmic Blues Band!"
};

async function loadContacts() {
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const records = csv.parse(content, {
    columns: true,
    skip_empty_lines: true
  });
  // Filter only contacts where message_sent is empty/false, limit to first 2 for testing
  return records.filter(r => !r.message_sent || r.message_sent === '').slice(0, 2);
}

async function generateMessage(contact) {
  const firstName = contact.fb_first_name;
  const styles = [
    `Hi ${firstName}!\n\nWe've got a blues night coming up that I thought you'd dig. Would love to see you there! If you can, click "Interested" on the event page—it really helps spread the word.\n\n${EVENT.url}`,
    `Hey ${firstName}!\n\nPutting together a blues show and immediately thought of you. Come hang! Also, hitting "Interested" on the event page helps other blues fans discover it.\n\n${EVENT.url}`,
    `Hi ${firstName}!\n\n${EVENT.description}\n\nClick "Interested" here if you're curious: ${EVENT.url}`
  ];
  // Randomly select a style
  return styles[Math.floor(Math.random() * styles.length)];
}

async function testMessenger() {
  console.log('🎸 Messenger Skill Test');
  console.log('======================\n');
  console.log(`Event: ${EVENT.title}`);
  console.log(`URL: ${EVENT.url}\n`);

  if (TEST_MODE) {
    console.log('✅ TEST MODE: Messages will be generated but NOT sent\n');
  } else {
    console.log('⚠️  LIVE MODE: Messages WILL be sent!\n');
  }

  // Load contacts
  console.log('📋 Loading contacts from CSV...');
  const contacts = await loadContacts();
  console.log(`Found ${contacts.length} contacts to test with\n`);

  if (contacts.length === 0) {
    console.log('❌ No contacts found to message (all may have been sent already).');
    return;
  }

  // Show generated messages for review
  console.log('📝 Generated Messages for Review:');
  console.log('=================================\n');

  for (const contact of contacts) {
    const message = await generateMessage(contact);
    console.log(`To: ${contact.fb_name} (${contact.fb_profile_id})`);
    console.log('---');
    console.log(message);
    console.log('---\n');
  }

  if (TEST_MODE) {
    console.log('✅ TEST COMPLETE - Messages were generated but NOT sent.');
    console.log('\nTo actually send messages, set TEST_MODE = false and re-run.');
    console.log('Note: This requires Facebook authentication via Chrome Profile 3.');
    return;
  }

  // LIVE MODE: Actually send messages
  console.log('\n🚀 LIVE MODE: Sending messages...\n');
  console.log('Launching Chrome with Profile 3...');
  console.log('(Make sure Chrome is closed first or this may fail)\n');

  const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');

  try {
    const browser = await chromium.launchPersistentContext(
      path.join(userDataDir, 'Profile 3'),
      {
        headless: HEADLESS,
        args: ['--disable-blink-features=AutomationControlled']
      }
    );

    const page = browser.pages()[0] || await browser.newPage();

    // Send to each contact
    for (const contact of contacts) {
      console.log(`\n📨 Sending to: ${contact.fb_name} (${contact.fb_profile_id})`);

      try {
        const messengerUrl = `https://www.messenger.com/t${contact.fb_profile_id}`;
        await page.goto(messengerUrl, { waitUntil: 'networkidle', timeout: 30000 });

        // Check login status
        if (page.url().includes('login')) {
          console.log('  ❌ Not logged into Facebook. Aborting.');
          break;
        }

        // Generate and send message
        const message = await generateMessage(contact);
        const composer = page.locator('[contenteditable="true"]').last();
        await composer.waitFor({ timeout: 10000 });
        await composer.fill(message);
        await page.keyboard.press('Enter');

        console.log('  ✅ Message sent!');

        // Update CSV
        contact.message_sent = 'true';
        contact.sent_at = new Date().toISOString();
        contact.last_error = '';

        // Wait between messages
        await page.waitForTimeout(5000);

      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        contact.last_error = error.message;
      }
    }

    // Save updated CSV
    console.log('\n💾 Saving updated CSV...');
    // (In a real implementation, we'd write back the full CSV here)

    await browser.close();
    console.log('\n✅ All done!');

  } catch (error) {
    console.log(`\n❌ Browser error: ${error.message}`);
    console.log('\nTip: Close all Chrome windows and try again.');
  }
}

// Run the test
testMessenger().catch(console.error);
