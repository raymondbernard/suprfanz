const { chromium } = require('playwright');
const path = require('path');
const os = require('os');

// Configuration
const CONTACT = {
  name: 'Johan Vipper',
  profileId: '/jvipper',
  firstName: 'Johan'
};

const EVENT = {
  title: "Cosmic Blues Band Live",
  url: "https://www.facebook.com/events/971902445574502",
  description: "A night of blues and roots music with the Cosmic Blues Band!"
};

function generateMessage() {
  return `Hey ${CONTACT.firstName}!\n\nPutting together a blues show and immediately thought of you. Come hang! Also, hitting "Interested" on the event page helps other blues fans discover it.\n\n${EVENT.url}`;
}

(async () => {
  console.log('🎸 Facebook Login + Messenger Test');
  console.log('==================================\n');
  console.log('Step 1: Log into Facebook (if needed)');
  console.log('Step 2: Will open Messenger with Johan Vipper');
  console.log('Step 3: Message will be typed but NOT sent\n');

  const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  
  console.log('Launching Chrome with Profile 3...\n');

  try {
    const browser = await chromium.launchPersistentContext(
      path.join(userDataDir, 'Profile 3'),
      {
        headless: false,
        args: ['--disable-blink-features=AutomationControlled']
      }
    );

    const page = browser.pages()[0] || await browser.newPage();

    // First, check Facebook login status
    console.log('Checking Facebook login status...');
    await page.goto('https://www.facebook.com', { waitUntil: 'networkidle', timeout: 30000 });

    const url = page.url();
    const isLoggedIn = !url.includes('login') && !url.includes('facebook.com/login');

    if (!isLoggedIn) {
      console.log('\n⚠️  Not logged in. Please log into Facebook now.');
      console.log('After logging in, press ENTER in this terminal to continue...\n');
      
      // Wait for user to press enter
      process.stdin.setRawMode(true);
      process.stdin.resume();
      await new Promise(resolve => process.stdin.once('data', resolve));
      process.stdin.setRawMode(false);
      process.stdin.pause();
    } else {
      console.log('✅ Already logged into Facebook!\n');
    }

    // Now open Messenger
    console.log(`Opening Messenger for ${CONTACT.name}...`);
    const messengerUrl = `https://www.messenger.com/t${CONTACT.profileId}`;
    await page.goto(messengerUrl, { waitUntil: 'networkidle', timeout: 30000 });

    if (page.url().includes('login')) {
      console.log('\n❌ Still not logged in. Please try again.');
      return;
    }

    console.log('✅ Messenger opened!\n');

    // Generate and type message
    const message = generateMessage();
    
    console.log('Message to be sent:');
    console.log('---');
    console.log(message);
    console.log('---\n');

    console.log('Typing message...');
    const composer = page.locator('[contenteditable="true"]').last();
    await composer.waitFor({ timeout: 10000 });
    await composer.fill(message);

    console.log('\n✅ Message TYPED in composer.');
    console.log('\n⚠️  NEXT STEPS:');
    console.log('   → Review the message in the browser');
    console.log('   → Press ENTER in browser to send (if you want)');
    console.log('   → Or close browser to cancel\n');

    // Keep browser open
    await new Promise(() => {});

  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
  }
})();
