# Facebook Messenger Automation Terminal v2.0

A robust Python terminal application for controlling Facebook Messenger outreach with comprehensive duplicate prevention, rate limiting, and detailed logging.

## 🎯 Features

### Core Functionality
- ✅ **Duplicate Prevention**: Tracks all sent messages in a JSON history file - never send the same person the same event twice
- ✅ **Batch Control**: Configurable batch sizes with customizable delays between messages
- ✅ **Dry-Run Mode**: Preview messages before sending without actually sending
- ✅ **Interactive Confirmation**: Option to review each message before sending
- ✅ **Resume Capability**: Tracks progress and can resume from where you left off
- ✅ **Comprehensive Logging**: Logs all activity to `messenger_terminal.log`

### Safety Features
- 🛡️ **CSV Status Tracking**: Updates CSV file to mark contacts as messaged
- 🛡️ **History Tracking**: Separate JSON file tracks sent messages by event
- 🛡️ **Rate Limiting**: Configurable delays (default 30-120s) between messages
- 🛡️ **Error Recovery**: Continues on errors without losing progress
- 🛡️ **Skip Protection**: Automatically skips already-messaged contacts

### Message Features
- 📝 **10 Message Styles**: Personal, Casual, Exciting, FOMO, Warm, Supportive, Community, Direct, Curious, Favor
- 📝 **Personalization**: Automatically inserts contact's first name
- 📝 **Random Selection**: Rotates through styles for variety
- 📝 **Event Link**: Automatically includes event URL

## 📁 File Structure

```
./outreach/fbfriends/
├── messenger_terminal.py          # Main application
├── run_messenger_terminal.bat     # Windows launcher
├── requirements.txt               # Python dependencies (none required)
├── fbfriends.csv                  # Your contact data
├── messenger_terminal.log         # Activity log
├── message_history.json           # Sent message history (prevents duplicates)
├── config.json                    # User settings
└── README_MESSENGER_TERMINAL.md   # This file
```

## 🚀 Quick Start

### Option 1: Windows Batch File (Recommended)
```batch
run_messenger_terminal.bat
```

### Option 2: Direct Python
```bash
cd outreach/fbfriends
python messenger_terminal.py
```

### Option 3: From Any Directory
```bash
python outreach/fbfriends/messenger_terminal.py
```

## 📋 CSV Format

Your `fbfriends.csv` must have these headers:

```csv
fb_usr_id,fb_first_name,fb_last_name,fb_name,fb_profile_id,message_sent,sent_at,last_error
```

| Field | Description |
|-------|-------------|
| `fb_usr_id` | Internal Facebook ID |
| `fb_first_name` | First name for personalization |
| `fb_last_name` | Last name |
| `fb_name` | Full display name |
| `fb_profile_id` | Facebook profile ID (used in messenger URL) |
| `message_sent` | `true` or `false` |
| `sent_at` | ISO timestamp of when sent |
| `last_error` | Last error message if failed |

### Example Data:
```csv
,Jernej,,Jernej Bervar,jernej.bervar,,,,
,Johan,,Johan Vipper,/jvipper,,,,
```

## 📊 Terminal Menu Options

### 1. Preview Messages (Dry Run)
Shows message previews without sending anything. Great for testing!

### 2. Send Test to 1 Contact
Sends a single message with full confirmation prompts.

### 3. Send Batch (with Confirmation)
Sends a batch of messages, confirming each one before sending.

### 4. Send Batch (Auto-Confirm)
Sends a batch automatically with configurable delays.

### 5. View Statistics
Shows counts of pending contacts, sent messages, errors, and configuration.

### 6. Settings
Configure:
- Batch size (default: 5)
- Min/Max delay between messages (default: 30-120s)
- Page load wait time (default: 60s)
- Auto-confirm mode
- Message styles to use
- Event title and URL

### 7. Reset History (⚠️ Danger)
Clears message history. **Only use if you want to re-message people!**

### 8. Exit
Quits the application.

## ⚙️ Configuration

Settings are stored in `config.json`:

```json
{
  "batch_size": 5,
  "min_delay": 30,
  "max_delay": 120,
  "page_load_wait": 60,
  "typing_delay": 3,
  "auto_confirm": false,
  "message_styles": ["personal", "casual", "exciting", "fomo", "warm"]
}
```

## 🛡️ Duplicate Prevention

The system prevents duplicates in **THREE** ways:

1. **CSV Check**: Reads `message_sent` field - skips if `true`
2. **History Check**: Reads `message_history.json` - skips if already sent THIS event
3. **Session Tracking**: Tracks sent messages in current session

To force re-send to someone, you need to:
1. Reset their `message_sent` to `false` in CSV, AND
2. Clear their entry from `message_history.json`

Or use the **Reset History** option (clears ALL history).

## 📜 Message History

`message_history.json` format:
```json
{
  "jvipper": [
    {
      "contact_id": "jvipper",
      "contact_name": "Johan Vipper",
      "sent_at": "2026-07-17T14:30:00",
      "message_hash": 1234567890,
      "event_url": "https://facebook.com/events/..."
    }
  ]
}
```

## 🔧 Prerequisites

1. **Python 3.7+**
2. **Node.js**
3. **Playwright** (auto-installed by batch file):
   ```bash
   npm install playwright
   ```
4. **Chrome Profile 3** with Facebook logged in

## 🎨 Message Styles

The terminal supports 10 message styles:

| Style | Vibe |
|-------|------|
| `personal` | "Thought of you..." |
| `casual` | "Hope you're doing well..." |
| `exciting` | "Big news! 🎸" |
| `fomo` | "Don't miss out!" |
| `warm` | "Thinking of you 🎶" |
| `supportive` | "Your support would mean..." |
| `community` | "Building something special..." |
| `direct` | Short and to the point |
| `curious` | "Ever been to..." |
| `favor` | "Quick favor..." |

## 📝 Log File

`messenger_terminal.log` contains:
- Application startup/shutdown
- Messages sent with timestamps
- Errors and failures
- Rate limiting delays

## 🐛 Troubleshooting

### "Chrome not found"
Edit `messenger_terminal.py` and update:
```python
CHROME_EXE = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
```

### "Profile 3 not found"
Edit `messenger_terminal.py` and change:
```python
PROFILE = "Profile 3"  # Change to your profile name
```

### "Playwright not found"
Run in `outreach/fbfriends`:
```bash
npm install playwright
```

### Messages not sending
- Make sure Facebook is logged in to Profile 3
- Check Chrome Developer Tools is enabled
- Verify the messenger URL format

## ⚠️ Important Notes

- **Always test with option 1 (Preview) first**
- **Start with small batches (1-3 contacts)**
- **Respect Facebook's rate limits** - use 30-120s delays
- **Don't spam** - this tool is for legitimate event promotion
- **Monitor for CAPTCHA** - Facebook may block automation
- **Backup your CSV** before running

## 🔄 Workflow Example

```
1. Preview messages (option 1) - verify they look good
2. Send test to 1 contact (option 2) - make sure it works
3. Send small batch of 3 (option 3) - confirm mode
4. Send larger batch of 10 (option 4) - auto mode
5. Check statistics (option 5) - see progress
6. Exit (option 8)
```

## 📞 Support

If you encounter issues:
1. Check `messenger_terminal.log`
2. Verify Chrome Profile 3 has Facebook logged in
3. Ensure CSV format matches requirements
4. Test with Preview mode first

## 🎸 Made for Cosmic Blues Band

This terminal helps promote blues events to Facebook friends while respecting their time and avoiding spam.

---

**Version**: 2.0  
**Last Updated**: 2026-07-17  
**Author**: Cosmic Ray Digital Assistant
