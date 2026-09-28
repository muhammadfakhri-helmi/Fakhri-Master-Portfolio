# Release & privacy check — 28 September 2026 (CV-mapped rebuild)

Status: **approved by Fakhri for publication on 28 Sep 2026** — published to GitHub Pages
by `.github/workflows/deploy-pages.yml`.

## Build

`npm run verify` → typecheck (browser + Node build code) ✓ · source privacy check
(87 files) ✓ · `vite build` ✓ · dist check (51 files) ✓

| Output | Size |
| --- | --- |
| `index.html` (English) | 116 KB (22 KB gzip) |
| `id/index.html` (Bahasa Indonesia) | 118 KB (22 KB gzip) |
| JavaScript (shared) | 11.8 KB (4.3 KB gzip) |
| CSS (shared) | 53 KB (11.5 KB gzip) |
| Fonts (4 × WOFF2, Latin) | 116 KB |
| Hero frames (9 × WebP) | 0.8 MB; a visit loads 3 frames at one width |
| Case-study posters (15 × 2 WebP) | 1.35 MB; loaded lazily, 800 px set on most screens |
| CV (PDF) | 194 KB, downloaded only on request |
| **dist/ total** | **3.1 MB** |

No source maps. All asset URLs relative — the Indonesian page uses `../` paths — so the
build works at the root or under `/Fakhri-Master-Portfolio/`. On load the pages request
files from their own origin only (21 requests during a full scroll at 1440 px, none
failed, no iframe). A third-party page loads only inside the live dialog, after a click.

## Privacy gate (`scripts/check.mjs`)

Passed on the source tree and on `dist/` with the private term list loaded. It blocks raw
documents, local absolute paths, e-mail addresses, phone numbers, keys/tokens, internal
document links, source maps and private terms. Exceptions, each exact:

- the contact details Fakhri asked to publish (e-mail and WhatsApp);
- `cv/Muhammad-Fakhri-Helmi-CV.pdf`, only while its SHA-256 matches `public-cv.json`
  (the script that makes it refuses to write if a private term is in the text).

Also confirmed: posters and frames carry no metadata; the CV carries rewritten metadata
and no XMP; no raw capture, workbook, report, internal screenshot, contract value or
client record is in the repository.

## Content checks

| Check | Result |
| --- | --- |
| Every figure traced to the latest CV or a named public page | `CONTENT_SOURCES.md` |
| Operable-valve KPI | Removed (not in the latest CV; the brief marks it unverified) |
| Specialist simulations | Attributed to the consultant in the INPEX boundary note, both languages |
| Readiness matrix | Only gates the CV records; the rest shown as "not recorded" |
| PDSI explainer | Labelled a sanitized workflow visualization, no operator data |
| Leadership | Under *Academic experience* as student organisations, not employment; CV entries kept as combined |
| Categories | Work experience, academic experience and professional affiliation are separate, titled sections |
| INPEX KPIs | Six rows from Fakhri's measurable-assessment table; table on desktop, cards on phones |

## Browser checks (headless Edge and the app's browser, production build)

| Check | Result |
| --- | --- |
| 1440 × 900 | Every section reviewed; sticky employer bar, sticky evidence windows and INPEX stages behave |
| 1024 × 768 (EN and ID) | No overflow; hero CTAs on one row inside the first viewport (bottom 710 / 737 px) |
| 768 × 1024 | No overflow; one-column story, two-column evidence cards |
| 390 × 844 | No overflow; tables become cards, OSES cards scroll sideways, menu opens |
| 320 px (EN and ID) | No horizontal overflow (layout viewport = 320) |
| Evidence windows | Tabs switch views (click, arrows, Home/End); tour advances every 5.2 s in view and stops when a visitor takes over; crossfade leaves no empty frame |
| Live dialog | Opens the right page and anchor; focus on *Close*; scroll locked; Close, backdrop and Esc remove the iframe and return focus |
| INPEX stages | The stage crossing mid-screen selects its view; window stays pinned under the employer bar |
| Fiscal switch | Radio group; switches explanation and emphasis |
| Language switch | From `#wims` on the English page, ID opens `/id/#wims` below the sticky bar; from `#leadership`, `/id/#leadership` |
| Header | Five nav items on one line from 1100 px in both languages; menu below |
| Hero fit | Index and CTAs inside the first viewport at 1366 × 768, 1440 × 900, 1536 × 864, 1920 × 1080 (1280 × 720: LinkedIn and item 06 fall 46 px below) |
| Reduced motion | Hero shows frame 03 at once; no tour, no crossfade, no reveal offsets |
| No JavaScript | Fully readable: first view of each window, no dead tabs or live buttons, both fiscal explanations, all stages |
| Keyboard | Skip link → header → hero CTAs → work index → … in visual order, visible focus ring throughout |
| Console | No errors or warnings |

## Outbound links (28 Sep 2026)

WIMS case study, INPEX 3D story, drillstring case study (EN and `/id/`), Simprug case
study, Alpha-05 animation — all 200. LinkedIn answers automated requests with 999 (bot
block); WhatsApp redirects (302) as expected.

## Open items for Fakhri

- **Job title.** The site uses "Project Coordinator, Well Integrity" (his instruction of
  28 Sep: follow the website). The rebuild brief and the latest CV write "Project &
  Technical Coordinator". One line in `src/i18n/en.ts` / `id.ts` (`as.role`) if he wants
  the CV wording.
- **CV file.** The download is the latest (recruiter) CV with the footer generalised; if
  he prefers another file, rerun `scripts/make_public_cv.py` on it.
- The WIMS case-study site still shows figures this site leaves out (53 % → 68 % KPI,
  margin, TKDN, upselling). Not captured in any poster; align that site when it is next
  updated if the latest CV is the reference.
