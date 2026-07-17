---
name: "cosmicblues"
description: "Discover, verify, and maintain a professional booking database for the Cosmic Blues Band - searches venues that feature live blues and roots music, collects verified booking contacts, and exports to cosmicbluesvenues.csv"
---

# Cosmic Blues Venue Research and Booking Assistant

## Purpose
An OpenClaw research skill that discovers, verifies, and maintains a
professional booking database for the Cosmic Blues Band. It searches for clubs,
bars, hotels, restaurants, festivals, casinos, breweries, and other venues that
regularly feature live blues and roots music. It collects verified contact
information, booking contacts, and venue details, then exports the results to a
normalized CSV database named `cosmicbluesvenues.csv`.

## Metadata
- **Version:** 1.0.0
- **Author:** Cosmic Ray
- **Organization:** Cosmic Blues Band
- **User-invocable:** yes
- **Primary location:** New York City
- **Last updated:** 2026-07-14

## Categories
research, music, booking, contacts, lead-generation

## Keywords
blues, chicago blues, delta blues, texas blues, electric blues, live music,
venues, booking, talent buyer, entertainment manager, festivals, clubs, bars,
hotels, restaurants, casinos, breweries, jazz clubs, music venues, outreach,
crm, csv

## Capabilities
- Web research
- Contact discovery
- Venue verification
- Email collection
- Phone collection
- Address collection
- Data normalization
- Deduplication
- CSV generation
- CSV update
- **Gmail outreach automation** - Send booking inquiries via Gmail compose URLs

## Outreach Tools

### Gmail Booking Sender
A Python script that automates sending booking inquiry emails to venues via Gmail.

**Location:** `outreach/send_gmail.py`

**Features:**
- Loads venues from `cosmic-blues-venues.csv`
- Filters for FIT venues with emails not yet contacted
- Opens Gmail compose with pre-filled recipient, subject, and body
- Tracks contacted venues by updating CSV with date_contacted
- Skips CONFIRMED, HISTORICAL, CLOSED, and already-contacted venues

**Email Template:**
- Subject: "Cosmic blues booking inquiry - fall dates 2026"
- Body includes:
  - B.B. King's Resident Band Leader credentials (~10 years)
  - Cosmic blues project description
  - Flexible lineup options (solo to full band)
  - Toronto show video link
  - Contact info (phone, Instagram)

**Usage:**
```bash
cd outreach
python send_gmail.py
```

**Workflow:**
1. Script finds venues ready to contact
2. Opens Gmail compose for each venue
3. User clicks Send in Gmail
4. User returns to script and confirms
5. Script marks venue as CONTACTED with today's date

### Full Automation with Playwright
**File:** `outreach/SEND_ALL_VENUES.py`

Fully automated Gmail sending with Playwright browser control.

**Setup:**
```bash
pip install playwright
playwright install chromium
```

**Features:**
- Auto-fills Gmail compose (To, Subject, Body)
- **Auto-send mode**: Clicks Send after 3-second review delay
- **Manual mode**: Waits for your confirmation
- Updates CSV automatically after each send
- Handles errors and continues to next venue

**Usage:**
```bash
cd outreach
python SEND_ALL_VENUES.py
```

**Workflow:**
1. Script asks: "Skip venues already contacted? [Y/n]" → Press **Y**
2. Script asks: "Auto-send emails? [y/N]" → Press **y** for auto-send
3. Opens Chrome with Gmail
4. For each venue:
   - Opens compose
   - Fills recipient, subject, body
   - **Auto-send**: Waits 3 seconds, clicks Send, moves to next
   - **Manual mode**: Waits for you to type `s` (sent) or `q` (quit)
5. Marks each venue as CONTACTED in CSV

**Safety:**
- 3-second delay before auto-send (press Ctrl+C to cancel)
- Skips if Send button not found
- Continues to next venue on error
- Updates CSV only after confirmed send

## Batch Files

### Quick Gmail Send
**File:** `outreach/send_gmail.py`
Simple, reliable Gmail compose opener. No dependencies required.

### Full Automation
**File:** `outreach/send_all.bat`
Runs complete outreach suite with Playwright automation.

## Supported Locations
- United States
- Canada
- Europe

## Output
- **Default output file:** `cosmicbluesvenues.csv`
- **Output format:** CSV

### Minimum Fields
Every venue record must include these fields:
- `venue_name`
- `street_address`
- `city`
- `state`
- `zip_code`
- `booking_email`
- `phone`
- `website`

## Instructions
1. Search for venues (clubs, bars, hotels, restaurants, festivals, casinos,
   breweries, jazz clubs) that regularly feature live blues and roots music,
   prioritizing the primary location (New York City) and expanding across the
   supported locations.
2. For each candidate venue, verify it currently books live music and gather
   the booking contact (talent buyer or entertainment manager).
3. Collect and verify all minimum fields listed above.
4. Normalize the data and deduplicate against existing records.
5. Append or update entries in `cosmicbluesvenues.csv`, keeping the CSV columns
   aligned with the minimum fields.


