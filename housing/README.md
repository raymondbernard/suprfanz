# Housing — Affordable & Supportive Housing Search

## Purpose
Find affordable and supportive housing options for low-income and no-income individuals in NYC.

## Structure
```
housing/
├── README.md                              ← this file
├── resources/
│   ├── affordable-housing-guide.md         ← NYC affordable housing programs & how to apply
│   └── supportive-housing-guide.md         ← NYC supportive housing (with services) & providers
├── listings/
│   ├── nyc-affordable-housing-by-building.csv     ← 9,250 buildings (HPD dataset)
│   └── manhattan-scattered-site-housing.csv        ← 668 buildings in 98 scattered-site projects (Manhattan)
├── applications/
│   └── (application tracking — to be set up)
└── guides/
    └── (how-to guides — to be added)
```

## Quick Start

### Affordable Housing (rent only, no services)
- **Start here:** NYC Housing Connect — https://housingconnect.nyc.gov
- **Also apply:** NYCHA Public Housing — https://selfserve.nycha.info
- **See:** `resources/affordable-housing-guide.md`

### Supportive Housing (rent + on-site services)
- **Start here:** Call 311 and ask for supportive housing assessment (CAPS)
- **If HIV/AIDS:** HASA — 718-557-1399
- **If mental health:** SPOA — call 311
- **If veteran:** HUD-VASH — 877-424-3838
- **See:** `resources/supportive-housing-guide.md`

### Manhattan Scattered-Site Housing
- Smaller buildings spread across neighborhoods — looks like regular apartments
- Operated by nonprofits: CUCS, Pathways to Housing, Community Access, Bailey House
- Access through CAPS assessment or specific program referral
- **See:** `listings/manhattan-scattered-site-housing.csv`