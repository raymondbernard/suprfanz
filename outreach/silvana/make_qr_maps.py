#!/usr/bin/env python3
"""Generate QR codes that link to the Silvana Google Maps location."""

import qrcode
from pathlib import Path

ASSETS_DIR = Path(__file__).parent.resolve()

URL = "https://maps.app.goo.gl/JoCJZHJX2KLz6tRm7"


def make_qr(filename: str, url: str, box_size: int = 10, border: int = 2,
            error_correction=qrcode.constants.ERROR_CORRECT_M) -> None:
    qr = qrcode.QRCode(
        version=None,
        error_correction=error_correction,
        box_size=box_size,
        border=border,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0a1628", back_color="#ffffff")
    out_path = ASSETS_DIR / filename
    img.save(out_path)
    print(f"Saved {out_path} ({img.size[0]}x{img.size[1]} px) version {qr.version}")


if __name__ == "__main__":
    # Larger physical QR display sizes use M correction; smaller printed sizes use L
    # to keep modules as large as possible for phone cameras.
    make_qr("qr_maps_300.png", URL, box_size=12, border=2, error_correction=qrcode.constants.ERROR_CORRECT_M)
    make_qr("qr_maps_200.png", URL, box_size=8, border=2, error_correction=qrcode.constants.ERROR_CORRECT_M)
    make_qr("qr_maps_100.png", URL, box_size=6, border=2, error_correction=qrcode.constants.ERROR_CORRECT_L)
