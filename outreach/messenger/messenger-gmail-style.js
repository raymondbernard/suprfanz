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
  console.log('🎸 Messenger - Gmail Style');
  console.log('==========================\n');
  
  const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  
  console.log('Opening Chrome with Profile 3...');
  console.log('Navigate through any login prompts as needed.');
  console.log('Press ENTER when you\'re in the conversation with Johan.\n');
  
  const browser = await chromium.launchPersistentContext(
    path.join(userDataDir, 'Profile 3'),
    {
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    }
  );
  
  const page = browser.pages()[0] || await browser.newPage();
  
  // Open Messenger conversation
  const messengerUrl = 'https://www.messenger.com/t' + CONTACT.profileId;
  await page.goto(messengerUrl, { waitUntil: 'load' });
  
  console.log('Opened:', messengerUrl);
  console.log('Handle any login/auth as needed...');
  console.log('\nPress ENTER when conversation is loaded...\n');
  
  process.stdin.setRawMode(true);
  process.stdin.resume();
  await new Promise(resolve => process.stdin.once('data', resolve));
  process.stdin.setRawMode(false);
  process.stdin.pause();
  
  // Type the message
  console.log('Typing message...');
  
  try {
    const composer = page.locator('[contenteditable="true"]').last();
    await composer.waitFor({ timeout: 10000 });
    await composer.fill(MESSAGE);
    
    console.log('\n✅ Message typed!');
    console.log('\n---');
    console.log(MESSAGE);
    console.log('---\n');
    console.log('Message is ready. Press Enter in browser to send, or close to cancel.\n');
    
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  // Keep open
  await new Promise(() => {});
  
})();
