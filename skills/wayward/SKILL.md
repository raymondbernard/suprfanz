---
name: "wayward"
description: "Reconstruct websites from archived Wayback Machine snapshots - recovers content and assets, analyzes visual design, recreates missing resources, rebuilds layouts, and generates a modern deployable site while preserving the original aesthetic"
---

# Wayback Site Rebuilder Skill

## Metadata

- **Version:** 1.0.0
- **Author:** OpenClaw Community
- **Category:** web_reconstruction
- **Tags:** wayback, website-restoration, archive-analysis, asset-reconstruction, html, css, design-recovery
- **Permissions:** web_access, file_generation, image_analysis, code_generation

---

# Purpose

This skill performs digital archaeology on archived websites.

The objective is not merely to clone a site, but to:

1. Recover all available content.
2. Recover all available assets.
3. Analyze the visual identity.
4. Recreate missing resources.
5. Preserve the original look and feel.
6. Generate a fully functional modern replacement site.

---

# Inputs

```yaml
inputs:

  archive_url:
    type: string
    required: true
    description: >
      Wayback Machine or archive URL.

  target_framework:
    type: string
    default: static-html
    options:
      - static-html
      - astro
      - nextjs
      - react
      - vue

  reconstruction_mode:
    type: string
    default: historical_site_reconstruction

  preserve_visual_identity:
    type: boolean
    default: true

  recreate_missing_assets:
    type: boolean
    default: true

  modernize_code:
    type: boolean
    default: true
```

---

# Workflow

## Phase 1 — Archive Discovery

### Objectives

* Crawl archive snapshot.
* Discover linked pages.
* Discover downloadable assets.
* Build site map.

### Tasks

```text
1. Load archive snapshot.
2. Enumerate internal pages.
3. Extract HTML.
4. Extract CSS.
5. Extract JavaScript.
6. Download assets.
7. Build page graph.
8. Generate sitemap.
```

### Output

```json
{
  "pages": [],
  "assets": [],
  "links": [],
  "sitemap": {}
}
```

---

## Phase 2 — Design Analysis

### Objectives

Infer original design system.

### Analyze

* Colors
* Typography
* Layout
* Navigation
* Iconography
* Artwork
* Decorative motifs
* Animation behavior

### Extract

```json
{
  "palette": [],
  "fonts": [],
  "spacing": {},
  "components": [],
  "layout_style": "",
  "visual_theme": ""
}
```

### Example

```json
{
  "palette": [
    "#1e1e1e",
    "#d3a857",
    "#ffffff"
  ],
  "visual_theme": "dark fantasy archive",
  "layout_style": "fixed-width portal"
}
```

---

## Phase 3 — Asset Recovery

### Recover

* Images
* Logos
* Icons
* Banners
* Backgrounds
* Documents
* Downloads

### Sources

```text
Primary Snapshot
↓
Adjacent Snapshots
↓
Other Archived Pages
↓
Embedded Copies
↓
Generated Recreation
```

### Asset Inventory

```json
{
  "asset_name": "",
  "status": "recovered",
  "source": "",
  "quality": ""
}
```

Possible statuses:

```text
recovered
partial
missing
recreated
```

---

## Phase 4 — Missing Asset Reconstruction

### Trigger

If original asset unavailable.

### Recreate

* Logos
* Icons
* Decorative artwork
* Textures
* UI graphics

### Rules

```text
Preserve:
- Shape language
- Color palette
- Typography style
- Visual hierarchy
- Composition

Avoid:
- Modern redesign
- Stylistic reinterpretation
- Brand changes
```

### Reconstruction Methods

#### Logo Recovery

```text
Vector tracing
Typography recreation
Manual reconstruction
```

#### Icon Recovery

```text
Shape extraction
Style matching
Vector rebuild
```

#### Graphic Recovery

```text
Palette matching
Composition matching
Theme preservation
```

#### Texture Recovery

```text
Pattern extraction
Procedural reconstruction
```

---

## Phase 5 — Site Reconstruction

### Build

Modern equivalent site.

### Generate

```text
HTML
CSS
JS
Assets
SEO metadata
Responsive layouts
```

### Preserve

```text
Original layout proportions
Original navigation structure
Original content hierarchy
Original visual identity
```

### Modernize

```text
Accessibility
Responsive behavior
Semantic HTML
Performance
Security
```

---

## Phase 6 — Validation

### Compare

Archived Site
vs
Reconstructed Site

### Score

```yaml
visual_similarity:
  target: 90+

layout_accuracy:
  target: 95+

asset_recovery:
  target: maximum_possible

content_accuracy:
  target: 100%
```

### Generate Report

```json
{
  "similarity_score": 94,
  "recovered_assets": 87,
  "recreated_assets": 12,
  "missing_assets": 2
}
```

---

# Historical Site Reconstruction Mode

```yaml
mode: historical_site_reconstruction

rules:

  - preserve_original_palette
  - preserve_original_layout
  - preserve_original_typography
  - preserve_original_navigation
  - preserve_original_branding
  - recreate_missing_assets_only_when_required
  - document_every_recreated_element
```

---

# Deliverables

```text
asset_inventory.json

design_system.json

site_map.json

recreation_report.md

recreated_assets/

reconstructed_site/
```

---

# Success Criteria

The reconstruction is considered successful when:

1. The site visually resembles the archived version.
2. Missing assets are recreated convincingly.
3. Navigation functions correctly.
4. Content is preserved.
5. Original artistic intent remains intact.
6. The generated site is deployable without additional reconstruction.

```
```
