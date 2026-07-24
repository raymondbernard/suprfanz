#!/usr/bin/env python3
"""Fix remaining $8/CUID references in compact HTML assets."""

from pathlib import Path

ASSETS_DIR = Path(__file__).parent.resolve()

# Table tents: two price boxes
path = ASSETS_DIR / "silvana_table_tents.html"
text = path.read_text(encoding="utf-8")
old = '<div class="price-row"><div class="price-box"><div class="price">$8</div><div class="price-note">w/ CUID</div></div><div class="price-box"><div class="price">FREE</div><div class="price-note">before 8 w/ dinner</div></div></div>'
new = '<div class="price-row"><div class="price-box"><div class="price">FREE</div><div class="price-note">admission</div></div><div class="price-box"><div class="price">TIPS</div><div class="price-note">for bands</div></div></div>'
count = text.count(old)
text = text.replace(old, new)
path.write_text(text, encoding="utf-8")
print(f"silvana_table_tents.html: {count} replacement(s)")

# QR stickers
path = ASSETS_DIR / "silvana_qr_stickers.html"
text = path.read_text(encoding="utf-8")
old = '<div class="sticker-bottom"><div class="price">$8</div><div class="note">with CUID</div><div class="addr">Silvana · 300 W 116th</div></div>'
new = '<div class="sticker-bottom"><div class="price">FREE</div><div class="note">admission · tip bands</div><div class="addr">Silvana · 300 W 116th</div></div>'
count = text.count(old)
text = text.replace(old, new)
path.write_text(text, encoding="utf-8")
print(f"silvana_qr_stickers.html: {count} replacement(s)")

# Pass cards
path = ASSETS_DIR / "silvana_pass_cards.html"
text = path.read_text(encoding="utf-8")
old = '<div class="card-bottom"><div class="price">$8</div><div class="note">with CUID · FREE before 8 PM with dinner</div><div class="addr">Silvana · 300 W 116th St</div></div>'
new = '<div class="card-bottom"><div class="price">FREE</div><div class="note">admission · tip the bands</div><div class="addr">Silvana · 300 W 116th St · 10 min walk east</div></div>'
count = text.count(old)
text = text.replace(old, new)
# Also fix the mid text direction if still generic
old2 = '10-min walk from Columbia'
new2 = '10-min walk east from Columbia'
count2 = text.count(old2)
text = text.replace(old2, new2)
path.write_text(text, encoding="utf-8")
print(f"silvana_pass_cards.html: {count} price + {count2} direction replacement(s)")
