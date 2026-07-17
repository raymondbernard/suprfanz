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
  console.log('🎸 Messenger - Verify Profile 3');
  console.log('===============================\n');
  
  const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  const profilePath = path.join(userDataDir, 'Profile 3');
  
  // Verify Profile 3 exists
  console.log('Checking Profile 3...');
  console.log('Profile path:', profilePath);
  
  if (fs.existsSync(profilePath)) {
    console.log('✅ Profile 3 folder exists\n');
  } else {
    console.log('❌ Profile 3 not found at:', profilePath);
    console.log('\nAvailable profiles:');
    const profiles = fs.readdirSync(userDataDir).filter(f => f.startsWith('Profile'));
    profiles.forEach(p => console.log('  -', p));
    return;
  }
  
  console.log('Launching Chrome with Profile 3...');
  console.log('The browser window should appear shortly.\n');
  
  try {
    const browser = await chromium.launchPersistentContext(profilePath, {
      headless: false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--window-size=1280,900',
        '--start-maximized'
      ]
    });
    
    console.log('✅ Browser launched!');
    console.log('Opening Messenger conversation...\n');
    
    const page = browser.pages()[0] || await browser.newPage();
    
    // Open Messenger
    const messengerUrl = 'https://www.messenger.com/t' + CONTACT.profileId;
    await page.goto(messengerUrl, { waitUntil: 'load', timeout: 60000 });
    
    console.log('Opened:', messengerUrl);
    console.log('Current URL:', page.url());
    console.log('\nHandle any login prompts:');
    console.log('  - Click "Continue as Cosmic Ray"');
    console.log('  - Enter PIN if needed');
    console.log('\nPress ENTER when conversation is loaded...\n');
    
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
    
    console.log('\n✅ Message typed! Review in browser.\n');
    console.log('---');
    console.log(MESSAGE);
    console.log('---\n');
    
    await new Promise(() => {});
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
    console.log(error.stack);
  }
  
})();
