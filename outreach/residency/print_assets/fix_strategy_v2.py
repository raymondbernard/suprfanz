from pathlib import Path
p = Path('outreach/residency/SILVANA_RESIDENCY_STRATEGY_V2.md')
t = p.read_text(encoding='utf-8')

replacements = [
    (
        "First show: Thursday, August 20, 2026, doors 7 PM / music 7:30 PM.\nCover: $12 general / $8 with CUID.",
        "First show: Thursday, August 20, 2026, doors 7 PM / music 7:30 PM.\nAdmission: **free** (tip the bands)."
    ),
    (
        '- "Bring your CUID. Bring a friend. Bring your appetite."',
        '- "Bring your CUID. Bring a friend. Bring your appetite." *(CUID = free entry, tip jar for bands)*'
    ),
    (
        '> "Tired of the same dining hall loop? Walk 10 minutes south to Silvana on 116th for a monthly blues review — four bands, classic electric blues, and some of the best hummus and shawarma uptown. Low cover, full bar, no pretense. Whether you’re a blues fan or just need a Thursday night that isn’t the library, this is your spot."',
        '> "Tired of the same dining hall loop? Walk 10 minutes east on 116th to Silvana for a monthly blues review — four bands, classic electric blues, and some of the best hummus and shawarma uptown. Free admission, tip the bands, full bar, no pretense. Whether you’re a blues fan or just need a Thursday night that isn’t the library, this is your spot."'
    ),
]

for old, new in replacements:
    count = t.count(old)
    if count:
        t = t.replace(old, new)
        print(f"replaced {count} x {old[:40]!r}...")
    else:
        print(f"NOT FOUND: {old[:40]!r}...")

p.write_text(t, encoding='utf-8')
print('done')
