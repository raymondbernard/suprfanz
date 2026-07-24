# Silvana Blues Review — Columbia Campus Print Assets

**Show:** Silvana Blues Review  
**Date:** Thursday, August 20, 2026  
**Venue:** Silvana, 300 W 116th St, Harlem, NYC  
**QR Code target:** https://raymondbernard.github.io/cosmic-blues-epk/  
*(Update this to your Eventbrite/Facebook event URL before final print run.)*

---

## Files

### Print-Ready PDFs
| File | What It Is | Quantity Per Page | Best Placement |
|---|---|---|---|
| `silvana_elevator_strips.pdf` | Tall vertical strips | 4 per page | Dorm/library elevators, narrow wall spaces |
| `silvana_bathroom_ads.pdf` | Vertical bathroom-friendly ads | 4 per page | Dorm bathrooms, library restrooms |
| `silvana_table_tents.pdf` | Foldable tent cards | 4 per page | Cafés, dining halls, study tables, Lerner Hall |
| `silvana_qr_stickers.pdf` | Small round-ish stickers | 12 per page | Lampposts, bike racks, mirrors, doors |
| `silvana_pass_cards.pdf` | Wallet-sized cards | 8 per page | Hand out, leave on tables, tape to doors |
| `silvana_escape_map.pdf` | Quarter-page flyers with map | 4 per page | Dining hall exits, dorms, campus walkways |

### Source HTML
Each PDF has a matching `.html` file. Edit the HTML to change dates, prices, copy, or QR URL.

### QR Codes
- `qr_epk_100.png` (180×180 px) — used in most assets
- `qr_epk_200.png` (360×360 px) — for larger applications
- `qr_epk_300.png` (540×540 px) — for posters

### Helper Scripts
- `make_qr.py` — regenerate QR codes
- `update_qr.py` — swap QR placeholders in HTML for real images
- `print_to_pdf.py` — regenerate all PDFs from HTML via Playwright

---

## How to Regenerate PDFs

```powershell
C:\Users\RayBe\AppData\Local\Programs\Python\Python313\python.exe outreach/silvana/print_to_pdf.py
```

Requires Playwright for Python 3.13.

---

## How to Update the QR Code URL

1. Edit `make_qr.py` and change `URL` to your event link.
2. Run it.
3. Run `update_qr.py` (only needed if you change image filenames).
4. Run `print_to_pdf.py`.

---

## Printing Tips

- **Paper:** Standard 8.5×11" white cardstock (110 lb minimum for tents/cards; 80 lb OK for flyers/stickers).
- **Printer settings:** Color, actual size, no scaling, borderless off.
- **Cutting:** Use a paper trimmer. Sticker sheets can be printed on Avery 2×2 label stock (e.g., Avery 22805/22807) or cut by hand.
- **Table tents:** Print, cut along crop lines, fold in half vertically so the design faces both directions. Add a small tape dot inside to keep shape.
- **Elevator strips:** Cut vertically. Tape top and bottom only — easier to remove cleanly.
- **QR stickers:** Print on full-sheet label paper and punch/cut to size.

---

## Recommended Distribution Counts for Month 1

| Asset | Suggested Print Qty | Primary Locations |
|---|---|---|
| Elevator strips | 50 | Lenfest, Lionsgate, Whittier, Butler Library elevators |
| Bathroom ads | 40 | Dorm bathrooms, Butler restrooms |
| Table tents | 40 | Lerner Hall café, Diana Center, Hungarian Pastry Shop, dining halls |
| QR stickers | 200 | Lampposts on Frederick Douglass Blvd / Manhattan Ave / 110th-120th, bike racks, mirrors |
| Pass cards | 100 | Hand out at Postcrypt, leave on café tables |
| Escape-map flyers | 100 | Dining hall exits, dorms, campus event boards |

---

## Key Messaging Used

- **Free admission**
- **Tip the bands**
- **10-minute walk east from Columbia**
- **4 bands · real blues · Middle Eastern food**
- **Thursday, August 20, 2026 · 7:00 PM**

---

## Design Notes v2

- All 6 assets were redesigned with a **psychedelic '60s Cream / *Disraeli Gears* aesthetic**: cream backgrounds, electric blue/red/orange/purple bursts, wavy typography, and radiating swirl patterns.
- The **Cosmic Blues Band circular logo** (`logo_cb1.png`) is integrated on every asset with a multi-colored ring shadow.
- **"FREE ADMISSION"** is the dominant message on every piece; **"TIP THE BANDS"** is the secondary call to action.
- All copy has been updated to the corrected event framing: **"Silvana Blues Review — 4 NYC blues acts — Cosmic Blues Band headlines"**.
- The venue address (**300 W 116th St**) and direction (**walk east on 116th**, ~10 min from Columbia) appear on every asset.
- Preview PNGs (`preview_*.png`) are generated alongside each asset for quick visual verification before printing.

---

## Notes

- All assets use a cohesive psychedelic cream + electric blue + red + orange color scheme to read as one campaign.
- Copy emphasizes food + proximity + free admission + tips — the four levers that convert Columbia students.
- Silvana is at 300 W 116th St, on the corner of Frederick Douglass Blvd (8th Ave) — walk **east** on 116th from campus.
- Replace the QR URL with an event-specific link (Eventbrite/Facebook/Instagram) before the big print push.
