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
  const styles = [
    `Hi ${CONTACT.firstName}!\n\nWe've got a blues night coming up that I thought you'd dig. Would love to see you there! If you can, click "Interested" on the event page—it really helps spread the word.\n\n${EVENT.url}`,
    `Hey ${CONTACT.firstName}!\n\nPutting together a blues show and immediately thought of you. Come hang! Also, hitting "Interested" on the event page helps other blues fans discover it.\n\n${EVENT.url}`,
    `Hi ${CONTACT.firstName}!\n\n${EVENT.description}\n\nClick "Interested" here if you're curious: ${EVENT.url}`,
    `Hey ${CONTACT.firstName}!\n\nHope you're doing well! I've got a blues gig coming up and would love to see your face in the crowd. Mind clicking "Interested" on the event? It helps with the algorithm.\n\n${EVENT.url}`,
    `Hi ${CONTACT.firstName}!\n\nLong time no see! I'm playing a blues show soon—come through if you're free. Clicking "Interested" on the event page really helps get the word out.\n\n${EVENT.url}`
  ];
  return styles[Math.floor(Math.random() * styles.length)];
}

(async () => {
  console.log('🎸 Opening Messenger for ' + CONTACT.name);
  console.log('================================\n');
  console.log('⚠️  IMPORTANT: Message will be TYPED but NOT SENT');
  console.log('You can review it and hit Enter yourself if you want to send.\n');

  const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  
  console.log('Launching Chrome with Profile 3...');
  console.log('(If Chrome is running, this might fail - close Chrome first)\n');

  try {
    const browser = await chromium.launchPersistentContext(
      path.join(userDataDir, 'Profile 3'),
      {
        headless: false,
        args: ['--disable-blink-features=AutomationControlled']
      }
    );

    const page = browser.pages()[0] || await browser.newPage();

    // Navigate to Messenger
    const messengerUrl = `https://www.messenger.com/t${CONTACT.profileId}`;
    console.log('Opening: ' + messengerUrl);
    
    await page.goto(messengerUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Check if logged in
    if (page.url().includes('login')) {
      console.log('\n❌ Not logged into Facebook.');
      console.log('Please log in and then close/re-run this script.');
      return;
    }

    console.log('✅ Messenger opened successfully!\n');

    // Generate and type the message (but don't send)
    const message = generateMessage();
    
    console.log('Generated message:');
    console.log('---');
    console.log(message);
    console.log('---\n');

    console.log('Typing message into composer...');
    
    // Find and fill the message composer
    const composer = page.locator('[contenteditable="true"]').last();
    await composer.waitFor({ timeout: 10000 });
    await composer.fill(message);

    console.log('✅ Message TYPED into composer.');
    console.log('\n⚠️  IMPORTANT:');
    console.log('   - Review the message in the browser');
    console.log('   - Press ENTER yourself if you want to send it');
    console.log('   - Or close the browser to cancel\n');
    console.log('Browser will stay open. Close it when done.');

    // Keep browser open
    await new Promise(() => {});

  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
    console.log('\nTip: Make sure all Chrome windows are closed first.');
  }
})();
