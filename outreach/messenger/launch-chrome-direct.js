const { exec } = require('child_process');
const path = require('path');
const os = require('os');

const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
const profilePath = path.join(userDataDir, 'Profile 3');
const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const messengerUrl = 'https://www.messenger.com/t/jvipper';

console.log('Launching Chrome directly...');
console.log('Chrome:', chromeExe);
console.log('Profile:', profilePath);
console.log('URL:', messengerUrl);

const cmd = `"${chromeExe}" --profile-directory="Profile 3" "${messengerUrl}"`;

console.log('\nCommand:', cmd);
console.log('\nLaunching...\n');

const child = exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  console.log('Chrome launched!');
});

console.log('Chrome process started with PID:', child.pid);
console.log('\nPlease handle login and PIN entry manually.');
console.log('When conversation is loaded, we can type the message.');
console.log('\nPress ENTER when ready...');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.once('data', () => {
  process.stdin.setRawMode(false);
  process.stdin.pause();
  console.log('Ready to proceed with Playwright automation...');
});
