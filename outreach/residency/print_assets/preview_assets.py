from pathlib import Path
from playwright.sync_api import sync_playwright

ASSETS_DIR = Path(__file__).parent.resolve()
FILES = [
    "silvana_elevator_strips.html",
    "silvana_bathroom_ads.html",
    "silvana_table_tents.html",
    "silvana_qr_stickers.html",
    "silvana_pass_cards.html",
    "silvana_escape_map.html",
]

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    for filename in FILES:
        html_path = ASSETS_DIR / filename
        out_path = ASSETS_DIR / f"preview_{filename.replace('.html','.png')}"
        page.set_viewport_size({'width': 850, 'height': 1100})
        page.goto(f"file://{html_path}", wait_until="networkidle")
        page.screenshot(path=str(out_path), full_page=True)
        print(f"saved {out_path.name}")
    browser.close()
