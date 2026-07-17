# Workspace Structure

## Root Files
```
workspace/
├── AGENTS.md              ← Agent instructions
├── HEARTBEAT.md           ← Heartbeat config
├── IDENTITY.md            ← Agent identity
├── README.md              ← Messenger terminal docs
├── SOUL.md                ← Agent persona
├── TOOLS.md               ← Tool notes
├── USER.md                ← User info
├── run_messenger.bat      ← Quick launcher for Messenger Terminal
├── openclaw-workspace-state.json
│
├── docs/                  ← Setup guides & summaries
├── memory/                ← Daily memory logs
├── skills/                ← Custom skills
├── cosmic-blues-nyc/      ← NYC venue data
├── cosmic-ray-epk/        ← Electronic Press Kit
├── venv/                  ← Python virtual environment
│
└── outreach/              ← All outreach work
    ├── email/             ← Email automation scripts
    ├── messenger/         ← Facebook Messenger automation
    ├── venues/            ← Venue CSV databases
    ├── docs/              ← Outreach plans & scripts
    └── archive/           ← Old files, Facebook data dump, stage plot
```

## outreach/email/
All email sending and Gmail automation scripts.
```
auto_send_all.py           send_corrected.py        send_gmail.py
omnipotent_all_venues.py   send_corrected_emails.py send_simple.py
open_chrome_simple.py      SEND_EMAILS_NOW.py       SEND_ALL.bat
open_gmail_simple.py       SEND_ALL_VENUES.py       SEND_4_EMAILS.bat
open_gmail.py              open_gmail.bat           RUN_NOW.bat
RUN_OMNIPOTENT.bat
```

## outreach/messenger/
Facebook Messenger automation terminal and all related files.
```
messenger_terminal.py      ← Main terminal app (v2.0)
run_messenger_terminal.bat ← Full launcher with checks
start_messenger.bat        ← Quick launcher
fbfriends.csv              ← Contact database
README_MESSENGER_TERMINAL.md
requirements.txt
package.json / package-lock.json
node_modules/              ← Playwright dependency
contacts/                  ← Contact CSV files
messenger_skill.py         ← Older skill (still usable)
messenger_skill_old.py     ← Original version
+ various .js test/ helper scripts
```

**Run it:** `run_messenger.bat` (from workspace root)

## outreach/venues/
Venue contact databases (CSV).
```
cosmic-blues-venues.csv              cosmic-blues-venues-NYC.csv
cosmic-blues-venues-COMPLETE.csv     cosmic-blues-venues-NYC-FINAL.csv
cosmic-blues-venues-fixed.csv        cosmic-blues-venues-NYC-ONLY.csv
cosmic-blues-venues-REPAIRED.csv     cosmic-blues-venues-new-50.csv
cosmic-blues-venues-NYC-FINAL.csv    new-venues-50-renumbered.csv
                                      nyc-venues-50-more.csv
```

## outreach/docs/
Outreach plans, scripts, and research notes.
```
MASTER-OUTREACH-PLAN.md    ALL_SOCIAL_SCRIPTS.txt    READY-TO-GO.txt
COSMICBLUES-SKILL.md       ALL_WEBFORM_CONTENT.txt   RESEARCH-RESULTS-FOUND.txt
EMAIL-TODAY.md             AUTOMATION-README.txt     REVISED-STRATEGY.md
ALL_PHONE_SCRIPTS.txt      CHECKLIST.txt             SEND_ALL_SUMMARY.txt
ALL_RESEARCH_TASKS.txt     COMPLETE-OUTREACH-ALL-VENUES.txt
DO-TODAY.txt               OUTREACH_SUMMARY.txt
NEW-VENUES.md              README.txt
```

## outreach/archive/
Old files, Facebook data export, and stage plot.
```
facebook-cosmicraymusic-*.zip   (1.9 GB Facebook data export)
stageplot.pptx                  (2.1 MB)
fix_*.py / diagnose_*.py        (old fix scripts)
ALL-EMAILS.md                   BERLIN-OUTREACH.md
COPY-PASTE-EMAILS.txt           BERLIN-VENUE.md
VENUE-RESEARCH.md
facebook-cosmicraymusic-*/      (unzipped Facebook data)
```

## docs/
Setup guides and workflow summaries.
```
BATCH_FILE_CLEANUP.md
MESSENGER_AUTOMATION_SETUP.md
MESSENGER_WORKFLOW_UPDATE.md
```