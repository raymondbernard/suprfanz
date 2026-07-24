from pathlib import Path
p = Path('outreach/residency/SILVANA_RESIDENCY_STRATEGY_V2.md')
t = p.read_text(encoding='utf-8')

replacements = [
    (
        'Email Sky Demetri confirming Aug 20 date, 4-band format, room, door split, student/CUID pricing.',
        'Email Sky Demetri confirming Aug 20 date, 4-band format, room, free admission + tips model, student push.'
    ),
    (
        'Design flyer (food + blues + Columbia angle).',
        'Design flyer (food + blues + Columbia angle; free admission + tips + 10-min walk east).'
    ),
    (
        '- Fee: $75-150 or door split.',
        '- Fee: $75-150 or tip split (we run free admission).'
    ),
    (
        '- Fee: $100-200 or door split.',
        '- Fee: $100-200 or tip split (we run free admission).'
    ),
]

for old, new in replacements:
    count = t.count(old)
    if count:
        t = t.replace(old, new)
        print(f"replaced {count} x {old!r}")
    else:
        print(f"NOT FOUND: {old!r}")

p.write_text(t, encoding='utf-8')
print('done')
