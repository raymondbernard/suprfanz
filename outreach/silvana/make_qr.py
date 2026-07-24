#!/usr/bin/env python3
"""Generate QR codes for Silvana print assets."""

import qrcode
from pathlib import Path

ASSETS_DIR = Path(__file__).parent.resolve()

URL = "https://raymondbernard.github.io/cosmic-blues-epk/"


def make_qr(filename: str, url: str, box_size: int = 10, border: int = 2) -> None:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_size,
        border=border,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0a1628", back_color="#ffffff")
    out_path = ASSETS_DIR / filename
    img.save(out_path)
    print(f"Saved {out_path} ({img.size[0]}x{img.size[1]} px)")


if __name__ == "__main__":
    make_qr("qr_epk_300.png", URL, box_size=12, border=2)
    make_qr("qr_epk_200.png", URL, box_size=8, border=2)
    make_qr("qr_epk_100.png", URL, box_size=4, border=2)
