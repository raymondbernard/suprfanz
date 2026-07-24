from pathlib import Path
from playwright.sync_api import sync_playwright

p = Path('outreach/residency/print_assets/silvana_table_tents.html')
with sync_playwright() as sp:
    browser = sp.chromium.launch()
    page = browser.new_page()
    page.set_viewport_size({'width': 850, 'height': 1100})
    page.goto(f'file://{p.resolve()}', wait_until='networkidle')
    page.screenshot(path='outreach/residency/print_assets/preview_table_tent.png', full_page=True)
    browser.close()
print('saved preview_table_tent.png')
