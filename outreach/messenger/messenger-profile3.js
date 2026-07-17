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
  console.log('🎸 Messenger Test - Profile 3');
  console.log('==============================\n');
  
  const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  
  console.log('Launching Chrome with Profile 3...\n');
  
  const browser = await chromium.launchPersistentContext(
    path.join(userDataDir, 'Profile 3'),
    {
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    }
  );
  
  const page = browser.pages()[0] || await browser.newPage();
  
  // Open Facebook first to check login
  console.log('1. Opening Facebook...');
  await page.goto('https://www.facebook.com', { waitUntil: 'load', timeout: 60000 });
  console.log('   URL:', page.url());
  
  if (page.url().includes('login')) {
    console.log('\n   ⚠️  Not logged in. Please log in now.');
    console.log('   Press ENTER when logged in...');
    
    process.stdin.setRawMode(true);
    process.stdin.resume();
    await new Promise(resolve => process.stdin.once('data', resolve));
    process.stdin.setRawMode(false);
    process.stdin.pause();
  } else {
    console.log('   ✅ Already logged in!');
  }
  
  // Navigate to Messenger
  const messengerUrl = 'https://www.messenger.com/t' + CONTACT.profileId;
  console.log('\n2. Opening Messenger...');
  console.log('   URL:', messengerUrl);
  
  await page.goto(messengerUrl, { waitUntil: 'load', timeout: 60000 });
  console.log('   Current URL:', page.url());
  
  if (page.url().includes('login')) {
    console.log('\n   ❌ Login required for Messenger.');
    return;
  }
  
  console.log('   ✅ Messenger opened!');
  
  // Type the message
  console.log('\n3. Typing message...');
  
  try {
    const composer = page.locator('[contenteditable="true"]').last();
    await composer.waitFor({ timeout: 15000 });
    await composer.fill(MESSAGE);
    
    console.log('   ✅ Message typed!');
    console.log('\n' + '='.repeat(50));
    console.log('MESSAGE:');
    console.log('='.repeat(50));
    console.log(MESSAGE);
    console.log('='.repeat(50));
    console.log('\n⚠️  Message is typed but NOT sent.');
    console.log('   You can review it in the browser.');
    console.log('   Press Enter in browser yourself to send, or close to cancel.\n');
    
  } catch (error) {
    console.log('\n   ❌ Error:', error.message);
  }
  
  // Keep browser open
  await new Promise(() => {});
  
})();
