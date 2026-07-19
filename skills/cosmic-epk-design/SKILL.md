---
name: "cosmic-epk-design"
description: "Design system and best practices for Cosmic Blues Band EPK website using Materialize CSS"
---

# Cosmic EPK Design System

**Purpose:** Consistent design patterns for the Cosmic Blues Band Electronic Press Kit website built with Materialize CSS.

---

## Brand Palette

```css
:root {
  --yellow: #fdd835;      /* Yellow 600 — primary accent */
  --yellow-ink: #f9a825;  /* Readable yellow for text/borders */
  --blue: #90caf9;        /* Blue 200 — secondary accent */
  --blue-ink: #1e88e5;    /* Readable blue for links/text */
  --pink: #f48fb1;        /* Pink 200 — decorative */
  --purple: #ea80fc;      /* Purple A100 — decorative */
  --deep-purple: #b388ff; /* Deep Purple A100 — decorative */
  --cyan: #80deea;        /* Cyan 200 — decorative */
  --light-green: #b2ff59; /* Light Green A200 — decorative */
  --orange: #ffa726;      /* Orange 400 — decorative */
  --red: #d32f2f;         /* Red 700 — alerts */
  
  /* Neutrals */
  --ink: #212121;
  --muted: #5f6368;
  --line: #e6e8ec;
  --surface: #ffffff;
  --surface-2: #f7f9fc;
  --btn-ink: #3a2f00;     /* Dark text on yellow buttons */
}
```

---

## Typography

```css
--font: 'DIN Next Rounded LT Pro', 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Font weights:**
- Regular body: 400
- Emphasis/links: 600
- Headings: 700-800
- Section eyebrows: 800, uppercase, letter-spacing 0.12em

---

## Layout Patterns

### Section Spacing
```css
section { padding: 74px 0; }
section.alt { background: var(--surface-2); }  /* Alternating light gray sections */
```

### Centered Headings
```html
<div class="center-head">
  <div class="section-eyebrow">Eyebrow Text</div>
  <h2 class="section-title">Main Title</h2>
  <p class="section-sub">Subtitle or description</p>
</div>
```

```css
.center-head {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 46px;
}
.section-eyebrow::before {
  content: "";
  width: 22px;
  height: 4px;
  border-radius: 3px;
  background: var(--yellow);
}
```

---

## Gallery Component

### Grid Layout
Use Materialize's responsive grid with custom spacing:

```html
<div class="row">
  <div class="col s12 m6 l4">
    <div class="gallery-img">
      <img src="..." alt="...">
      <div class="cap">Caption text</div>
    </div>
  </div>
  <!-- Repeat for each image -->
</div>
```

**Responsive breakpoints:**
- Mobile (s12): Full width, stacked
- Tablet (m6): 2 columns
- Desktop (l4): 3 columns

### Gallery Image Styling
```css
.gallery-img {
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 6px 18px rgba(0,0,0,.1);
  aspect-ratio: 4/3;
  margin-bottom: 24px;  /* Row spacing */
}

.gallery-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;  /* Preserve heads in portraits */
  display: block;
  transition: transform .5s ease;
}

.gallery-img:hover img {
  transform: scale(1.06);
}

.gallery-img .cap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 14px 16px;
  color: #fff;
  font-weight: 700;
  font-size: .92rem;
  background: linear-gradient(0deg, rgba(0,0,0,.8), transparent);
}
```

**Key decisions:**
- `object-position: center top` ensures heads aren't cropped in portrait photos
- `margin-bottom: 24px` provides breathing room between rows
- Gradient caption overlay ensures text readability on any image
- Hover zoom (1.06x) adds interactivity without being distracting

---

## Image Modal (Lightbox)

Use Materialize Modal for click-to-enlarge functionality:

### HTML
```html
<div id="image-modal" class="modal" style="max-width:90%;background:transparent;box-shadow:none">
  <div class="modal-content" style="padding:0;display:flex;flex-direction:column;align-items:center;background:transparent">
    <img class="modal-img" src="" alt="" style="max-width:100%;max-height:80vh;object-fit:contain;border-radius:8px">
    <div class="modal-caption" style="color:#fff;margin-top:16px;font-size:1.1rem;font-weight:600;text-align:center;padding:0 24px;max-width:800px"></div>
  </div>
</div>
```

### JavaScript Initialization
```javascript
document.addEventListener('DOMContentLoaded', function() {
  M.Modal.init(document.querySelectorAll('.modal'), {
    opacity: 0.92,
    preventScrolling: true
  });
  
  document.querySelectorAll('.gallery-img').forEach(galleryImg => {
    galleryImg.style.cursor = 'pointer';
    galleryImg.addEventListener('click', function() {
      const img = this.querySelector('img');
      const cap = this.querySelector('.cap');
      const modal = document.getElementById('image-modal');
      modal.querySelector('.modal-img').src = img.src;
      modal.querySelector('.modal-img').alt = img.alt;
      modal.querySelector('.modal-caption').textContent = cap ? cap.textContent : '';
      M.Modal.getInstance(modal).open();
    });
  });
});
```

**Key decisions:**
- Use Materialize's built-in Modal instead of custom lightbox
- Dark overlay (0.92 opacity) for focus
- `object-fit: contain` in modal preserves full image without cropping
- Caption carries over from thumbnail
- Close via X button, clicking outside, or Escape key

---

## Buttons

```css
.btn-large {
  font-family: var(--font);
  font-weight: 800;
  letter-spacing: .01em;
  border-radius: 26px;
  text-transform: none;
  box-shadow: 0 6px 18px rgba(0,0,0,.1);
}

.btn-primary {
  background: var(--yellow);
  color: var(--btn-ink);
}

.btn-primary:hover {
  background: #ffe14d;
}

.btn-secondary {
  background: var(--blue);
  color: #0d3b66;
}

.btn-secondary:hover {
  background: #a6d5fb;
}
```

**Usage:**
- Primary CTA (Book the Band): Yellow background
- Secondary action (Watch Live): Blue background
- Rounded corners (26px) for friendly, modern feel
- No text-transform (keep sentence case)

---

## Cards

### Configuration Cards
```html
<div class="card m-card b-blue">
  <div class="card-content">
    <span class="badge-format blue">Solo</span>
    <span class="card-title">Guitar + vocals</span>
    <ul class="feat">
      <li><i class="material-icons">check</i> Feature one</li>
      <li><i class="material-icons">check</i> Feature two</li>
    </ul>
  </div>
</div>
```

```css
.m-card {
  height: 100%;
  border-radius: 18px !important;
  box-shadow: 0 2px 6px rgba(0,0,0,.06), 0 10px 26px rgba(0,0,0,.04) !important;
  transition: transform .25s ease, box-shadow .25s ease;
  overflow: hidden;
  border-top: 4px solid var(--yellow);
}

.m-card.b-blue { border-top-color: var(--blue); }
.m-card.b-cyan { border-top-color: var(--cyan); }
.m-card.b-green { border-top-color: var(--light-green); }

.m-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 18px rgba(0,0,0,.1), 0 20px 44px rgba(0,0,0,.08) !important;
}
```

---

## Navigation

```css
nav.top {
  background: #fff;
  box-shadow: 0 1px 0 var(--line), 0 2px 10px rgba(0,0,0,.04);
}

nav.top .brand-logo {
  color: var(--ink);
  font-weight: 800;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

nav.top .brand-logo img {
  height: 32px;
  width: auto;
  border-radius: 6px;
}

nav.top .nav-book {
  background: var(--yellow);
  color: var(--btn-ink) !important;
  border-radius: 22px;
  margin: 14px 0 0 8px;
  padding: 0 22px;
  height: 36px;
  line-height: 36px;
  font-weight: 800;
}
```

**Key decisions:**
- White nav bar with subtle shadow
- Logo image 32px height with rounded corners
- "Book" button is yellow pill shape (22px radius)
- Mobile sidenav enabled with Materialize's built-in component

---

## Social Links Section

```html
<div class="social">
  <a href="..." target="_blank" rel="noopener">Facebook</a>
  <a href="..." target="_blank" rel="noopener">Instagram</a>
  <a href="..." target="_blank" rel="noopener">X / Twitter</a>
  <a href="..." target="_blank" rel="noopener">LinkedIn</a>
</div>
```

```css
.social a {
  border: 1.5px solid rgba(13,43,71,.28);
  border-radius: 999px;
  padding: 10px 22px;
  color: #0d2b47;
  font-size: .92rem;
  font-weight: 700;
  transition: all .2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,.35);
}

.social a:hover {
  background: #fff;
  border-color: #0d2b47;
}
```

---

## Contact Section

Gradient background with prominent email/phone:

```html
<section id="book" class="contact">
  <div class="container">
    <div class="section-eyebrow">Booking</div>
    <h2>Let's fill the room.</h2>
    <p class="em">
      <a href="mailto:info@cosmicbluesband.com">info@cosmicbluesband.com</a> · 
      <a href="tel:9293617136">929-361-7136</a>
    </p>
    <!-- CTA buttons -->
    <!-- Social links -->
  </div>
</section>
```

```css
.contact {
  background: linear-gradient(135deg, var(--blue) 0%, var(--cyan) 100%);
  color: var(--ink);
  text-align: center;
}

.contact .em a {
  color: #0d2b47;
  font-weight: 800;
  border-bottom: 2px solid rgba(13,43,71,.35);
}

.contact .em a:hover {
  border-color: var(--ink);
}
```

---

## File Structure

```
cosmic-ray-epk/
├── index.html          # Main EPK page
├── EPK.md              # Markdown version (for reference)
├── images/
│   ├── cosmicbluesband.png       # Logo (hero + nav)
│   ├── cosmic-blues-band.png     # Band photo
│   ├── bbkings_n.jpg             # B.B. King's performance
│   ├── fullhousebbkings.jpg      # Crowd shot
│   ├── anncrowdpic2.jpg          # Packed room
│   ├── cosmic-ray-stage.jpg      # On stage
│   └── cosmicray.jpg             # Live performance
└── .git/
```

---

## Deployment

**GitHub Pages:**
- Branch: `main`
- Root directory: `/`
- URL: https://raymondbernard.github.io/cosmic-blues-epk/

**Commit conventions:**
- Descriptive messages including what changed
- Include image updates in same commit as HTML references
- Example: `"Update gallery with 6 images, remove BandMix, update email"`

---

## Accessibility Notes

- All images have descriptive `alt` text
- Captions provide context for screen readers when modal opens
- Keyboard navigation: Escape closes modal, Tab cycles through focusable elements
- Color contrast meets WCAG AA for body text (muted on white)
- Links have visible hover states and underline on email links

---

## Performance Tips

- Use JPEG for photos (smaller file size than PNG)
- PNG only for logos with transparency
- Lazy loading on video iframes (`loading="lazy"`)
- Materialize CSS from CDN (cached across sites)
- No external JS dependencies beyond Materialize

---

## Version

v1.0 — 2026-07-19
Based on cosmic-ray-epk deployment at https://raymondbernard.github.io/cosmic-blues-epk/
