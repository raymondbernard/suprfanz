#!/usr/bin/env python3
"""Fix the escape map layout: arrow on right side, add Frederick Douglass Blvd."""

from pathlib import Path

ASSETS_DIR = Path(__file__).parent.resolve()
path = ASSETS_DIR / "silvana_escape_map.html"

text = path.read_text(encoding="utf-8")

# Update arrow CSS for east direction
text = text.replace(
    '.flyer-map .arrow { position: absolute; bottom: 0.3in; left: 50%; transform: translateX(-50%); font-size: 24pt; color: #c9a227; }',
    '.flyer-map .arrow { position: absolute; right: 0.3in; top: 50%; transform: translateY(-50%); font-size: 24pt; color: #c9a227; }'
)

# Update map text to include Frederick Douglass Blvd
old_map = """      <strong>CAMPUS</strong> (116th &amp; Broadway)<br><br>
      → Walk 10 min east<br><br>
      <strong>SILVANA</strong><br>300 W 116th St"""
new_map = """      <strong>CAMPUS</strong> (116th &amp; Broadway)<br><br>
      → Walk 10 min east<br><br>
      <strong>SILVANA</strong><br>300 W 116th St<br>(Frederick Douglass Blvd)"""
count = text.count(old_map)
text = text.replace(old_map, new_map)

path.write_text(text, encoding="utf-8")
print(f"Updated {count} map block(s)")
