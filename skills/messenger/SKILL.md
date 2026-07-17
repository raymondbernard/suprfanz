---
name: "messenger"
description: "Automates Facebook Messenger outreach via Playwright with Chrome debug port, Lexical editor typing, CSV contact tracking, and duplicate prevention."
user-invocable: true
---

# Messenger

## Purpose

This skill automates sending personalized Facebook Messenger messages to Facebook friends using Playwright.

The agent reads a CSV file containing Facebook user information, navigates directly to each Messenger conversation using the user's Facebook profile ID, sends a customized event invitation, and updates the CSV to prevent duplicate messaging.

---

# Data Location

All outreach data is stored at:

```text
./outreach/messenger/
```

Key files:

```text
./outreach/messenger/messenger_terminal.py   ← Main terminal app
./outreach/messenger/fbfriends.csv            ← Contact database
./outreach/messenger/message_history.json     ← Sent message history (duplicate prevention)
./outreach/messenger/config.json              ← User settings
./outreach/messenger/run_messenger_terminal.bat ← Windows launcher
```

---

# Input CSV

Open:

```text
./outreach/messenger/fbfriends.csv
```

Expected headers:

```text
fb_usr_id,fb_first_name,fb_last_name,fb_name,fb_profile_id,message_sent,sent_at,last_error
```

---

## Fields

| Field | Type | Description |
|---------|---------|------------------------------|
| fb_usr_id         | string | Internal Facebook user ID |
| fb_first_name     | string | First name |
| fb_last_name      | string | Last name |
| fb_name           | string | Display name |
| fb_profile_id     | string | Facebook profile identifier used for Messenger URL |
| message_sent      | boolean | Indicates whether a message has already been sent |
| sent_at           | string/null | UTC timestamp of successful delivery |
| last_error        | string/null | Last recorded error |

---

# Messenger URL Format

Each conversation is opened directly using:

```text
https://www.messenger.com/t/{fb_profile_id}
```

Example:

```text
https://www.messenger.com/t/jvipper
```

---

# Chrome Debug Port Setup (CRITICAL)

## Problem

Chrome's `--remote-debugging-port=9222` flag is silently ignored unless:

1. `--user-data-dir` is explicitly set to the User Data directory (NOT the profile directory)
2. `--profile-directory=Profile 3` is passed separately
3. No `LOCK` file exists in `Profile 3/`
4. No `SingletonLock`/`SingletonCookie`/`SingletonSocket` files exist in User Data

## Solution

Before launching Chrome:

### Step 1: Kill Existing Chrome

```bash
taskkill /F /IM chrome.exe /T
```

Wait 3 seconds for processes to fully exit.

### Step 2: Clean Lock Files

```python
user_data = Path.home() / "AppData" / "Local" / "Google" / "Chrome" / "User Data"

# Remove profile lock
lock_file = user_data / "Profile 3" / "LOCK"
if lock_file.exists():
    lock_file.unlink()

# Remove singleton locks
for name in ['SingletonLock', 'SingletonCookie', 'SingletonSocket']:
    p = user_data / name
    if p.exists():
        p.unlink()
```

### Step 3: Launch Chrome with Correct Flags

```python
cmd = [
    CHROME_EXE,
    f"--user-data-dir={user_data}",       # MUST be User Data dir, NOT Profile 3
    f"--profile-directory=Profile 3",      # Profile specified separately
    "--start-maximized",
    "--disable-blink-features=AutomationControlled",
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",            # Required for Playwright CDP
    "--no-first-run",
    "--no-default-browser-check",
    url
]
```

### Step 4: Wait for Debug Port

```python
import urllib.request

for i in range(15):
    time.sleep(2)
    try:
        urllib.request.urlopen("http://127.0.0.1:9222/json/version", timeout=2)
        print("Chrome is ready!")
        break
    except:
        pass
```

**IMPORTANT:** Use `http://127.0.0.1:9222` NOT `http://localhost:9222` — localhost resolves to IPv6 `::1` on some systems which causes `ECONNREFUSED`.

---

# Playwright Connection

## Connect to Running Chrome

```javascript
const { chromium } = require('playwright');

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const context = browser.contexts()[0];

// Find the messenger page (there may be multiple tabs)
let page = null;
for (const p of context.pages()) {
    try {
        if (p.url().includes('messenger.com')) { page = p; break; }
    } catch(e) {}
}
if (!page) page = context.pages()[0];
```

---

# Typing Messages into Messenger (CRITICAL)

## Problem

Messenger uses Facebook's **Lexical rich text editor**. The editor structure is:

```html
<div role="textbox" contenteditable="true">
  <div class="xzsf02u x1a2a7pz ...">
    <p class="xat24cr xdj266r" dir="auto">
      <br data-lexical-managed-linebreak="true">
    </p>
  </div>
</div>
```

### What Does NOT Work

- `locator.fill()` — Lexical ignores DOM value changes
- `locator.type()` — Unreliable with Lexical
- Setting `innerHTML` directly — Lexical doesn't pick up the change
- `execCommand('insertText')` — Inconsistent

### What DOES Work

```javascript
// 1. Find the textbox
const textbox = page.locator('div[role="textbox"]').first();
await textbox.waitFor({ timeout: 15000 });

// 2. Click to focus
await textbox.click();
await page.waitForTimeout(500);

// 3. Type using keyboard.type() — simulates real keystrokes
await page.keyboard.type(message, { delay: 10 });
```

**`page.keyboard.type()` is the ONLY reliable method** for typing into Messenger's Lexical editor.

---

# Subprocess Encoding (Windows Fix)

## Problem

On Windows, `subprocess.run()` defaults to `cp1252` encoding. Node.js Playwright outputs UTF-8 characters (checkmarks, arrows) which cause:

```
UnicodeDecodeError: 'charmap' codec can't decode byte 0x9d
```

## Solution

```python
result = subprocess.run(
    ['node', str(temp_script)],
    capture_output=True,
    text=True,
    encoding='utf-8',        # Force UTF-8
    errors='replace',        # Replace undecodable bytes
    timeout=120,
    cwd=str(DATA_DIR)
)
```

Also avoid emoji characters in Node.js console.log output — use plain ASCII like `SUCCESS:` and `ERROR:` instead of emoji.

---

# Workflow

## 1. Load Contacts

Read `./outreach/messenger/fbfriends.csv`

Only process records where `message_sent != true`.

Also check `message_history.json` to prevent sending the same event to a contact twice.

---

## 2. Select Pending Contacts

Skip contacts where:
- `message_sent == true` in CSV
- Contact exists in `message_history.json` for the current event URL

---

## 3. Generate Personalized Messages

For every contact:

- Address them using their first name
- Generate a unique message
- Rotate through psychological messaging styles:
  - Personal, Casual, Favor Request, Exciting, FOMO
  - Curious, Community, Direct, Supportive, Warm

Requirements:
- Under four sentences
- Mention the event naturally
- Include the event link
- Ask the recipient to click **Interested** on the Facebook Event page
- Avoid generating duplicate wording

---

## 4. Launch Chrome and Navigate

1. Kill existing Chrome processes
2. Clean LOCK files (Profile 3/LOCK, SingletonLock, etc.)
3. Launch Chrome with `--user-data-dir` + `--profile-directory=Profile 3` + `--remote-debugging-port=9222`
4. Wait for debug port to respond at `http://127.0.0.1:9222/json/version`
5. Chrome opens to `https://www.messenger.com/t/{fb_profile_id}`

---

## 5. Manual Continue Button

After Chrome opens the Messenger conversation:

- **WAIT for the user to press ENTER in the terminal**
- The user may need to click a "Continue" or "Continue as" button manually
- The user needs to confirm the conversation has loaded
- Do NOT auto-proceed — give the user time

---

## 6. Type Message via Playwright

Once the user presses ENTER:

1. Create a temp Node.js script
2. Connect to Chrome via CDP at `http://127.0.0.1:9222`
3. Find the messenger page among open tabs
4. Find `div[role="textbox"]` on the page
5. Click to focus it
6. Use `page.keyboard.type()` to type the message (delay: 10ms)
7. Report success/failure

---

## 7. User Reviews and Sends

After automation types the message:

- **The message is NOT sent automatically**
- The user reviews the message in Messenger
- The user manually presses Enter in Messenger to send
- The user presses Enter in the terminal to confirm

---

## 8. Update Status

After the user confirms the message was sent:

Update CSV:
```json
{
  "message_sent": "true",
  "sent_at": "2026-07-17T16:00:00Z",
  "last_error": ""
}
```

Update `message_history.json`:
```json
{
  "jvipper": [
    {
      "contact_id": "jvipper",
      "contact_name": "Johan Vipper",
      "sent_at": "2026-07-17T16:00:00",
      "message_hash": 1234567890,
      "event_url": "https://www.facebook.com/events/..."
    }
  ]
}
```

Save both files immediately.

---

## 9. Rate Limiting

Between messages, wait a configurable delay:

- Default: 30-120 seconds (randomized)
- Configurable via `config.json`
- Prevents Facebook rate limiting/blocking

---

# Duplicate Prevention (3 Layers)

1. **CSV Check**: Skip contacts where `message_sent == true`
2. **History File**: Check `message_history.json` for the current event URL
3. **Session Tracking**: Track sends during current session

To force re-send (rare):
1. Set `message_sent` to `false` in CSV
2. Remove the contact from `message_history.json`
3. Or use the "Reset History" option in the terminal

---

# Error Handling

Capture and record:
- Login required
- Messenger unavailable
- Conversation unavailable
- User blocked messaging
- Rate limiting
- Playwright timeout
- Network failures
- Chrome debug port not responding
- UnicodeDecodeError on subprocess output
- Unknown exceptions

Never mark a failed message as sent. Save the CSV immediately after recording an error.

---

# Safety Rules

- Never send a second message when `message_sent == true`
- Save progress after every successful send
- Save errors immediately
- Process contacts sequentially
- Do not retry failed contacts during the same execution
- Verify Chrome debug port before beginning
- Never overwrite an existing successful timestamp
- Preserve all existing CSV fields
- User reviews every message before it is sent
- Rate limit between messages

---

# Success Criteria

A contact is considered completed only when:

1. Chrome opens with the Messenger conversation
2. User handles any Continue/login prompts manually
3. User presses ENTER to trigger automation
4. Playwright types the message into the Lexical editor via `keyboard.type()`
5. User reviews the message in Messenger
6. User manually sends the message (presses Enter in Messenger)
7. User confirms in terminal
8. CSV record is updated
9. `message_history.json` is updated
10. Changes are written back to disk

---

# Configuration

Settings stored in `./outreach/messenger/config.json`:

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

---

# File Structure

```text
outreach/messenger/
├── messenger_terminal.py          ← Main terminal application
├── run_messenger_terminal.bat     ← Windows launcher (kills Chrome, cleans locks)
├── start_messenger.bat            ← Quick launcher
├── fbfriends.csv                  ← Contact database
├── message_history.json           ← Sent message history
├── config.json                    ← User settings
├── messenger_terminal.log         ← Activity log
├── requirements.txt               ← Dependencies
├── package.json                   ← Node.js dependencies (Playwright)
├── node_modules/                  ← Playwright
└── contacts/                      ← Contact CSV files
```
