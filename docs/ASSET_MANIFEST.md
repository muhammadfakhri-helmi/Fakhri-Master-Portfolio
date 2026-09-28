# Public asset manifest

Everything this repository publishes, where it came from, and what is deliberately
**not** here. Machine-readable detail: [`asset-manifest.json`](asset-manifest.json)
(character frames), [`evidence-manifest.json`](evidence-manifest.json) (case-study
posters) and [`public-cv.json`](public-cv.json) (the CV download).

## Character frames — `public/character/`

Supplied for this portfolio as transparent PNG frames (1122 × 1402) with
`motion-config.json`. The originals stay untouched in the source asset folder outside
this repository; only WebP derivatives ship. Since the CV-mapped rebuild (28 Sep 2026)
only the three hero frames are published — the WIMS and INPEX gesture frames (04–10)
were retired when those features switched to case-study views at Fakhri's request.

```bash
python scripts/make_derivatives.py --src <folder with frame-*.png>
```

Settings: Lanczos resize, WebP colour quality 93, **lossless alpha**, no EXIF/XMP/ICC.

| Frame | Source PNG | Derivatives (`<frame>-<width>.webp`) | Source SHA-256 |
| --- | --- | --- | --- |
| `frame-01-intro-open` | 1.14 MB | 560w 50 KB / 840w 93 KB / 1122w 145 KB | `98e6f0e4218bd4d4…` |
| `frame-02-intro-crossing` | 1.14 MB | 560w 50 KB / 840w 95 KB / 1122w 150 KB | `9b38803780f9d0d8…` |
| `frame-03-intro-final` | 1.16 MB | 560w 48 KB / 840w 97 KB / 1122w 161 KB | `9cd306e539e5be82…` |

Sequence `intro` (hero): 01 → 02 → 03; reduced motion shows 03.

## Case-study posters — `public/evidence/`

Views of Fakhri's own public websites, captured on 28 Sep 2026 with
`scripts/evidence/capture.mjs` (headless browser, 1280 × 800 at 1.5×) and converted by
`scripts/evidence/make_posters.py` to WebP at 800 and 1600 px wide (quality 80, no
metadata). Those sites already use sanitized, fictional or academic data; no internal
screen, real photo or client record was captured. 15 posters, 1.35 MB for both widths;
a visitor loads the 800 px set unless the screen is dense.

| Poster | View | Used in |
| --- | --- | --- |
| `wims-equipment` | WIMS site §06 — interactive wellhead integrity model, fictional findings | WIMS window, tab 1 |
| `wims-dashboard` | WIMS site §05.3 — operational dashboard, fictional values | WIMS window, tab 2; PHE OSES card |
| `wims-attention` | WIMS site §05.4 — need-attention workflow, fictional valve record | WIMS window, tab 3 |
| `wims-archive` | WIMS site §05.6 — report register, fictional wells | WIMS window, tab 4 |
| `wims-planning` | WIMS site §05.7 — visit history and next due, fictional dates | WIMS window, tab 5 |
| `wims-model` | WIMS site opening view — 3D wellhead | Digital-evidence index |
| `inpex-overview` | INPEX 3D story, chapter 01 — system overview and inputs | INPEX stage 1; index |
| `inpex-offset` | INPEX 3D story, chapter 05 — offset limit, operating envelope | INPEX stage 2 |
| `inpex-summary` | INPEX 3D story, chapter 11 — engineering summary | INPEX stage 4 |
| `alpha-rig` | Alpha-05 animation — rig on location | Alpha-05 window, tab 1; index |
| `alpha-bit` | Alpha-05 animation — 12-1/4 in. section, BHA list | Alpha-05 window, tab 2 |
| `alpha-well` | Alpha-05 animation — whole-well section | Alpha-05 window, tab 3 |
| `alpha-complete` | Alpha-05 animation — completion | Alpha-05 window, tab 4 |
| `thesis-top` | Thesis case study — opening view | Drillstring card; index |
| `simprug-top` | Simprug case study — opening view with the 3D field | Economics card; index |

Not captured on purpose: the WIMS site's operable-valve KPI panel, its margin/TKDN/
upselling figures and its "real project record" photographs (people).

INPEX stage 3 ("technical response") is drawn in HTML, not captured: 26 squares for the
26 resolved comments, with no comment content.

## CV — `public/cv/Muhammad-Fakhri-Helmi-CV.pdf`

Fakhri's latest CV (28 Sep 2026), prepared by `scripts/make_public_cv.py`: the
recruiter-specific footer is replaced by "Curriculum Vitae", the metadata is rewritten
and the XMP packet dropped. Every other pixel of both pages is identical to the source
(checked at 72 dpi), and so is the text apart from the footer. 2 pages, 194 KB. The
privacy check lets this file through only while its SHA-256 matches `public-cv.json`.

## Other published files

| File | What it is | Origin |
| --- | --- | --- |
| `public/og-image.jpg` (1200 × 630, 77 KB) | Link-preview image, English page | Rendered from `scripts/og/og.html` (frame 03 + site type) |
| `public/og-image-id.jpg` (1200 × 630, 80 KB) | Link-preview image, Indonesian page | Same source, `og.html?lang=id` |
| `public/favicon.svg` | "F" monogram with hi-vis node | Original, drawn for this site |
| Fonts (Latin subset, WOFF2, bundled by Vite into `assets/`) | Sofia Sans Extra Condensed (40 KB), IBM Plex Sans (46 KB), IBM Plex Mono 400/500 (15 KB each) | `@fontsource` packages, SIL Open Font License 1.1 |
| Inline SVG and HTML diagrams in `src/page.html` | Drillstring well path and load tracks, J-type profile sketch, field-to-value chain, OSES evidence cards, readiness matrix, PDSI explainer, INPEX comment tracker, fiscal comparison, icons | Original drawings; conceptual, no study or operator data |

## Deliberately not in this repository

- The original PNG frames, `motion-contact-sheet.png` and `portfolio-motion-preview.webp`.
- The raw case-study captures (PNG) — only the listed WebP posters ship.
- Any report, thesis PDF, workbook, contract, invoice, internal screenshot,
  well/platform/crew identifier, or source code of the separate project websites. Those
  sites are linked and previewed, not copied.
