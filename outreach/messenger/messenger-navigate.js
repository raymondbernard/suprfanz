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
  console.log('🎸 Messenger Navigate Test');
  console.log('===========================\n');
  
  const tempDir = path.join(os.tmpdir(), 'fb-messenger-test-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  
  console.log('Launching Chrome...\n');
  
  const browser = await chromium.launchPersistentContext(tempDir, {
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const page = browser.pages()[0] || await browser.newPage();
  
  // Open Facebook
  console.log('1. Opening Facebook...');
  await page.goto('https://www.facebook.com', { waitUntil: 'load', timeout: 60000 });
  console.log('   Current URL:', page.url());
  console.log('   Please log in now.\n');
  
  // Wait for user to log in
  console.log('2. Waiting for login...');
  console.log('   Press ENTER when you are logged in and see your News Feed...');
  
  process.stdin.setRawMode(true);
  process.stdin.resume();
  await new Promise(resolve => process.stdin.once('data', resolve));
  process.stdin.setRawMode(false);
  process.stdin.pause();
  
  console.log('\n3. Checking login status...');
  console.log('   Current URL:', page.url());
  
  // Navigate to Messenger
  const messengerUrl = 'https://www.messenger.com/t' + CONTACT.profileId;
  console.log('\n4. Opening Messenger...');
  console.log('   URL:', messengerUrl);
  
  await page.goto(messengerUrl, { waitUntil: 'load', timeout: 60000 });
  
  console.log('   Current URL:', page.url());
  
  if (page.url().includes('login')) {
    console.log('\n   ❌ Still showing login page.');
    console.log('   You may need to complete login first.');
    return;
  }
  
  console.log('\n   ✅ Messenger conversation opened!');
  
  // Type the message
  console.log('\n5. Typing message...');
  
  try {
    const composer = page.locator('[contenteditable="true"]').last();
    await composer.waitFor({ timeout: 15000 });
    await composer.fill(MESSAGE);
    
    console.log('\n   ✅ Message typed into composer!');
    console.log('\n' + '='.repeat(50));
    console.log('MESSAGE PREVIEW:');
    console.log('='.repeat(50));
    console.log(MESSAGE);
    console.log('='.repeat(50));
    console.log('\n⚠️  Message is typed but NOT sent.');
    console.log('   Review it in the browser window.');
    console.log('   Press Enter in browser yourself if you want to send.');
    console.log('   Close browser when done.\n');
    
  } catch (error) {
    console.log('\n   ❌ Could not find message composer:', error.message);
  }
  
  // Keep browser open
  await new Promise(() => {});
  
})();
