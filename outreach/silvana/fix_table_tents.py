from pathlib import Path
p = Path('outreach/residency/print_assets/silvana_table_tents.html')
t = p.read_text(encoding='utf-8')
old = """    <div class="price-row">
      <div class="price-box"><div class="price">$8</div><div class="price-note">w/ CUID</div></div>
      <div class="price-box"><div class="price">FREE</div><div class="price-note">before 8 w/ dinner</div></div>
    </div>
    <img class="qr" src="qr_epk_100.png" alt="QR" style="width:0.6in;height:0.6in;">
    <div class="address">Silvana · 300 W 116th St · 10 min walk</div>"""
new = """    <div class="price-row">
      <div class="price-box"><div class="price">FREE</div><div class="price-note">admission</div></div>
      <div class="price-box"><div class="price">TIPS</div><div class="price-note">for bands</div></div>
    </div>
    <img class="qr" src="qr_epk_100.png" alt="QR" style="width:0.6in;height:0.6in;">
    <div class="address">Silvana · 300 W 116th St · 10 min walk east</div>"""
count = t.count(old)
t = t.replace(old, new)
p.write_text(t, encoding='utf-8')
print(f"silvana_table_tents.html: {count} replacement(s)")
