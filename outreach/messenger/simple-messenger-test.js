const { chromium } = require('playwright');
const path = require('path');
const os = require('os');

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
  console.log('🎸 Simple Messenger Test');
  console.log('========================\n');
  
  const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  
  console.log('Opening Chrome with Profile 3...');
  console.log('Browser will open. Please:');
  console.log('1. Log into Facebook if needed');
  console.log('2. Navigate to: https://www.messenger.com/t' + CONTACT.profileId);
  console.log('3. Press ENTER here when ready for me to type the message\n');
  
  const browser = await chromium.launchPersistentContext(
    path.join(userDataDir, 'Profile 3'),
    {
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    }
  );
  
  const page = browser.pages()[0] || await browser.newPage();
  
  // Open Facebook first
  await page.goto('https://www.facebook.com', { waitUntil: 'networkidle' });
  
  console.log('✅ Browser opened with Facebook');
  console.log('Current URL:', page.url());
  console.log('\nPress ENTER when you are logged in and ready...');
  
  // Wait for enter key
  process.stdin.setRawMode(true);
  process.stdin.resume();
  await new Promise(resolve => process.stdin.once('data', resolve));
  process.stdin.setRawMode(false);
  process.stdin.pause();
  
  // Now go to Messenger
  console.log('\nOpening Messenger conversation...');
  await page.goto('https://www.messenger.com/t' + CONTACT.profileId, { waitUntil: 'networkidle' });
  
  console.log('Current URL:', page.url());
  
  if (page.url().includes('login')) {
    console.log('\n❌ Still not logged in. Please log in first.');
    return;
  }
  
  // Find composer and type message
  console.log('Typing message...');
  const composer = page.locator('[contenteditable="true"]').last();
  await composer.waitFor({ timeout: 10000 });
  await composer.fill(MESSAGE);
  
  console.log('\n✅ Message typed! Review in browser and press Enter to send if you want.');
  console.log('Close browser when done.\n');
  
  // Keep open
  await new Promise(() => {});
  
})();
