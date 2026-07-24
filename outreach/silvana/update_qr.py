#!/usr/bin/env python3
"""Update QR placeholders in Silvana print-asset HTML files."""

from pathlib import Path

ASSETS_DIR = Path(__file__).parent.resolve()

REPLACEMENTS = {
    "silvana_elevator_strips.html": (
        '<div class="qr">QR →<br>event</div>',
        '<img class="qr" src="qr_epk_100.png" alt="QR">',
    ),
    "silvana_table_tents.html": (
        '<div class="qr">QR</div>',
        '<img class="qr" src="qr_epk_100.png" alt="QR" style="width:0.6in;height:0.6in;">',
    ),
    "silvana_qr_stickers.html": (
        '<div class="sticker-mid"><div class="qr">QR</div></div>',
        '<div class="sticker-mid"><img class="qr" src="qr_epk_100.png" alt="QR" style="width:1.1in;height:1.1in;"></div>',
    ),
}


def main():
    for filename, (old, new) in REPLACEMENTS.items():
        path = ASSETS_DIR / filename
        text = path.read_text(encoding="utf-8")
        count = text.count(old)
        if count == 0:
            print(f"Warning: no matches in {filename}")
            continue
        text = text.replace(old, new)
        path.write_text(text, encoding="utf-8")
        print(f"Updated {count} QR placeholder(s) in {filename}")


if __name__ == "__main__":
    main()
