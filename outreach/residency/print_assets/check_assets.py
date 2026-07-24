from pathlib import Path
files = [
    'silvana_elevator_strips.html',
    'silvana_bathroom_ads.html',
    'silvana_table_tents.html',
    'silvana_qr_stickers.html',
    'silvana_pass_cards.html',
    'silvana_escape_map.html',
]
for f in files:
    t = Path('outreach/residency/print_assets')/f
    text = t.read_text(encoding='utf-8')
    print(f, 'size', t.stat().st_size)
    print('  $8 count:', text.count('$8'))
    print('  CUID count:', text.count('CUID'))
    print('  south count:', text.lower().count('south'))
    print('  free count:', text.lower().count('free'))
