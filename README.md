# Facebook Messenger Automation Terminal v2.0

A robust Python terminal application for automating Facebook Messenger outreach with comprehensive duplicate prevention, rate limiting, and detailed logging.

---

## 🎯 Features

### Duplicate Prevention (3 Layers)
The system prevents sending duplicate messages through three independent checks:

1. **CSV Status Check** - Reads the `message_sent` field from your contact database
2. **Message History File** - Tracks every sent message in `message_history.json`
3. **Session Tracking** - Monitors sends during the current session

### Rate Limiting & Safety
- ✅ Configurable delays between messages (default: 30-120 seconds)
- ✅ Batch size control (default: 5 messages per batch)
- ✅ Confirmation prompts before sending
- ✅ Dry-run mode for testing
- ✅ Error recovery without losing progress

### Message Variety
- 10 unique messaging styles that rotate automatically
- Personalized with contact's first name
- Natural language with event links
- No two messages are identical

---

## 🚀 Quick Start

### Option 1: Quick Launch (Recommended)
```
run_messenger.bat
```

### Option 2: From Outreach Directory
```
cd outreach
start_messenger.bat
```

### Option 3: Direct Terminal
```bash
cd outreach\fbfriends
run_messenger_terminal.bat
```

---

## 📋 System Requirements

- **Python 3.7+**
- **Node.js** (for Playwright automation)
- **Google Chrome** with Facebook logged in (Profile 3)
- **Playwright** (auto-installed on first run)

---

## 📊 Terminal Menu

```
╔══════════════════════════════════════════════════════════════════════╗
║  FACEBOOK MESSENGER AUTOMATION TERMINAL v2.0                        ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  Status: XXX contacts pending | X sent this session                  ║
║                                                                      ║
║  MAIN MENU:                                                          ║
║                                                                      ║
║    1. Preview messages (dry run)        - Test without sending     ║
║    2. Send test to 1 contact              - Single message with confirmation
║    3. Send batch (with confirmation)      - Multiple with per-message confirm
║    4. Send batch (auto-confirm)           - Multiple with auto-send  ║
║    5. View statistics                     - See counts and config      ║
║    6. Settings                            - Configure all options    ║
║    7. Reset history (danger)              - Clear message history    ║
║    8. Exit                                - Quit application       ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 📝 Message Styles

The terminal automatically rotates through these psychological messaging styles:

| Style | Example Opening |
|-------|-----------------|
| **Personal** | "Putting together a blues show and immediately thought of you" |
| **Casual** | "Hope you're doing well! I'm organizing a blues show..." |
| **Exciting** | "Big news - we're putting together an amazing blues night!" |
| **FOMO** | "Don't miss out on this blues night we've got coming up!" |
| **Warm** | "Thinking of you and wanted to personally invite you..." |
| **Supportive** | "As a fellow music lover, I wanted to reach out..." |
| **Community** | "We're building something special with this blues show..." |
| **Direct** | "Blues show coming up - you're invited!" |
| **Curious** | "Ever been to a live blues show that just hit different?" |
| **Favor** | "Quick favor - would you mind checking out our upcoming event?" |

---

## ⚙️ Configuration

All settings are stored in `outreach/fbfriends/config.json`:

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

| Setting | Default | Description |
|---------|---------|-------------|
| `batch_size` | 5 | Number of messages per batch |
| `min_delay` | 30 | Minimum seconds between messages |
| `max_delay` | 120 | Maximum seconds between messages |
| `page_load_wait` | 60 | Seconds to wait for page load |
| `auto_confirm` | false | Skip manual confirmations |
| `message_styles` | [...] | Which styles to use |

---

## 📁 File Structure

```
workspace/
├── run_messenger.bat                    ← Quick launcher (root)
├── README.md                            ← This file
├── MESSENGER_AUTOMATION_SETUP.md        ← Setup summary
└── outreach/
    ├── start_messenger.bat              ← Launcher (delegates to terminal)
    ├── open_gmail.bat                   ← (existing email tool)
    ├── SEND_ALL.bat                     ← (existing email tool)
    └── fbfriends/
        ├── messenger_terminal.py          ← Main application
        ├── run_messenger_terminal.bat   ← Main terminal launcher
        ├── requirements.txt             ← Dependencies
        ├── README_MESSENGER_TERMINAL.md ← Full documentation
        ├── fbfriends.csv                ← Your contacts
        ├── messenger_terminal.log       ← Activity log
        ├── message_history.json         ← Sent history
        └── config.json                  ← Your settings
```

---

## 📊 CSV Format

Your `fbfriends.csv` must include these headers:

```csv
fb_usr_id,fb_first_name,fb_last_name,fb_name,fb_profile_id,message_sent,sent_at,last_error
```

| Field | Description | Example |
|-------|-------------|---------|
| `fb_usr_id` | Internal ID | (can be empty) |
| `fb_first_name` | First name for personalization | "Johan" |
| `fb_last_name` | Last name | "Vipper" |
| `fb_name` | Display name | "Johan Vipper" |
| `fb_profile_id` | Facebook profile ID | "jvipper" or "/jvipper" |
| `message_sent` | Send status | "true" or "false" |
| `sent_at` | ISO timestamp | "2026-07-17T14:30:00" |
| `last_error` | Error message | (empty if success) |

---

## 🔄 Typical Workflow

```
Step 1: Preview (Option 1)
   └─> See how messages look without sending

Step 2: Test Single (Option 2)  
   └─> Send to 1 contact with full confirmation

Step 3: Small Batch (Option 3)
   └─> Send 3 messages with per-message confirmation

Step 4: Larger Batch (Option 4)
   └─> Send 10 messages with auto-confirmation

Step 5: Check Stats (Option 5)
   └─> Verify progress

Step 6: Exit (Option 8)
```

---

## 🛡️ Safety & Ethics

- ✅ **Never spam** - Use for legitimate event promotion only
- ✅ **Respect opt-outs** - If someone asks to stop, mark them in CSV
- ✅ **Rate limiting** - Built-in delays prevent Facebook blocks
- ✅ **No repeats** - System prevents duplicate sends automatically
- ✅ **Transparency** - All activity logged for review

---

## 🐛 Troubleshooting

### "Chrome not found"
Edit line 23 in `messenger_terminal.py`:
```python
CHROME_EXE = r"C:\Path\To\Your\chrome.exe"
```

### "Profile 3 not found"
Edit line 24 in `messenger_terminal.py`:
```python
PROFILE = "Profile 2"  # Change to your profile name
```

### "Playwright not found"
```bash
cd outreach\fbfriends
npm install playwright
```

### "Permission denied"
Run as administrator or check file permissions.

### Check the logs
```
outreach\fbfriends\messenger_terminal.log
```

---

## 🎸 Made for Cosmic Blues Band

This tool helps promote blues music events to Facebook friends while maintaining respect for recipients and avoiding spam.

---

## 📄 License

This is a personal automation tool. Use responsibly and in accordance with Facebook's Terms of Service.

---

## 🆘 Support

If you encounter issues:

1. Check `messenger_terminal.log` for error details
2. Verify Chrome Profile 3 has Facebook logged in
3. Ensure CSV format matches requirements
4. Test with Preview mode first

---

**Version**: 2.0  
**Last Updated**: 2026-07-17  
**Author**: Cosmic Ray Digital Assistant
