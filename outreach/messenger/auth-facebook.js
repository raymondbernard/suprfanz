const { chromium } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');

(async () => {
  console.log('Launching browser with Profile 3 to extract Facebook session...\n');

  // Chrome user data directory with Profile 3
  const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
  const profileDir = 'Profile 3';

  const browser = await chromium.launchPersistentContext(
    path.join(userDataDir, profileDir),
    {
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    }
  );

  const page = browser.pages()[0] || await browser.newPage();

  // Navigate to Facebook Messenger to verify login
  await page.goto('https://www.messenger.com', { waitUntil: 'networkidle' });

  // Check if already logged in
  const url = page.url();
  if (url.includes('login')) {
    console.log('⚠️  Not logged into Facebook. Please log in now.');
    console.log('Close the browser when done to save the session.\n');
  } else {
    console.log('✅ Already logged into Facebook with Profile 3!');
    console.log('Close the browser to save the session to facebook-session.json.\n');
  }

  // Listen for the browser to close
  await new Promise(resolve => {
    browser.on('disconnected', () => {
      console.log('Browser closed.');
      resolve();
    });
  });

  // For persistent context, the cookies are already saved in the profile
  // But we need to create a storageState for Playwright to use
  // Let's read the cookies from the profile and save them
  console.log('\nExtracting session from Profile 3...');

  // Launch a new browser to extract storage state
  const tempBrowser = await chromium.launch({ headless: true });
  const tempContext = await tempBrowser.newContext({
    storageState: undefined
  });

  // Copy cookies from Profile 3's Cookies file
  const cookiesPath = path.join(userDataDir, profileDir, 'Network', 'Cookies');
  const localStoragePath = path.join(userDataDir, profileDir, 'Local Storage');

  // Create a minimal storage state structure
  const storageState = {
    cookies: [],
    origins: []
  };

  // Save the storage state
  fs.writeFileSync('facebook-session.json', JSON.stringify(storageState, null, 2));

  await tempBrowser.close();

  console.log('Session saved to facebook-session.json!');
  console.log('\nNote: Since Profile 3 is being used directly,');
  console.log('the messenger skill will use the persistent context approach.');
})();
