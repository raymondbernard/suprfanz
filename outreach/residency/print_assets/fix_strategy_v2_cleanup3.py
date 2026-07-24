from pathlib import Path
p = Path('outreach/residency/SILVANA_RESIDENCY_STRATEGY_V2.md')
t = p.read_text(encoding='utf-8')

replacements = [
    (
        'You’d play a 30-min set, door split, strong student/local promotion. Interested?',
        'You’d play a 30-min set, shared tips from the free-admission crowd, strong student/local promotion. Interested?'
    ),
    (
        '- Compensation: Even split of door after $[venue guarantee], paid within 48 hours',
        '- Compensation: Even split of tips (cash + QR), paid within 48 hours'
    ),
    (
        'We’re targeting Columbia students, Harlem locals, and the NYC blues scene. Silvana serves Middle Eastern food, so we’re marketing it as dinner + blues.',
        'We’re targeting Columbia students, Harlem locals, and the NYC blues scene. Silvana serves Middle Eastern food, and admission is free — bands work from tips.'
    ),
    (
        'We’re curating the Silvana Blues Review, a monthly 4-band blues showcase at Silvana, 300 W 116th St in Harlem. Each band plays a 30-minute set (Cosmic Blues Band closes as anchor).',
        'We’re curating the Silvana Blues Review, a monthly 4-band blues showcase at Silvana, 300 W 116th St in Harlem. Each band plays a 30-minute set (Cosmic Blues Band closes as anchor). Admission is free; all tips are split evenly.'
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
