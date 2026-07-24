#!/usr/bin/env python3
"""Convert Silvana print-asset HTML files to PDFs using Playwright."""

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


def print_to_pdf(html_path: Path, pdf_path: Path) -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(f"file://{html_path}", wait_until="networkidle")
        page.pdf(
            path=str(pdf_path),
            format="Letter",
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            print_background=True,
        )
        browser.close()


def main():
    for filename in FILES:
        html_path = ASSETS_DIR / filename
        pdf_path = ASSETS_DIR / filename.replace(".html", ".pdf")
        print(f"Converting {filename} -> {pdf_path.name} ...")
        print_to_pdf(html_path, pdf_path)
        print(f"  done ({pdf_path.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
