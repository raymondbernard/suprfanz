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

async function analyzePage(page, stepName) {
  console.log(`\n📄 ${stepName} - DOM Analysis:`);
  console.log('=' .repeat(50));
  
  // Get page info
  const url = page.url();
  const title = await page.title();
  console.log(`URL: ${url}`);
  console.log(`Title: ${title}`);
  
  // Look for common login elements
  const selectors = {
    // Login form elements
    emailInput: 'input[type="email"], input[name="email"], #email',
    passwordInput: 'input[type="password"], input[name="pass"], #pass',
    loginButton: 'button[name="login"], button[type="submit"], [data-testid="royal_login_button"]',
    
    // Cookies/Consent
    acceptCookies: '[data-testid="cookie-policy-manage-dialog-accept-button"], button[data-cookiebanner="accept_button"], button[title="Allow all cookies"]',
    
    // Notifications
    enableNotifications: '[aria-label="Allow"], button:has-text("Turn On"), button:has-text("Allow")',
    notNowNotifications: '[aria-label="Not Now"], button:has-text("Not Now")',
    
    // Two-factor auth
    twoFactorCode: 'input[name="approvals_code"], input[placeholder*="code"]',
    twoFactorSubmit: 'button[name="submit[Submit]"]',
    
    // Save login info
    saveLogin: 'button:has-text("Save")',
    dontSaveLogin: 'button:has-text("Don\'t Save"), [aria-label="Not now"]',
    
    // Other
    continueButton: 'button:has-text("Continue"), [role="button"]:has-text("Continue")',
    nextButton: 'button:has-text("Next")',
    okButton: 'button:has-text("OK"), button:has-text("Ok")'
  };
  
  const found = {};
  for (const [name, selector] of Object.entries(selectors)) {
    try {
      const element = await page.locator(selector).first();
      const visible = await element.isVisible().catch(() => false);
      if (visible) {
        const text = await element.textContent().catch(() => '');
        found[name] = text.slice(0, 50);
      }
    } catch (e) {}
  }
  
  console.log('Found elements:', Object.keys(found).length > 0 ? found : 'None detected');
  
  return { url, title, found };
}

async function handleLoginFlow(page) {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\n🔄 Login Flow Step ${attempts}`);
    
    const { url, found } = await analyzePage(page, `Step ${attempts}`);
    
    // Check if we're already logged in and at Messenger
    if (url.includes('messenger.com/t/') && !url.includes('login')) {
      console.log('\n✅ Successfully reached Messenger conversation!');
      return true;
    }
    
    // Handle cookie consent
    if (found.acceptCookies) {
      console.log('→ Clicking: Accept Cookies');
      await page.click('[data-testid="cookie-policy-manage-dialog-accept-button"]').catch(() => {});
      await page.waitForTimeout(2000);
      continue;
    }
    
    // Handle notifications prompt
    if (found.notNowNotifications) {
      console.log('→ Clicking: Not Now (Notifications)');
      await page.click('[aria-label="Not Now"]').catch(() => {});
      await page.waitForTimeout(2000);
      continue;
    }
    
    // Handle save login info
    if (found.dontSaveLogin) {
      console.log('→ Clicking: Don\'t Save (Login Info)');
      await page.click('button:has-text("Don\'t Save")').catch(() => {});
      await page.waitForTimeout(2000);
      continue;
    }
    
    // Handle two-factor auth
    if (found.twoFactorCode) {
      console.log('\n⚠️  Two-Factor Authentication Required!');
      console.log('Please enter the code in the browser and press Enter here when done...');
      process.stdin.setRawMode(true);
      process.stdin.resume();
      await new Promise(resolve => process.stdin.once('data', resolve));
      process.stdin.setRawMode(false);
      process.stdin.pause();
      continue;
    }
    
    // Handle email/password login
    if (found.emailInput && found.passwordInput) {
      console.log('\n⚠️  Login form detected!');
      console.log('Please enter your credentials in the browser and log in.');
      console.log('Press Enter here when you\'re logged in...');
      process.stdin.setRawMode(true);
      process.stdin.resume();
      await new Promise(resolve => process.stdin.once('data', resolve));
      process.stdin.setRawMode(false);
      process.stdin.pause();
      continue;
    }
    
    // Wait a bit and check again
    console.log('→ Waiting for page to settle...');
    await page.waitForTimeout(3000);
  }
  
  return false;
}

(async () => {
  console.log('🎸 Facebook DOM Analyzer + Messenger');
  console.log('====================================\n');
  console.log('This script will:');
  console.log('1. Analyze the DOM at each step');
  console.log('2. Click through login/cookie prompts');
  console.log('3. Open Messenger with Johan Vipper');
  console.log('4. Type message (but NOT send)\n');

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

    // Start at Facebook
    console.log('Navigating to Facebook...');
    await page.goto('https://www.facebook.com', { waitUntil: 'networkidle', timeout: 60000 });
    
    // Handle login flow
    const loggedIn = await handleLoginFlow(page);
    
    if (!loggedIn) {
      console.log('\n❌ Could not complete login flow automatically.');
      console.log('Please complete the login manually in the browser.');
      return;
    }
    
    // Navigate to Messenger
    console.log(`\nOpening Messenger for ${CONTACT.name}...`);
    const messengerUrl = `https://www.messenger.com/t${CONTACT.profileId}`;
    await page.goto(messengerUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Analyze Messenger page
    await analyzePage(page, 'Messenger Page');
    
    // Check if we're at the conversation
    if (!page.url().includes('messenger.com/t/')) {
      console.log('\n❌ Failed to open Messenger conversation.');
      return;
    }
    
    console.log('\n✅ Messenger conversation opened!');
    
    // Generate and type message
    const message = generateMessage();
    console.log('\n📝 Message to type:');
    console.log('---');
    console.log(message);
    console.log('---\n');
    
    // Find and fill the composer
    console.log('Looking for message composer...');
    const composerSelectors = [
      '[contenteditable="true"]',
      '[role="textbox"]',
      'div[contenteditable]',
      '.x1iorvi4', // Facebook's class names
      '[placeholder*="Message"]'
    ];
    
    let composer = null;
    for (const selector of composerSelectors) {
      try {
        const el = page.locator(selector).last();
        const visible = await el.isVisible().catch(() => false);
        if (visible) {
          composer = el;
          console.log(`✅ Found composer: ${selector}`);
          break;
        }
      } catch (e) {}
    }
    
    if (composer) {
      await composer.fill(message);
      console.log('\n✅ Message TYPED in composer!');
      console.log('\n⚠️  NEXT STEPS:');
      console.log('   → Review the message in the browser');
      console.log('   → Press ENTER in browser to send (if you want)');
      console.log('   → Or close browser to cancel\n');
    } else {
      console.log('\n❌ Could not find message composer.');
      console.log('Page structure may have changed.');
    }
    
    // Keep browser open
    console.log('Browser will stay open. Close it when done.');
    await new Promise(() => {});

  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
    console.log(error.stack);
  }
})();
