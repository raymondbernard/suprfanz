# Workspace Structure

## Root Files
```
workspace/
├── AGENTS.md, SOUL.md, USER.md, etc.    ← Core agent files
├── run_messenger.bat                     ← Quick launcher for Messenger
├── WORKSPACE_STRUCTURE.md                ← This map
└── openclaw-workspace-state.json
```

## Outreach Campaigns (kept separate)

### outreach/email/ — Venue Booking
Scripts to email venue talent buyers about booking the band.
```
├── SEND_ALL.bat            ← Launcher
├── SEND_ALL_VENUES.py      ← Gmail automation script
└── README.md
```

### outreach/messenger/ — Facebook Messenger Outreach
Send personalized FB messages to friends about events/residency.
```
├── messenger_terminal.py          ← Main terminal app
├── run_messenger_terminal.bat     ← Launcher (kills Chrome, cleans locks)
├── send_v3.js                     ← Auto-send script (100 contacts, auto-relaunch)
├── send_simple.js                 ← Simple auto-send
├── fbfriends.csv                  ← Contact database (3123 contacts)
├── message_history.json           ← Sent history (duplicate prevention)
├── config.json                    ← Settings
└── debug_screenshots/             ← Before/after screenshots
```

### outreach/media/ — Press & Media Outreach
Send press releases + EPK to blues magazines, radio, podcasts, blogs.
```
├── media_contacts.csv     ← 105 media contacts
├── press_release.md       ← Press release + 3 email templates
├── submission_guide.md    ← How to submit to each outlet
├── send_media.py          ← Gmail sending script
├── send_media.bat        ← Launcher
└── README.md
```

### outreach/residency/ — Silvana Harlem Residency Campaign
Separate campaign for the upcoming residency at Silvana (sister to Shrine).
```
├── harlem_contacts.csv       ← 16 Harlem-specific contacts
├── residency_config.json     ← Config (venue, messaging, etc.)
└── README.md                 ← Full campaign plan + templates
```

### outreach/venues/ — Venue CSV Database
```
└── cosmic-blues-venues*.csv   ← NYC venue contact databases (10 files)
```

### outreach/docs/ — Outreach Plans & Research
```
└── *.md, *.txt               ← Plans, scripts, research notes (19 files)
```

### outreach/archive/ — Old Files
```
└── *.py, *.md, *.zip         ← Archived scripts, Facebook data dump, stage plot
```

## Other Directories
```
docs/                  ← Setup guides and summaries
memory/                ← Daily memory logs
skills/                ← Custom skills (messenger, cosmicblues, etc.)
cosmic-blues-nyc/      ← NYC venue data
cosmic-ray-epk/        ← Electronic Press Kit
venv/                  ← Python virtual environment
```