# Cosmic Blues Venue Outreach Skill

**Version:** 1.0  
**Created:** 2026-07-14  
**Purpose:** Systematic venue outreach for Cosmic Ray's flexible blues lineup

---

## Overview

This skill manages venue outreach for Cosmic Ray — a NYC-based cosmic blues project with flexible configurations (solo to full band). The approach matches venue size with appropriate lineup.

---

## Core Principles

1. **Right size for the right room** — Solo for 75-cap rooms, full band for 300-cap
2. **Self-contained** — Band hauls own gear, minimal house requirements
3. **Rotating pool** — NYC players, flexible availability
4. **B.B. King's cred** — Lead with ~10 years as Resident Band Leader

---

## Configurations

| Format | Lineup | Best For | Tech Needs |
|--------|--------|----------|------------|
| **Solo** | Guitar/vocals + pedalboard | 50-100 cap, listening rooms | Self-contained PA, 6×6 ft, 20 min setup |
| **Duo** | + bass OR drums | 75-150 cap, small clubs | Self-contained or minimal house PA |
| **Trio** | + bass + drums | 100-200 cap, standard clubs | House PA required, 10×8 ft, 45 min setup |
| **Full Band** | + keys | 150+ cap, festivals | House PA required, 12×8 ft, full backline |

---

## Venue Database

**File:** `outreach/cosmic-blues-venues.csv`

### Venue Types
- **CONFIRMED** — Already booked (e.g., Otto's Shrunken Head)
- **HISTORICAL** — Former venues, closed (e.g., B.B. King's)
- **FIT** — Active targets for outreach

### Venue Columns
```
rank,venue,address,borough,type,website,status,date_contacted,booking_contact,notes
```

---

## EPK Components

### Required Files
- `cosmic-ray-EPK.html` — Print-ready with logo, photos, all info
- `cosmic-ray-EPK.md` — Markdown version for copy-paste
- Logo file (PNG)
- 5+ past event photos

### Key Info
- **Phone:** 929-361-7136
- **Email:** cosmicraymusic@gmail.com
- **Instagram:** @cosmicbluesband
- **Live clip:** https://www.youtube.com/watch?v=XKqRV3OGQdo

---

## Outreach Templates

### Subject Line Formula
```
[Configuration] cosmic blues — booking window for [MONTH RANGE]
```

### Email Body Structure
1. **Opening** — Former B.B. King's cred + why this venue
2. **Configuration** — Match to room size
3. **Booking window** — 2-4 month range
4. **Set details** — Length, rider, gear
5. **Links** — Live clip, Instagram
6. **Close** — Call to action + contact info

### Example (Solo for 75-cap room)
```
Hi,

I run a cosmic blues project out of NYC — former Resident Band Leader at 
B.B. King's Blues Club (~10 years). [VENUE] is exactly the kind of room 
I built this for.

For a room your size, I pitch solo: guitar/vocals + pedalboard, 
self-contained PA, raw and intimate.

Booking window: [MONTH RANGE]. 60–90 min sets. Minimal rider.

Live clip: https://www.youtube.com/watch?v=XKqRV3OGQdo
Instagram: @cosmicbluesband

Would you be the right person to send a full EPK?

Thanks,
Ray
929-361-7136
cosmicraymusic@gmail.com
```

---

## Sending Strategy

### Tier 1: Confirmed Emails (Send First)
- Terra Blues — Solo
- The Bitter End — Duo/Trio
- Blue Note — Trio/Full Band

### Tier 2: Website Forms (Send Second)
- The Iridium, Smoke Jazz, Cafe Wha?
- Arlene's, Cutting Room, Bowery Electric
- Drom, The Bell House, Barbes

### Tier 3: New Venues (Send Third)
- The Red Lion, Skinny Dennis, Sunny's Bar
- Pete's Candy Store, Zinc Bar
- Smalls, Mezzrow, Way Station, Union Pool, Good Room

### Tier 4: Verify First
- 55 Bar (may be closed)
- The Groove (no website)
- Rockwood Music Hall (domain issues)

---

## Follow-Up Timeline

| Week | Action |
|------|--------|
| 1 | Send Tier 1 (confirmed emails) |
| 2 | Submit Tier 2 (website forms) |
| 3 | Follow-up calls to Tier 1 if no response |
| 4 | Send Tier 3 (new venues) |
| After show | "Just played [venue]" update to all |

---

## Tools

### Required
- `web_fetch` — Research venue websites
- `write` — Create EPK files, outreach templates
- `edit` — Update CSV, existing files
- `exec` — List directory contents

### Optional
- `web_search` — Find new venues (rate-limited)
- `read` — Load venue images, existing files

---

## Safety Guidelines

**⚠️ CRITICAL:** Per AGENTS.md Red Lines:
- **NEVER** send emails without explicit user approval
- **ALWAYS** wait for "approve sending to [venues]" command
- **PREPARE** everything, then await send signal

---

## Outputs

### Generated Files
1. `cosmic-ray-EPK.html` — Print-ready EPK
2. `cosmic-ray-EPK.md` — Markdown EPK
3. `cosmic-blues-venues.csv` — Venue database
4. `cosmic-ray-venue-outreach-COMPLETE.md` — All mailto: links
5. `additional-nyc-venues-suggested.md` — Research notes

### Current Counts
- **Total venues:** 31
- **Ready to send:** 25
- **Verify first:** 3
- **Already booked:** 1 (Otto's)
- **Closed:** 1 (B.B. King's)

---

## Updates

### v1.0 (2026-07-14)
- Initial venue list: 20 venues
- Added 10 new venues (The Red Lion, Skinny Dennis, etc.)
- Flexible lineup approach (solo to full band)
- Complete mailto: templates for 25 venues
- EPK with logo, photos, all contact info

---

## Related

- EPK Files: `outreach/cosmic-ray-EPK.*`
- Venue Database: `outreach/cosmic-blues-venues.csv`
- Outreach Templates: `outreach/cosmic-ray-venue-outreach-COMPLETE.md`
