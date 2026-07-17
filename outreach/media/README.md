# Media Outreach — Cosmic Blues Band

## Goal

Send press release + EPK to blues music media: magazines, radio, blogs, and organizations.

## What We Have

- **EPK** — `cosmic-ray-epk/EPK.md` (full press kit with bio, photos, video clips, stage plot)
- **Press release** — `outreach/media/press_release.md` (release + 3 email pitch templates)
- **Media contacts** — `outreach/media/media_contacts.csv` (35 contacts)
- **Email sending** — `outreach/email/SEND_ALL_VENUES.py` (Gmail automation script, ready to adapt)

## Media Contacts (35 total)

| Category | Count | Examples |
|----------|-------|---------|
| Magazines | 10 | Blues Blast, Living Blues, Blues Matters, American Blues Scene, DownBeat |
| Radio | 6 | Blues Radio MRG.fm, Blues Music Fan Radio, WHCR 90.3, WBGO 88.3, SiriusXM Bluesville |
| Blogs | 7 | Rock and Blues Muse, Blues411, Making A Scene, Twangville |
| Organizations | 4 | NYC Blues Society, NY Blues Hall of Fame |
| Industry | 2 | Pollstar, Roots Music Report |

## Workflow

### 1. Personalize the pitch email for each contact
- Use the templates in `press_release.md`
- Customize with the contact's name and outlet
- Magazine editors → Template 1 (feature/review)
- Radio DJs → Template 2 (airplay/interview)
- Festivals/industry → Template 3 (booking)

### 2. Send emails
- Use the Gmail automation script in `outreach/email/`
- Or send manually with BCC for batch sends
- Attach: EPK.md + link to live video clips

### 3. Follow up
- 1 week after initial send
- Short follow-up: "Just checking in — did you have a chance to review the EPK?"

## Files

```
outreach/media/
├── media_contacts.csv    ← 35 media contacts (magazines, radio, blogs)
├── press_release.md      ← Press release + 3 email pitch templates
└── README.md             ← This file
```

## Next Steps

1. **Verify emails** — some are best-guess; verify via website contact pages
2. **Add more contacts** — search for more blues bloggers, podcasters, YouTubers
3. **Prepare attachments** — PDF version of EPK, 2-3 high-res photos
4. **Send batch** — use Gmail script or manual send
5. **Track responses** — update CSV with "contacted" status