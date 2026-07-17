const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const messengerUrl = 'https://www.messenger.com/t/jvipper';

console.log('🎸 Testing Profile 3 Visibility');
console.log('==============================\n');
console.log('Launching Chrome with Profile 3...');
console.log('Chrome:', chromeExe);
console.log('Profile:', path.join(userDataDir, 'Profile 3'));
console.log('URL:', messengerUrl);
console.log('\nIf Chrome doesn\'t appear, there may be an issue with the profile.\n');

// Launch Chrome with Profile 3
const chrome = spawn(chromeExe, [
  '--profile-directory=Profile 3',
  '--start-maximized',
  '--disable-blink-features=AutomationControlled',
  messengerUrl
], {
  detached: true,
  stdio: 'ignore'
});

console.log('Chrome started with PID:', chrome.pid);
console.log('\n⏳ Waiting 5 seconds for Chrome to open...\n');

setTimeout(() => {
  console.log('✅ Chrome should now be visible with Profile 3');
  console.log('Check your taskbar and screen for the Chrome window.');
  console.log('\nIf you see Chrome, handle login/PIN and press ENTER here...');
}, 5000);

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.once('data', () => {
  process.stdin.setRawMode(false);
  process.stdin.pause();
  console.log('\n✅ Continuing with automation...');
  // We could connect Playwright here if needed
  console.log('Process complete. Close Chrome when done.');
});
