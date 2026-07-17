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
  console.log('🎸 Messenger - Real Chrome Browser');
  console.log('=================================\n');
  
  const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  const profilePath = path.join(userDataDir, 'Profile 3');
  
  // Find Chrome executable
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(os.homedir(), 'AppData', 'Local', 'Google\\Chrome\\Application\\chrome.exe')
  ];
  
  let chromeExecutable = null;
  for (const p of chromePaths) {
    if (fs.existsSync(p)) {
      chromeExecutable = p;
      break;
    }
  }
  
  if (!chromeExecutable) {
    console.log('❌ Chrome executable not found. Searching...');
    console.log('Tried:', chromePaths);
    return;
  }
  
  console.log('✅ Found Chrome:', chromeExecutable);
  console.log('✅ Profile 3:', profilePath);
  console.log('\nLaunching Chrome with Profile 3...\n');
  
  try {
    const browser = await chromium.launchPersistentContext(profilePath, {
      headless: false,
      executablePath: chromeExecutable, // Use real Chrome, not Chromium
      args: [
        '--disable-blink-features=AutomationControlled',
        '--window-size=1280,900'
      ]
    });
    
    console.log('✅ Chrome launched with Profile 3!');
    
    const page = browser.pages()[0] || await browser.newPage();
    
    // Open Messenger
    const messengerUrl = 'https://www.messenger.com/t' + CONTACT.profileId;
    console.log('\nOpening:', messengerUrl);
    
    await page.goto(messengerUrl, { waitUntil: 'load', timeout: 60000 });
    
    console.log('Current URL:', page.url());
    console.log('\nHandle any login prompts, then');
    console.log('Press ENTER when conversation is loaded...\n');
    
    process.stdin.setRawMode(true);
    process.stdin.resume();
    await new Promise(resolve => process.stdin.once('data', resolve));
    process.stdin.setRawMode(false);
    process.stdin.pause();
    
    // Type message
    console.log('Typing message...');
    const composer = page.locator('[contenteditable="true"]').last();
    await composer.waitFor({ timeout: 15000 });
    await composer.fill(MESSAGE);
    
    console.log('\n✅ Message typed!');
    console.log('\n---');
    console.log(MESSAGE);
    console.log('---\n');
    console.log('Review and press Enter in browser to send.\n');
    
    await new Promise(() => {});
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
  
})();
