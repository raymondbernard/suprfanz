---
name: "messenger"
description: "Automates Facebook Messenger outreach via Playwright with Chrome debug port, Lexical editor typing, CSV tracking, and duplicate prevention."
user-invocable: true
---

# Messenger

## Purpose

This skill automates sending personalized Facebook Messenger messages to Facebook friends using Playwright.

The agent reads a CSV file containing Facebook user information, navigates directly to each Messenger conversation using the user's Facebook profile ID, sends a customized event invitation, and updates the CSV to prevent duplicate messaging.

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

---

# Messenger URL Format

```text
https://www.messenger.com/t/{fb_profile_id}
```

---

# CRITICAL: Chrome Debug Port Setup

## Why Chrome Won't Open the Debug Port

Chrome silently ignores `--remote-debugging-port=9222` if ANY of these are true:

1. **`--user-data-dir` is NOT set** — without this flag, Chrome ignores the debug port entirely
2. **`LOCK` file exists** in `Profile 3/` — stale lock from previous Chrome session
3. **`DevToolsActivePort` file exists** in `Profile 3/` — Chrome thinks debug port is already active
4. **`SingletonLock`/`SingletonCookie`/`SingletonSocket` exist** in User Data
5. **Chrome is already running** without the debug port flag — new instance attaches to old process
6. **`Current Session`/`Current Tabs` files exist** — Chrome tries to restore old tabs (causes junk tabs like `data/` and `0.0.0.3`)

## The Complete Fix (in the .bat file BEFORE Python starts)

### Step 1: Kill ALL Chrome Processes

```batch
taskkill /F /IM chrome.exe /T >nul 2>&1
timeout /t 5 /nobreak >nul
powershell -Command "Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force" >nul 2>&1
timeout /t 3 /nobreak >nul
```

Must wait **at least 5 seconds** — Chrome takes a long time to release the LOCK file. Force-kill any remaining processes via PowerShell.

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

**`subprocess.Popen` with a list does NOT work for launching Chrome on Windows.** The process starts but the debug port never opens. The ONLY reliable method is PowerShell's `Start-Process`:

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

**IMPORTANT:** Use `http://127.0.0.1:9222` NOT `http://localhost:9222` — localhost resolves to IPv6 `::1` on some systems which causes `ECONNREFUSED`.

---

# CRITICAL: Keep Chrome Open for Entire Batch

**Do NOT open and close Chrome for each contact.** Chrome must be launched ONCE at the start of a batch and kept open for all messages.

**Correct flow:**
1. Launch Chrome once at batch start (via `run_messenger_terminal.bat` which cleans locks first)
2. For each contact: user navigates the EXISTING Chrome tab to the new conversation URL
3. User handles any Continue/login prompts manually
4. User presses ENTER in terminal
5. Playwright types message via `keyboard.type()`
6. User reviews and sends manually
7. Move to next contact (Chrome stays open)
8. User closes Chrome when batch is done

Opening/closing Chrome per contact:
- Takes 30+ seconds per launch
- Causes Facebook to flag suspicious behavior
- Requires re-handling the Continue button each time
- Risks Chrome lock file issues on every relaunch

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
await textbox.waitFor({ timeout: 15000 });
await textbox.click();
await page.waitForTimeout(500);
await page.keyboard.type(message, { delay: 10 });
```

**`page.keyboard.type()` is the ONLY reliable method.** It simulates real keystrokes that Lexical picks up.

---

# CRITICAL: Subprocess Encoding (Windows)

Python's `subprocess.run()` defaults to `cp1252` on Windows. Node.js outputs UTF-8 which causes:

```
UnicodeDecodeError: 'charmap' codec can't decode byte 0x9d
```

**Fix:**

```python
result = subprocess.run(
    ['node', str(temp_script)],
    capture_output=True,
    text=True,
    encoding='utf-8',
    errors='replace',
    timeout=120,
    cwd=str(DATA_DIR)
)
```

Also avoid emoji in Node.js console.log — use plain ASCII like `SUCCESS:` and `ERROR:`.

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

## 2. Load Contacts

Read `./outreach/messenger/fbfriends.csv`. Skip where `message_sent == true` or contact exists in `message_history.json` for current event.

## 3. Generate Personalized Messages

10 rotating styles: Personal, Casual, Favor Request, Exciting, FOMO, Curious, Community, Direct, Supportive, Warm.

- Under four sentences
- Include event link
- Ask recipient to click "Interested" on the event page

## 4. Launch Chrome ONCE

Python uses `powershell Start-Process` to launch Chrome with debug port. Waits for port to respond at `http://127.0.0.1:9222/json/version`.

## 5. For Each Contact

1. User navigates Chrome to the contact's Messenger URL
2. User handles Continue button manually
3. User presses ENTER in terminal
4. Playwright connects via CDP, finds `div[role="textbox"]`, clicks it, types message via `keyboard.type()`
5. User reviews message in Messenger
6. User manually presses Enter in Messenger to send
7. User presses ENTER in terminal to confirm
8. CSV and `message_history.json` updated
9. **Chrome stays open** — move to next contact

## 6. Batch Complete

User closes Chrome manually. Terminal shows summary: sent count, error count.

---

# Duplicate Prevention (3 Layers)

1. **CSV Check**: Skip where `message_sent == true`
2. **History File**: Check `message_history.json` for current event URL
3. **Session Tracking**: Track sends during current session

To force re-send: set `message_sent` to `false` in CSV AND remove from `message_history.json`, or use "Reset History" in terminal.

---

# Rate Limiting

Between messages: 30-120 seconds (randomized), configurable via `config.json`.

---

# Error Handling

Capture and record: login required, Messenger unavailable, conversation unavailable, user blocked, rate limited, Playwright timeout, network failures, debug port not responding, UnicodeDecodeError, unknown exceptions.

Never mark a failed message as sent. Save CSV immediately after errors.

---

# Safety Rules

- Never send when `message_sent == true`
- Save after every send
- Process sequentially
- User reviews every message before sending
- Keep Chrome open for entire batch
- Rate limit between messages

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
