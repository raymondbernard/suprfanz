# Email Outreach - SEND_ALL_VENUES

Automated email outreach for Cosmic Blues Band venue booking using Gmail and Playwright.

---

## Quick Start

```batch
cd outreach\email
SEND_ALL.bat
```

Or directly:

```bash
cd outreach\email
python SEND_ALL_VENUES.py
```

---

## What It Does

1. Loads venue contacts from `outreach/venues/cosmic-blues-venues.csv`
2. Categorizes venues by contact method (email, phone, web form, social)
3. Kills Chrome and cleans lock files
4. Launches Chrome with Profile 3 + remote debugging
5. Opens Gmail compose for each venue
6. Fills in subject and body automatically
7. Waits for user confirmation before sending
8. Updates CSV to track contacted venues (prevents duplicates)

---

## File Structure

```
outreach/email/
├── SEND_ALL.bat            ← Launcher (double-click this)
└── SEND_ALL_VENUES.py      ← Main script (21KB)
```

Supporting files (outside this folder):

```
outreach/venues/cosmic-blues-venues.csv   ← Venue contact database
outreach/archive/                         ← Old/redundant scripts archived here
```

---

## Prerequisites

- **Python 3.7+**
- **Playwright** (`pip install playwright` or `npm install playwright`)
- **Google Chrome** installed at `C:\Program Files\Google\Chrome\Application\chrome.exe`
- **Chrome Profile 3** with Gmail logged in

---

## Chrome Debug Port Setup

The script handles this automatically:

1. Kills all Chrome processes (`taskkill /F /IM chrome.exe /T`)
2. Removes lock files (`Profile 3/LOCK`, `SingletonLock`, `SingletonCookie`, `SingletonSocket`)
3. Launches Chrome with:
   - `--user-data-dir` pointing to Chrome User Data directory
   - `--profile-directory=Profile 3`
   - `--remote-debugging-port=9222`
   - `--remote-allow-origins=*`
4. Waits for debug port to respond at `http://127.0.0.1:9222`

**Note:** The `LOCK` file in Profile 3 must be removed before launching or Chrome will silently ignore the debug port flag.

---

## CSV Format

The script reads from `outreach/venues/cosmic-blues-venues.csv`:

| Field | Description |
|-------|-------------|
| `venue` | Venue name |
| `booking_contact` | Email address (if available) |
| `type` | CONFIRMED, HISTORICAL, CLOSED (skipped) |
| `date_contacted` | Date last contacted (skipped if filled) |
| `phone` | Phone number (for phone outreach) |

---

## Workflow

```
1. Script loads CSV and categorizes venues
2. Shows summary: X emails, Y phone, Z web forms
3. Kills Chrome, cleans locks, launches with debug port
4. For each email venue:
   a. Opens Gmail compose
   b. Fills in To, Subject, Body
   c. Waits for user to review and send
   d. Updates CSV with date_contacted
5. Continues to next venue
```

---

## Configuration

The script supports:

- **Skip contacted**: Venues with `date_contacted` filled are skipped by default
- **Retry mode**: Option to include already-contacted venues
- **Auto-send mode**: Option to auto-send after 3 second delay (no manual confirm)
- **Manual mode**: Default — waits for user confirmation before each email

---

## Troubleshooting

### "Chrome not opening"
- Make sure Chrome is installed at the expected path
- Check that Profile 3 exists in `User Data`
- Try closing Chrome manually first, then run the script

### "Debug port not responding"
- The script cleans lock files automatically
- If it still fails, manually run:
  ```batch
  taskkill /F /IM chrome.exe /T
  del "%LOCALAPPDATA%\Google\Chrome\User Data\Profile 3\LOCK"
  ```
  Then run `SEND_ALL.bat` again

### "Gmail not loading"
- Make sure Gmail is logged in under Profile 3
- Try opening Chrome manually with Profile 3 first and verifying login

### "Playwright not found"
```bash
cd outreach\email
npm install playwright
```

---

## Archived Scripts

The following old scripts have been moved to `outreach/archive/`:

- `auto_send_all.py` — Older auto-send version
- `send_corrected_emails.py` — Corrected emails sender
- `send_corrected.py` — Corrected contacts sender
- `send_gmail.py` — Simple Gmail sender
- `send_simple.py` — Basic email sender
- `SEND_EMAILS_NOW.py` — Quick send version
- `open_gmail.py` — Gmail opener with Playwright
- `open_gmail_simple.py` — Simple Gmail opener
- `omnipotent_all_venues.py` — All-venues automation
- `open_chrome_simple.py` — Simple Chrome launcher
- `open_gmail.bat`, `RUN_NOW.bat`, `RUN_OMNIPOTENT.bat`, `SEND_4_EMAILS.bat` — Old launchers

All functionality is now consolidated in `SEND_ALL_VENUES.py`.

---

**Version**: 2.0  
**Last Updated**: 2026-07-17  
**Author**: Cosmic Ray Digital Assistant