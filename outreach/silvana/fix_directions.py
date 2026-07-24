#!/usr/bin/env python3
"""Fix directional copy in Silvana print assets: south -> east, down arrow -> right arrow."""

from pathlib import Path

ASSETS_DIR = Path(__file__).parent.resolve()

FILES = [
    "silvana_elevator_strips.html",
    "silvana_bathroom_ads.html",
    "silvana_table_tents.html",
    "silvana_qr_stickers.html",
    "silvana_pass_cards.html",
    "silvana_escape_map.html",
    "../SILVANA_RESIDENCY_STRATEGY_V2.md",
    "../SILVANA_AREA_CAMPAIGN.md",
    "../SILVANA_MARKETING_STRATEGY.md",
    "../SILVANA_ONE_SHEET.md",
    "README.md",
]

REPLACEMENTS = [
    ("walk 10 min south", "walk 10 min east"),
    ("↓ Walk 10 min south", "→ Walk 10 min east"),
    ("Walk 10 min south", "Walk 10 min east"),
    ("down the block", "up the block"),
    ("<div class=\"arrow\">↓</div>", "<div class=\"arrow\">→</div>"),  # Silvana is east, not "down"
]


def main():
    for filename in FILES:
        path = ASSETS_DIR / filename
        if not path.exists():
            print(f"Skip (not found): {filename}")
            continue
        text = path.read_text(encoding="utf-8")
        changed = False
        for old, new in REPLACEMENTS:
            count = text.count(old)
            if count:
                text = text.replace(old, new)
                print(f"  {filename}: replaced {count} occurrence(s)")
                changed = True
        if changed:
            path.write_text(text, encoding="utf-8")
        else:
            print(f"  {filename}: no changes")


if __name__ == "__main__":
    main()
