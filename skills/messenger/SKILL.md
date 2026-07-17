---
name: "messenger"
description: "Automates Facebook Messenger outreach via Playwright with Chrome debug port, Lexical editor typing, CSV tracking, and duplicate prevention."
user-invocable: true
---

# Messenger

## Purpose

Automates sending personalized Facebook Messenger messages to Facebook friends using Playwright. Reads contacts from CSV, navigates to each conversation, types customized event invitations, and tracks delivery to prevent duplicates.

---

# Data Location

```text
./outreach/messenger/
├── messenger_terminal.py          ← Main terminal application
├── run_messenger_terminal.bat     ← Windows launcher (kills Chrome, cleans locks FIRST)
├── fbfriends.csv                  ← Contact database
├── message_history.json           ← Sent message history (duplicate prevention)
├── config.json                    ← User settings
├── package.json                   ← Node.js dependencies (Playwright)
└── contacts/                      ← Contact CSV files
```

---

# Input CSV

```text
fb_usr_id,fb_first_name,fb_last_name,fb_name,fb_profile_id,message_sent,sent_at,last_error
```

The `fb_profile_id` may have a leading `/` (e.g. `/jvipper`) — the code strips this when matching.

---

# CRITICAL: Chrome Debug Port Setup

## Why Chrome Won't Open the Debug Port

Chrome silently ignores `--remote-debugging-port=9222` if ANY of these are true:

1. **`--user-data-dir` is NOT set** — Chrome ignores the debug port entirely
2. **`LOCK` file exists** in `Profile 3/` — stale lock from previous session
3. **`DevToolsActivePort` file exists** in `Profile 3/` — Chrome thinks port is already active
4. **`SingletonLock`/`SingletonCookie`/`SingletonSocket` exist** in User Data
5. **Chrome is already running** without the debug port — new instance attaches to old process
6. **`Current Session`/`Current Tabs` files exist** — Chrome restores old tabs (causes junk tabs)

## The Complete Fix (in the .bat file BEFORE Python starts)

### Step 1: Kill ALL Chrome Processes

```batch
taskkill /F /IM chrome.exe /T >nul 2>&1
timeout /t 5 /nobreak >nul
powershell -Command "Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force" >nul 2>&1
timeout /t 3 /nobreak >nul
```

Must wait **at least 5 seconds** — Chrome takes a long time to release the LOCK file.

### Step 2: Delete ALL Lock and Session Files

```batch
set "UD=%LOCALAPPDATA%\Google\Chrome\User Data"
set "P3=%UD%\Profile 3"

if exist "%P3%\LOCK" del /f /q "%P3%\LOCK" >nul 2>&1
if exist "%P3%\DevToolsActivePort" del /f /q "%P3%\DevToolsActivePort" >nul 2>&1
if exist "%P3%\Current Session" del /f /q "%P3%\Current Session" >nul 2>&1
if exist "%P3%\Current Tabs" del /f /q "%P3%\Current Tabs" >nul 2>&1
if exist "%UD%\SingletonLock" del /f /q "%UD%\SingletonLock" >nul 2>&1
if exist "%UD%\SingletonCookie" del /f /q "%UD%\SingletonCookie" >nul 2>&1
if exist "%UD%\SingletonSocket" del /f /q "%UD%\SingletonSocket" >nul 2>&1
```

### Step 3: Launch Chrome from Python using PowerShell Start-Process

**`subprocess.Popen` with a list does NOT work for launching Chrome on Windows.** The ONLY reliable method is PowerShell's `Start-Process`:

```python
user_data = str(Path.home() / "AppData" / "Local" / "Google" / "Chrome" / "User Data")

args_str = f"--user-data-dir={user_data} --profile-directory={PROFILE} --start-maximized --disable-blink-features=AutomationControlled --remote-debugging-port=9222 --remote-allow-origins=* --no-first-run --no-default-browser-check --no-restore-last-session {url}"

subprocess.Popen([
    'powershell', '-Command',
    f"Start-Process -FilePath '{CHROME_EXE}' -ArgumentList '{args_str}'"
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
```

### Step 4: Wait for Debug Port

```python
for i in range(20):
    time.sleep(2)
    try:
        urllib.request.urlopen("http://127.0.0.1:9222/json/version", timeout=2)
        print(f"Chrome is ready! ({(i+1)*2}s)")
        break
    except:
        pass
```

**IMPORTANT:** Use `http://127.0.0.1:9222` NOT `http://localhost:9222`.

---

# CRITICAL: Check Chrome Before Each Contact

Before processing each contact, check if Chrome is still alive:

```python
def is_chrome_connected(self) -> bool:
    try:
        urllib.request.urlopen("http://127.0.0.1:9222/json/version", timeout=3)
        return True
    except:
        return False

def ensure_chrome_open(self, url: str = None):
    if self.is_chrome_connected():
        return True
    print("Chrome was closed! Relaunching...")
    if url:
        self.launch_chrome(url)
    else:
        self.launch_chrome("https://www.messenger.com")
    return self.is_chrome_connected()
```

If Chrome was closed (user accidentally closed it, crash, etc.), it automatically relaunches and continues from where it left off.

---

# CRITICAL: Keep Chrome Open for Entire Batch

**Do NOT open and close Chrome for each contact.** Chrome launches ONCE at batch start and stays open. For each contact, Playwright navigates the existing tab to the new conversation URL.

---

# CRITICAL: Typing into Messenger's Lexical Editor

## The Editor Structure

```html
<div role="textbox" contenteditable="true">
  <div class="xzsf02u x1a2a7pz ...">
    <p class="xat24cr xdj266r" dir="auto">
      <br data-lexical-managed-linebreak="true">
    </p>
  </div>
</div>
```

## What Does NOT Work

- `locator.fill()` — Lexical ignores DOM value changes
- `locator.type()` — Unreliable with Lexical
- Setting `innerHTML` directly — Lexical doesn't pick up the change
- `execCommand('insertText')` — Inconsistent

## What DOES Work

```javascript
const textbox = page.locator('div[role="textbox"]').first();
await textbox.waitFor({ timeout: 8000 });
await textbox.click();
await page.waitForTimeout(500);
await page.keyboard.type(message, { delay: 10 });
```

**`page.keyboard.type()` is the ONLY reliable method.**

---

# CRITICAL: Subprocess Encoding (Windows)

```python
result = subprocess.run(
    ['node', str(temp_script)],
    capture_output=True,
    text=True,
    encoding='utf-8',
    errors='replace',
    timeout=30,
    cwd=str(DATA_DIR)
)
```

Avoid emoji in Node.js console.log — use plain ASCII.

---

# CRITICAL: CSV Profile ID Matching

The CSV may store `fb_profile_id` with a leading `/` (e.g. `/jvipper`). The Contact object strips this. When updating CSV, match by stripping `/` from both sides:

```python
row_profile = row.get('fb_profile_id', '').lstrip('/')
contact_profile = contact.fb_profile_id.lstrip('/')
if row_profile == contact_profile and row_profile:
    # update this row
```

Without this fix, CSV updates silently fail because `/jvipper != jvipper`.

---

# Playwright Navigation to Each Contact

Playwright navigates the existing Chrome tab to each contact's URL:

```javascript
await page.goto(messenger_url, { waitUntil: 'domcontentloaded', timeout: 10000 })
    .catch(e => { console.log('Navigation slow, continuing anyway...'); });
await page.waitForTimeout(2000);
```

Timeouts:
- Navigation: 10 seconds (catches errors, continues)
- Composer search: 8 seconds (exits with error if not found)
- Total script: 30 seconds (Python kills if anything hangs)

---

# Playwright Connection

```javascript
const { chromium } = require('playwright');

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const context = browser.contexts()[0];

// Find the messenger page among open tabs
let page = null;
for (const p of context.pages()) {
    try {
        if (p.url().includes('messenger.com')) { page = p; break; }
    } catch(e) {}
}
if (!page) page = context.pages()[0];
```

---

# Workflow

## 1. Launch via bat file

```
run_messenger_terminal.bat
```

The bat file:
1. Kills ALL Chrome processes (waits 5+ seconds, force-kills remaining)
2. Deletes LOCK, DevToolsActivePort, Current Session, Current Tabs, Singleton files
3. Checks Python and Node.js dependencies
4. Runs `python messenger_terminal.py`

## 2. Load Contacts (Skip Already Sent)

Read `./outreach/messenger/fbfriends.csv`. Skip where:
- `message_sent == 'true'` in CSV
- Contact exists in `message_history.json` for current event URL

This provides **resume capability** — if you stop and restart, it continues where you left off.

## 3. Generate Personalized Messages

10 rotating styles: Personal, Casual, Favor Request, Exciting, FOMO, Curious, Community, Direct, Supportive, Warm.

## 4. Launch Chrome ONCE

Python uses `powershell Start-Process` to launch Chrome with debug port. Waits for port at `http://127.0.0.1:9222/json/version`.

## 5. For Each Contact

1. **Check Chrome debug port** — if closed, relaunch automatically
2. **Playwright navigates** Chrome to the contact's Messenger URL
3. User handles any Continue button manually
4. User presses ENTER in terminal
5. Playwright types message via `keyboard.type()` (10ms delay per char)
6. User reviews message in Messenger
7. User manually presses Enter in Messenger to send
8. User presses ENTER in terminal to confirm
9. **CSV updated**: `message_sent=true`, `sent_at=timestamp`
10. **message_history.json updated**: records contact + event URL + timestamp
11. **Chrome stays open** — move to next contact

## 6. Batch Complete

Terminal shows: sent count, error count. User closes Chrome manually.

---

# Duplicate Prevention (3 Layers)

1. **CSV Check**: Skip where `message_sent == 'true'`
2. **History File**: Check `message_history.json` for current event URL
3. **Session Tracking**: Track sends during current session

**Resume capability**: If you stop mid-batch and restart later, `load_contacts` automatically skips everyone already marked as sent in the CSV or history file. You continue exactly where you left off.

To force re-send: set `message_sent` to `false` in CSV AND remove from `message_history.json`, or use "Reset History" in terminal.

---

# Rate Limiting

Between messages: 30-120 seconds (randomized), configurable via `config.json`.

---

# Error Handling

- Chrome closed mid-batch → auto-relaunch and continue
- Navigation timeout (10s) → continue anyway, may still find composer
- Composer not found (8s) → mark as error, move to next contact
- Script timeout (30s) → Python kills process, mark as error
- UnicodeDecodeError → fixed with `encoding='utf-8', errors='replace'`
- Never mark a failed message as sent
- Save CSV immediately after errors

---

# Safety Rules

- Never send when `message_sent == true`
- Save CSV after every send (immediately)
- Save errors immediately
- Process sequentially
- User reviews every message before sending
- Keep Chrome open for entire batch
- Check Chrome debug port before each contact
- Rate limit between messages
- Resume from where left off on restart

---

# Configuration

```json
{
  "batch_size": 5,
  "min_delay": 30,
  "max_delay": 120,
  "page_load_wait": 60,
  "auto_confirm": false,
  "message_styles": ["personal", "casual", "exciting", "fomo", "warm"]
}
```
