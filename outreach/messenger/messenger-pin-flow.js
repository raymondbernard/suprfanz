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
  console.log('🎸 Messenger - PIN Flow');
  console.log('=======================\n');
  
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
  
  // Navigate directly to Messenger
  const messengerUrl = 'https://www.messenger.com/t' + CONTACT.profileId;
  console.log('Opening:', messengerUrl);
  
  await page.goto(messengerUrl, { waitUntil: 'load', timeout: 60000 });
  console.log('Current URL:', page.url());
  
  // Check if we need to click "Continue as Cosmic Ray"
  console.log('\nLooking for "Continue as Cosmic Ray" button...');
  
  try {
    const continueButton = page.locator('text=/Continue as/i').first();
    await continueButton.waitFor({ timeout: 10000 });
    
    console.log('✅ Found "Continue as" button!');
    console.log('Clicking it now...');
    await continueButton.click();
    
    console.log('\n⏳ Waiting for PIN popup...');
    console.log('Please enter the PIN (zeros + 7) in the browser.');
    console.log('Press ENTER here when you\'ve entered the PIN...\n');
    
    process.stdin.setRawMode(true);
    process.stdin.resume();
    await new Promise(resolve => process.stdin.once('data', resolve));
    process.stdin.setRawMode(false);
    process.stdin.pause();
    
  } catch (e) {
    console.log('No "Continue as" button found (may already be logged in or different page)');
  }
  
  // Wait for conversation to load
  console.log('\nWaiting for conversation to load...');
  await page.waitForTimeout(5000);
  console.log('Current URL:', page.url());
  
  if (page.url().includes('login') || page.url().includes('messenger.com/login')) {
    console.log('\n❌ Still on login page. Please complete login manually.');
    console.log('Press ENTER when conversation is loaded...');
    
    process.stdin.setRawMode(true);
    process.stdin.resume();
    await new Promise(resolve => process.stdin.once('data', resolve));
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
  
  console.log('\n✅ Ready to type message!');
  
  // Type the message
  try {
    const composer = page.locator('[contenteditable="true"]').last();
    await composer.waitFor({ timeout: 15000 });
    await composer.fill(MESSAGE);
    
    console.log('\n' + '='.repeat(50));
    console.log('MESSAGE TYPED:');
    console.log('='.repeat(50));
    console.log(MESSAGE);
    console.log('='.repeat(50));
    console.log('\n⚠️  Message is in composer but NOT sent.');
    console.log('   Review it and press Enter yourself to send.');
    console.log('   Or close browser to cancel.\n');
    
  } catch (error) {
    console.log('\n❌ Could not find message composer:', error.message);
  }
  
  // Keep browser open
  await new Promise(() => {});
  
})();
