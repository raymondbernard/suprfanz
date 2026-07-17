const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CONTACT = {
  name: 'Johan Vipper',
  profileId: '/jvipper',
  firstName: 'Johan'
};

const EVENT = {
  url: "https://www.facebook.com/events/971902445574502"
};

const MESSAGE = `Hey Johan!

Putting together a blues show and immediately thought of you. Come hang! Also, hitting "Interested" on the event page helps other blues fans discover it.

${EVENT.url}`;

(async () => {
  console.log('🎸 Messenger Test - Fresh Browser');
  console.log('==================================\n');
  console.log('This will open a fresh Chrome browser (not Profile 3)');
  console.log('You\'ll need to log into Facebook manually\n');
  
  // Create temp user data dir
  const tempDir = path.join(os.tmpdir(), 'fb-messenger-test-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  
  console.log('Launching fresh Chrome browser...');
  
  const browser = await chromium.launchPersistentContext(tempDir, {
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const page = browser.pages()[0] || await browser.newPage();
  
  // Open Facebook
  console.log('Opening Facebook...');
  await page.goto('https://www.facebook.com', { waitUntil: 'load', timeout: 60000 });
  
  console.log('\n✅ Browser opened!');
  console.log('Please log into Facebook now.');
  console.log('\nPress ENTER here when logged in...');
  
  // Wait for user
  process.stdin.setRawMode(true);
  process.stdin.resume();
  await new Promise(resolve => process.stdin.once('data', resolve));
  process.stdin.setRawMode(false);
  process.stdin.pause();
  
  // Go to Messenger
  console.log('\nOpening Messenger...');
  await page.goto('https://www.messenger.com/t' + CONTACT.profileId, { waitUntil: 'load' });
  
  if (page.url().includes('login')) {
    console.log('❌ Not logged in. Please log in first.');
    await browser.close();
    return;
  }
  
  // Type message
  console.log('Typing message...');
  const composer = page.locator('[contenteditable="true"]').last();
  await composer.waitFor({ timeout: 10000 });
  await composer.fill(MESSAGE);
  
  console.log('\n✅ Message typed!');
  console.log('Review in browser. Press Enter to send or close browser to cancel.');
  console.log('\nMessage:');
  console.log('---');
  console.log(MESSAGE);
  console.log('---\n');
  
  // Keep open
  await new Promise(() => {});
  
})();
