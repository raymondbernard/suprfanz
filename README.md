# Cosmic Blues Band — Outreach & Automation

Automated outreach system for the Cosmic Blues Band: Facebook Messenger, email, press releases, venue booking, and the upcoming Silvana Harlem residency.

---

## Quick Start

### Facebook Messenger (event invites to friends)
```batch
cd outreach\messenger
run_messenger_terminal.bat
```
Or auto-send 100 contacts:
```batch
cd outreach\messenger
node send_v3.js
```

### Email venue booking
```batch
cd outreach\email
SEND_ALL.bat
```

### Send press releases to media
```batch
cd outreach\media
send_media.bat
```

---

## Outreach Campaigns

Five separate campaigns, each with its own contacts, scripts, and tracking:

### 1. Facebook Messenger → `outreach/messenger/`
Sends personalized Facebook Messenger messages to NY-area friends about events.

- **Contacts:** 3,123 in `fbfriends.csv` (filtered to ~1,300 NY-area)
- **Sent today:** ~162 messages (200/day limit)
- **Features:** Auto-navigate, Continue button detection, Lexical editor typing, bad profile marking, screenshots, 4-layer duplicate prevention
- **Run:** `run_messenger_terminal.bat` or `node send_v3.js`

### 2. Venue Booking → `outreach/email/`
Emails venue talent buyers about booking the band.

- **Script:** `SEND_ALL_VENUES.py` (Gmail + Playwright automation)
- **Run:** `SEND_ALL.bat`

### 3. Press & Media → `outreach/media/`
Sends press releases + EPK to blues music media.

- **Contacts:** 105 (magazines, radio, podcasts, blogs, festivals, blues societies)
- **Includes:** Press release, 3 email pitch templates, submission guide
- **Run:** `send_media.bat`

### 4. Silvana Residency → `outreach/residency/`
Marketing campaign for the upcoming residency at Silvana Harlem (sister to Shrine).

- **Contacts:** 16 Harlem-specific (Harlem press, Facebook groups, @silvanaharlem)
- **Includes:** FB Messenger templates, social media posts, press pitches, flyer guide, doNYC/Bandsintown listing guide, community strategy, weekly checklist
- **Status:** Materials ready, waiting for residency details (day, time, start date)

### 5. Venue Database → `outreach/venues/`
CSV databases of NYC venues for booking outreach.

- 10 CSV files with venue contact info, capacity, genre fit

---

## Directory Structure

```
workspace/
├── AGENTS.md, SOUL.md, USER.md          ← Agent identity
├── run_messenger.bat                     ← Quick launcher
├── README.md                             ← This file
├── WORKSPACE_STRUCTURE.md                ← Full structure map
│
├── cosmic-ray-epk/                       ← Electronic Press Kit
│   ├── EPK.md                            ← Full press kit
│   └── index.html                        ← Web version
│
├── outreach/
│   ├── email/                            ← VENUE BOOKING
│   │   ├── SEND_ALL.bat
│   │   ├── SEND_ALL_VENUES.py
│   │   └── README.md
│   │
│   ├── messenger/                        ← FB MESSENGER
│   │   ├── messenger_terminal.py         ← Main terminal app
│   │   ├── run_messenger_terminal.bat    ← Launcher
│   │   ├── send_v3.js                    ← Auto-send (100 contacts)
│   │   ├── fbfriends.csv                 ← Contact database
│   │   ├── message_history.json          ← Duplicate prevention
│   │   ├── config.json                   ← Settings
│   │   └── debug_screenshots/            ← Screenshots
│   │
│   ├── media/                            ← PRESS & MEDIA
│   │   ├── media_contacts.csv            ← 105 contacts
│   │   ├── press_release.md              ← Press release + templates
│   │   ├── submission_guide.md           ← How to submit
│   │   ├── send_media.py                 ← Gmail sending script
│   │   ├── send_media.bat               ← Launcher
│   │   └── README.md
│   │
│   ├── residency/                        ← SILVANA RESIDENCY
│   │   ├── README.md                     ← Campaign plan
│   │   ├── harlem_contacts.csv           ← 16 Harlem contacts
│   │   ├── residency_config.json         ← Config
│   │   ├── fb_messenger_campaign.md      ← FB Messenger templates
│   │   ├── social_media_posts.md         ← Instagram/FB/Twitter/TikTok
│   │   ├── press_pitch.md                ← Press release + pitches
│   │   ├── flyer_content.md             ← Flyer design + locations
│   │   ├── donyc_bandsintown.md          ← Event listing guide
│   │   ├── community_strategy.md        ← 8 community strategies
│   │   └── weekly_checklist.md           ← Day-by-day checklist
│   │
│   ├── venues/                           ← VENUE DATABASE
│   │   └── cosmic-blues-venues*.csv      ← 10 CSV files
│   │
│   ├── docs/                             ← PLANS & RESEARCH
│   └── archive/                          ← OLD FILES
│
├── docs/                                 ← Setup guides
├── memory/                               ← Daily memory logs
├── skills/                               ← Custom skills
└── venv/                                 ← Python environment
```

---

## Key Technical Details

### Chrome Debug Port (required for Messenger + Email automation)
Chrome must be launched with `--remote-debugging-port=9222`. The bat files handle this:
1. Kill all Chrome processes
2. Delete lock files (LOCK, DevToolsActivePort, Current Session, Current Tabs, Singleton*)
3. Launch Chrome with `--user-data-dir` + `--profile-directory=Profile 3` + `--remote-debugging-port=9222`
4. Wait for port to respond at `http://127.0.0.1:9222/json/version`

### Messenger Typing (Lexical Editor)
Messenger uses Facebook's Lexical rich text editor. Only `page.keyboard.type()` works — `fill()`, `locator.type()`, and `innerHTML` do not.

### Duplicate Prevention
- CSV `message_sent` field (`true` = sent, `bad` = broken profile)
- `message_history.json` per event URL
- Session tracking
- In-conversation scan for event link before typing

### NY Location Filter
`contacts/fb_friend.csv` has location data. Contacts are filtered to NY-area only (New York, NYC, Brooklyn, Manhattan, Queens, Bronx, etc.).

### 200/Day Limit
FB Messenger script limits to 200 messages per day to avoid being blocked by Facebook.

---

## GitHub

**Repo:** https://github.com/raymondbernard/suprfanz

---

## Stats (July 17, 2026)

| Metric | Count |
|--------|-------|
| FB Messenger contacts | 3,123 (1,300 NY-area) |
| Messages sent today | ~162 |
| Media contacts | 105 |
| Harlem residency contacts | 16 |
| Venue CSVs | 10 |
| Blues societies | 26 |
| Podcasts | 9 |
| Radio stations | 10 |
| Magazines | 14 |
| Blues festivals | 6 |

---

**Author:** Cosmic Ray Digital Assistant  
**Updated:** 2026-07-17