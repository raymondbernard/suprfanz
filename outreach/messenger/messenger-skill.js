const { exec } = require('child_process');
const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');
const csv = require('csv-parse/sync');
const csvStringify = require('csv-stringify/sync');

// Configuration
const CSV_PATH = './fbfriends.csv';
const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
const PROFILE = 'Profile 3';

// Event details (to be fetched or provided)
let EVENT = {
  title: "Cosmic Blues Band Live",
  url: "",
  description: "A night of blues and roots music with the Cosmic Blues Band!"
};

async function loadContacts() {
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const records = csv.parse(content, {
    columns: true,
    skip_empty_lines: true
  });
  return records.filter(r => !r.message_sent || r.message_sent === '' || r.message_sent === 'false');
}

function generateMessage(contact, event) {
  const firstName = contact.fb_first_name;
  const styles = [
    `Hi ${firstName}!\n\nWe've got a blues night coming up that I thought you'd dig. Would love to see you there! If you can, click "Interested" on the event page—it really helps spread the word.\n\n${event.url}`,
    `Hey ${firstName}!\n\nPutting together a blues show and immediately thought of you. Come hang! Also, hitting "Interested" on the event page helps other blues fans discover it.\n\n${event.url}`,
    `Hi ${firstName}!\n\n${event.description}\n\nClick "Interested" here if you're curious: ${event.url}`,
    `Hey ${firstName}!\n\nHope you're doing well! I've got a blues gig coming up and would love to see your face in the crowd. Mind clicking "Interested" on the event? It helps with the algorithm.\n\n${event.url}`,
    `Hi ${firstName}!\n\nLong time no see! I'm playing a blues show soon—come through if you're free. Clicking "Interested" on the event page really helps get the word out.\n\n${event.url}`
  ];
  return styles[Math.floor(Math.random() * styles.length)];
}

function launchChrome(url) {
  return new Promise((resolve, reject) => {
    const cmd = `"${CHROME_EXE}" --profile-directory="${PROFILE}" "${url}"`;
    console.log('Launching Chrome:', cmd);
    
    const child = exec(cmd, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(child);
      }
    });
    
    console.log('Chrome PID:', child.pid);
    resolve(child);
  });
}

async function waitForInput(prompt) {
  console.log('\n' + prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  await new Promise(resolve => process.stdin.once('data', resolve));
  process.stdin.setRawMode(false);
  process.stdin.pause();
}

async function typeMessage(page, contact, message) {
  console.log(`\n📝 Typing message to ${contact.fb_name}...`);
  
  try {
    const composer = page.locator('[contenteditable="true"]').last();
    await composer.waitFor({ timeout: 15000 });
    await composer.fill(message);
    
    console.log('✅ Message typed!');
    console.log('\n--- MESSAGE ---');
    console.log(message);
    console.log('---------------\n');
    console.log('Review in browser. Press Enter in browser to send, or close to skip.\n');
    
    return true;
  } catch (error) {
    console.log('❌ Error typing message:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎸 Messenger Skill - Profile 3');
  console.log('==============================\n');
  
  // Load contacts
  console.log('Loading contacts...');
  const contacts = await loadContacts();
  console.log(`Found ${contacts.length} contacts to message\n`);
  
  if (contacts.length === 0) {
    console.log('No contacts to message. Exiting.');
    return;
  }
  
  // Get event URL
  // For now using the one from earlier
  EVENT.url = "https://www.facebook.com/events/971902445574502";
  
  // Select first contact for test
  const contact = contacts[0];
  console.log(`Testing with: ${contact.fb_name} (${contact.fb_profile_id})\n`);
  
  // Generate message
  const message = generateMessage(contact, EVENT);
  
  // Launch Chrome with Profile 3
  const messengerUrl = `https://www.messenger.com/t${contact.fb_profile_id}`;
  console.log('Opening Messenger...');
  
  await launchChrome(messengerUrl);
  
  // Wait for user to handle login
  await waitForInput('Handle any login/PIN prompts, then press ENTER when conversation is loaded...');
  
  // Now connect with Playwright to type message
  console.log('\nConnecting to Chrome...');
  
  try {
    // Connect to the running Chrome instance via CDP
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages()[0];
    
    // Type the message
    await typeMessage(page, contact, message);
    
    // Wait for user to send or skip
    await waitForInput('Press ENTER when done (message sent or skipped)...');
    
    // Update CSV if sent (user confirms)
    console.log('\nDid you send the message? (y/n)');
    // In real implementation, we'd ask and update CSV
    
    await browser.close();
    
  } catch (error) {
    console.log('Note: Could not connect via CDP. Message must be typed manually.');
    console.log('\nPlease copy and paste this message:');
    console.log('---');
    console.log(message);
    console.log('---\n');
  }
  
  console.log('✅ Test complete!');
}

main().catch(console.error);
