#!/usr/bin/env python3
"""Update all Silvana assets to free admission + tips model."""

from pathlib import Path

ASSETS_DIR = Path(__file__).parent.resolve()

HTML_FILES = [
    "silvana_elevator_strips.html",
    "silvana_bathroom_ads.html",
    "silvana_table_tents.html",
    "silvana_qr_stickers.html",
    "silvana_pass_cards.html",
    "silvana_escape_map.html",
]

MD_FILES = [
    "README.md",
    "../SILVANA_RESIDENCY_STRATEGY_V2.md",
]

# HTML asset replacements
HTML_REPLACEMENTS = [
    # Price blocks
    ('<div class="price">$8</div>\n    <div class="cuid">with CUID</div>', '<div class="price">FREE</div>\n    <div class="cuid">admission</div>'),
    ('<div class="price">$8</div>\n    <div class="note">with CUID · FREE before 8 PM with dinner</div>', '<div class="price">FREE</div>\n    <div class="note">admission · tip the bands</div>'),
    ('<div class="price">$8</div>\n    <div class="note">with CUID</div>', '<div class="price">FREE</div>\n    <div class="note">admission · tip the bands</div>'),
    ('<div class="price">$8</div>\n    <div class="price-note">w/ CUID</div>', '<div class="price">FREE</div>\n    <div class="price-note">admission</div>'),
    ('<div class="price">FREE</div>\n    <div class="price-note">before 8 w/ dinner</div>', '<div class="price">TIPS</div>\n    <div class="price-note">for the bands</div>'),
    ('<div class="price">$8</div>\n    <div class="note">with CUID · FREE before 8 PM with dinner</div>', '<div class="price">FREE</div>\n    <div class="note">admission · tip the bands</div>'),
    # Sticker price
    ('<div class="price">$8</div>\n    <div class="note">with CUID</div>', '<div class="price">FREE</div>\n    <div class="note">admission</div>'),
    # Pass cards
    ('<div class="price">$8</div>\n    <div class="note">with CUID · FREE before 8 PM with dinner</div>', '<div class="price">FREE</div>\n    <div class="note">admission · tip the bands</div>'),
    # Sticker note
    ('<div class="sticker-bottom">\n    <div class="price">$8</div>\n    <div class="note">with CUID</div>', '<div class="sticker-bottom">\n    <div class="price">FREE</div>\n    <div class="note">admission</div>'),
]

# Markdown replacements
MD_REPLACEMENTS = [
    ("$8 cover with CUID", "free admission"),
    ("$10-15 cover", "free admission"),
    ("$10-12", "free"),
    ("$12 general / $10 advance / $8 with CUID", "free admission"),
    ("$10 door / $8 with CUID", "free admission"),
    ("$12 general · $8 with CUID", "free admission"),
    ("Suggested donation $12", "Free admission; tips for bands encouraged"),
    ("$12 suggested donation", "free admission, tip the bands"),
    # Pricing tables
    ("Student (CUID) | $8 | Always available at door", "Free admission | $0 | Always available at door"),
    ("General Advance | $10 | Eventbrite/Instagram earlybird", "Tip jar / Band tips | $ suggested | At the show"),
    ("General Door | $12 | Standard door price", "Band tips | $ suggested | Standard support"),
    ("Dinner + Show Combo | $22-25 | Bundle with Silvana food menu", "Dinner + Show | Food purchase | Bundle with Silvana food menu"),
    ("Free before 8 PM | $0 | Dine-in customers only, fills early seats", "Free all night | $0 | Dine-in or drink customers welcome"),
    # Revenue model text
    ("First $150 to Silvana (venue guarantee / sound engineer)\n- Remaining door split: **70% to bands / 30% to Silvana**", "Silvana keeps 100% of food/bar sales.\n- A tip jar / virtual tip bucket is split evenly among all 4 bands."),
    ("**Example at 75 paid attendees @ $12 = $900 gross:**\n- $150 to Silvana (guarantee)\n- $750 remaining\n- $525 to bands ($131.25 each)\n- $225 to Silvana (supplement)\n- Silvana also keeps all food/bar revenue.", "**Revenue model:**\n- Admission is free.\n- Silvana keeps 100% of food/bar revenue.\n- Tip jar / QR tips split evenly among the 4 bands.\n- Strong attendance drives bigger tips and repeat booking."),
    ("**Option A — Door Split (Recommended for launch):**", "**Option A — Free Admission + Tips (Recommended for launch):**"),
    ("- First $150 to Silvana (venue guarantee / sound engineer)\n- Remaining door split: **70% to bands / 30% to Silvana**\n- Silvana keeps 100% of bar/food sales.\n- Bands split 70% evenly 4 ways = 17.5% each.", "- Free admission all night.\n- Silvana keeps 100% of food/bar sales.\n- Tip jar / QR code tips split evenly among the 4 bands.\n- Strong turnout = bigger tips + proof of concept for Silvana."),
    ("**Option B — Flat Guarantee:**\n- Silvana pays Cosmic Blues Band $400/night flat to produce the show.\n- Cosmic Blues Band pays opening acts from that budget.\n- No cover charge (drives food/bar sales).\n- Riskier for us if turnout is low.", "**Option B — Food/Bar Minimum Guarantee:**\n- Silvana guarantees $400 in food/bar sales for the night.\n- If we hit it, Silvana extends the residency.\n- Tips remain with bands.\n- Low risk for both sides."),
    ("**Option C — Hybrid:**\n- Silvana guarantees $100/night + 50/50 door split after $300 threshold.\n- Balanced risk for both sides.", "**Option C — Tips + Small House Fee:**\n- Silvana pays $100 house fee/sound to Cosmic Blues Band.\n- All tips split among bands.\n- Useful once the series is proven and we manage production."),
    ("### Month 1 Financial Goal\n- **Attendance target:** 60-80 paid\n- **Door revenue:** $720-$960\n- **Band payouts:** $100-140 each\n- **Cosmic Blues Band net:** Same as other bands month 1; long-term, we negotiate a promoter fee if we handle all booking/marketing.", "### Month 1 Financial Goal\n- **Attendance target:** 80-120\n- **Admission revenue:** $0 (free)\n- **Tips estimate:** $200-400 total ($50-100 per band)\n- **Silvana food/bar uplift:** primary venue benefit\n- **Cosmic Blues Band net:** equal tip split month 1; long-term, negotiate small production fee if we book/market the whole series."),
    # Event copy
    ("🎟 $12 door / $10 advance / $8 with CUID / FREE before 8 PM with dinner", "🎟 Free admission · tip the bands · dinner + drinks available"),
    ("$8 with CUID. Free before 8 PM with dinner.", "Free admission. Tip the bands."),
    ("$8 cover with CUID", "free admission"),
    ("FREE before 8 PM with dinner", "free admission"),
]


def update_file(path: Path, replacements):
    text = path.read_text(encoding="utf-8")
    changed = False
    for old, new in replacements:
        count = text.count(old)
        if count:
            text = text.replace(old, new)
            changed = True
            print(f"  {path.name}: {count} replacement(s)")
    if changed:
        path.write_text(text, encoding="utf-8")
    return changed


def main():
    for filename in HTML_FILES:
        path = ASSETS_DIR / filename
        if update_file(path, HTML_REPLACEMENTS):
            print(f"Updated {filename}")
        else:
            print(f"No changes: {filename}")

    for filename in MD_FILES:
        path = ASSETS_DIR / filename
        if update_file(path, MD_REPLACEMENTS):
            print(f"Updated {filename}")
        else:
            print(f"No changes: {filename}")


if __name__ == "__main__":
    main()
