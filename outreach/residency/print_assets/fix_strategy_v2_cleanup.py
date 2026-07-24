from pathlib import Path
p = Path('outreach/residency/SILVANA_RESIDENCY_STRATEGY_V2.md')
t = p.read_text(encoding='utf-8')

replacements = [
    # Sky email
    (
        'We can push "free admission" and "free entry before 8 PM with dinner."',
        'We can push "free admission" and "tip the bands."'
    ),
    (
        'I’d like to promote a "Blues & Bites" combo (entrée + show for $22-25).',
        'I’d like to promote a "Blues & Bites" dinner special (entrée ~$22-25) to get students eating early and staying for the music.'
    ),
    (
        '- Door arrangement: I suggest $150 venue guarantee, then 70/30 split (bands/venue), paid within 48 hours\n- CUID discount / free-before-8-with-dinner — OK with you?',
        '- Admission model: free entry all night; bands work from tips (cash + QR tip jar), split evenly. OK with you?\n- Food/drink minimum: can we set a modest target so Silvana sees direct revenue?'
    ),
    # Metrics
    ('| Paid attendance | 50-70 |', '| Total attendance | 60-90 |'),
    ('| Paid attendance | 80-110 |', '| Total attendance | 90-130 |'),
    ('| Paid attendance | 100-130 |', '| Total attendance | 120-160 |'),
    # Immediate steps
    ('Email Sky Demetri confirming Aug 20 date, 4-band format, room, door split, student/CUID pricing.',
     'Email Sky Demetri confirming Aug 20 date, 4-band format, room, free admission + tips model, student push.'),
    ('Design flyer emphasizing "Blues & Bites, 10 min from Columbia."',
     'Design flyer emphasizing "Blues & Bites, free admission, 10 min walk east from Columbia."'),
    # Risks
    ('Increase ambassador push, add free-before-8 promo, campus tabling.',
     'Increase ambassador push, add food/drink specials, campus tabling.'),
    # Student discount section
    ('- "$8 cover with CUID" or "free entry before 8 PM with dinner."',
     '- "Free admission for Columbia students" and "tip the bands."'),
]

for old, new in replacements:
    count = t.count(old)
    if count:
        t = t.replace(old, new)
        print(f"replaced {count} x {old[:50]!r}...")
    else:
        print(f"NOT FOUND: {old[:50]!r}...")

p.write_text(t, encoding='utf-8')
print('done')
