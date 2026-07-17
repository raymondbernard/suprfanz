import subprocess, time, urllib.request
from pathlib import Path

CHROME_EXE = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PROFILE = 'Profile 3'
user_data = str(Path.home() / 'AppData' / 'Local' / 'Google' / 'Chrome' / 'User Data')
url = 'https://www.messenger.com/t/jvipper'

# Kill Chrome
print('1. Killing Chrome...')
subprocess.run(['taskkill', '/F', '/IM', 'chrome.exe', '/T'], capture_output=True, timeout=10)
time.sleep(3)

# Clean locks
print('2. Cleaning locks...')
lock = Path(user_data) / PROFILE / 'LOCK'
if lock.exists():
    print(f'   Removing: {lock}')
    lock.unlink()
for n in ['SingletonLock', 'SingletonCookie', 'SingletonSocket']:
    p = Path(user_data) / n
    if p.exists():
        p.unlink()

# Launch
print('3. Launching Chrome...')
cmd = [
    CHROME_EXE,
    f'--user-data-dir={user_data}',
    f'--profile-directory={PROFILE}',
    '--start-maximized',
    '--disable-blink-features=AutomationControlled',
    '--remote-debugging-port=9222',
    '--remote-allow-origins=*',
    '--no-first-run',
    '--no-default-browser-check',
    url
]
process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# Wait for port
print('4. Waiting for debug port...')
for i in range(15):
    time.sleep(2)
    try:
        urllib.request.urlopen('http://127.0.0.1:9222/json/version', timeout=2)
        print(f'   Chrome ready after {(i+1)*2}s!')
        break
    except:
        print(f'   waiting ({(i+1)*2}s)...')
else:
    print('   FAILED')