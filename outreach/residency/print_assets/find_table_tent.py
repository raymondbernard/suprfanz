from pathlib import Path
p = Path('outreach/residency/print_assets/silvana_table_tents.html')
t = p.read_text(encoding='utf-8')
i = t.find('<div class="price-row">')
print(repr(t[i:i+500]))
