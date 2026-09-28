# Fakhri Master Portfolio

The recruiter-facing portfolio of **Muhammad Fakhri Helmi** — petroleum engineer in
drilling & well operations, well integrity and technical project coordination. The page
follows his latest CV: every role shows the problem, what he owned, the measurable
evidence and something a recruiter can open — views of his public case-study websites,
explorable live on the page.

- **Two languages:** English at `/`, Bahasa Indonesia at `/id/`, with an EN / ID switch
  that keeps the reader on the same section.
- Static pages, **Vite 8 + TypeScript**, no UI framework. ≈ 3.6 KB JS and 7.9 KB CSS
  (gzip), self-hosted fonts, no third-party requests.
- The hero plays his own motion character once (`<character-sequence>`); the work
  sections show **evidence windows** — captured views of the linked case studies with
  tabs and an *Explore live* dialog that loads the real site on request.
- A **Download CV** button serves his latest CV (recruiter-specific footer generalised).
- Works without JavaScript and with `prefers-reduced-motion`.

Design rationale: [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) ·
assets: [`docs/ASSET_MANIFEST.md`](docs/ASSET_MANIFEST.md) ·
facts and their sources: [`docs/CONTENT_SOURCES.md`](docs/CONTENT_SOURCES.md) ·
release/privacy check: [`docs/RELEASE_CHECK.md`](docs/RELEASE_CHECK.md) ·
CV-mapped rebuild audit and change log: [`docs/REBUILD_AUDIT.md`](docs/REBUILD_AUDIT.md)

## Sections

1. **Hero** — name, positioning, supporting paragraph, *Explore experience* / *Download CV*
   / LinkedIn, six-item work index, intro sequence.
2. **Career snapshot** — one narrative and nine CV-backed figures.
3. **Work experience** — PT Asia Serv Indonesia (Asia Serv Future Leader Program) with
   four workstreams: A · PHE OSES operations (evidence cards), B · WIMS (evidence
   window), C · INPEX Masela (measurable-assessment table, scroll-told stages beside the
   3D story), D · delivery readiness (readiness matrix); then PT Pertamina Drilling
   Services Indonesia (DDR / NPT / BHA explainer). A sticky identity bar keeps employer,
   role and dates in view.
4. **Academic experience** — Universitas Pertamina; drillstring thesis (drawing +
   three-design table); field-development economics (chain + fiscal-regime switch);
   student leadership.
5. **Professional affiliation** — Jakarta Drilling Society, Alpha-05 (evidence window).
6. **Digital evidence** — the five public case studies in one grid.
7. **About** — his own voice, competencies, skills, training, languages and mobility.
8. **Contact** — e-mail, WhatsApp, LinkedIn and the CV.

## Run it

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
```

```bash
npm run dev
```

Opens on http://localhost:5188. Other scripts:

| Script | What it does |
| --- | --- |
| `npm run build` | Production build into `dist/` (relative asset paths, no source maps) |
| `npm run preview` | Serves `dist/` on http://localhost:5189 |
| `npm run typecheck` | `tsc --noEmit` (strict) for the browser code and for the Node build code |
| `npm run check` | Privacy/release check of the source tree |
| `npm run check:dist` | Same check on `dist/`, plus "every referenced asset exists" |
| `npm run verify` | typecheck → check → build → check:dist (what CI runs) |

## Project layout

```
src/page.html                  the page template shared by both languages
src/i18n/en.ts, id.ts          all wording, one key per text (TypeScript checks both have every key)
build/i18n-pages.ts            Vite plugin: renders the template into the two pages
index.html, id/index.html      page entries for English and Bahasa Indonesia (rendered, do not edit)
src/main.ts                    entry: styles + behaviours
src/character/sequences.ts     frame order and timing from motion-config.json
src/character/character-sequence.ts   the <character-sequence> web component
src/lib/evidence-window.ts     evidence-window tabs, crossfade and the preview tour
src/lib/live-dialog.ts         "Explore live": one dialog, iframe only while open
src/lib/steps.ts               INPEX stages: the step in view selects the window tab
src/lib/fiscal.ts              Gross Split / Cost Recovery switch
src/lib/header.ts, reveal.ts   header state, menu, section spy, scroll reveals
src/styles/                    fonts, tokens, base, sections, work, evidence
public/character/              9 WebP derivatives of the intro frames (alpha preserved)
public/evidence/               15 posters × 2 widths captured from the public case studies
public/cv/                     the CV served by "Download CV" (pinned by hash)
public/og-image.jpg, og-image-id.jpg, favicon.svg
scripts/make_derivatives.py    rebuilds the WebP frames from the original PNGs
scripts/evidence/capture.mjs   captures the case-study views (headless Edge/Chrome)
scripts/evidence/make_posters.py  turns the captures into WebP posters + manifest
scripts/make_public_cv.py      generalises the latest CV for publication
scripts/check.mjs              privacy / release gate
scripts/og/og.html             source of the link-preview image
docs/                          design system, asset manifest, sources, release check
```

## Editing text (both languages)

All wording lives in `src/i18n/en.ts` and `src/i18n/id.ts`; the markup lives once in
`src/page.html`, where each text is a double-brace placeholder such as `hero.lede`.
To change a sentence, edit the same key in both dictionaries. To add a new text, add the
key to `en.ts` first — `npm run typecheck` then fails until `id.ts` has it too, and the
build fails on any placeholder without a value. Numbers follow each language's format
(English `7,713` / Indonesian `7.713`). The dev server reloads on every change.

## The motion component

Since the CV-mapped rebuild only the hero uses it (`sequence="intro"`).

```html
<character-sequence sequence="intro" role="img" aria-label="One sentence describing the pose.">
  <picture>
    <source media="(prefers-reduced-motion: reduce)" type="image/webp" srcset="…final frame…" sizes="…" />
    <img src="…" srcset="…" sizes="…" width="1122" height="1402" alt="" loading="lazy" />
  </picture>
</character-sequence>
```

- `sequence` (attribute or property): defined in `src/character/sequences.ts`. To add
  one, add its frames there and the WebP files in `public/character/`.
- Add `data-static-final` when the HTML image is the final pose (below-the-fold figures):
  the component rewinds to the first frame while off screen.
- Events (bubbling): `sequence:frame` (`detail.index`, `detail.frame`) and
  `sequence:complete`.

## Update the character frames

The original PNG frames live outside this repository and are never committed.

```bash
python scripts/make_derivatives.py --src "<folder containing the frame PNGs>"
```

## Update the case-study previews

The posters are views of the live public sites. After one of those sites changes:

```bash
node scripts/evidence/capture.mjs "<scratch folder>"
```

```bash
python scripts/evidence/make_posters.py --src "<scratch folder>"
```

`capture.mjs` lists every view (site, section or chapter, wait time); `make_posters.py`
publishes only the ids in its `POSTERS` table and records them in
`docs/evidence-manifest.json`. Check each new poster before publishing: the WIMS site also
shows figures this site deliberately leaves out (see `docs/CONTENT_SOURCES.md`).

## Update the CV

```bash
python scripts/make_public_cv.py --src "<the latest CV PDF>"
```

It replaces a recruiter-specific footer with "Curriculum Vitae", rewrites the metadata,
refuses to write if a private term is still in the text, and pins the file's SHA-256 in
`docs/public-cv.json`. Requires PyMuPDF (`pip install pymupdf`).

## Privacy check

`npm run check` fails on raw documents (pdf, xlsx, csv, docx, zip…), local absolute
paths, e-mail addresses, phone numbers, tokens and keys, internal document links, source
maps, and any term listed in `.privacy-terms.local.txt` — a **git-ignored** file with one
private term per line (well and platform names, colleagues' names, commercial and
personal identifiers). Keep that file local; the check still runs without it in CI.
The one document allowed through is `cv/Muhammad-Fakhri-Helmi-CV.pdf`, and only while
its SHA-256 matches `docs/public-cv.json`.

## Deployment

Live on GitHub Pages since 28 Sep 2026 (published at Fakhri's request):

- English: https://muhammadfakhri-helmi.github.io/Fakhri-Master-Portfolio/
- Bahasa Indonesia: https://muhammadfakhri-helmi.github.io/Fakhri-Master-Portfolio/id/
- Repository: https://github.com/muhammadfakhri-helmi/Fakhri-Master-Portfolio

Every push to `main` runs `.github/workflows/deploy-pages.yml`: `npm run verify`
(typecheck, privacy check, build, dist check) with `VITE_SITE_URL` set to the Pages URL —
which makes the canonical, hreflang and link-preview URLs absolute — then publishes
`dist/`. A failing privacy check stops the deployment.

The build uses relative paths (`base: "./"`), so the same `dist/` works at a project
sub-path or at the root — verified by serving it under `/Fakhri-Master-Portfolio/`.
For any other host, upload `dist/` as static files and set `VITE_SITE_URL` in `.env`
before building.

## Contact methods

Published at Fakhri's request (28 Sep 2026): e-mail `muhammadfakhrihelmi@gmail.com`,
WhatsApp `+62 852-6150-5740` (link `https://wa.me/6285261505740`) and LinkedIn. The
privacy check allows exactly these values (`APPROVED_PUBLIC` in `scripts/check.mjs`) and
still blocks any other e-mail address or phone number.

## Credits and licences

- Character images: Muhammad Fakhri Helmi's own portfolio motion assets — not for reuse.
- Case-study posters: captured from Muhammad Fakhri Helmi's own public websites.
- Fonts: Sofia Sans Extra Condensed, IBM Plex Sans, IBM Plex Mono — SIL Open Font
  License 1.1, via Fontsource.
- Drawings and code: original work for this site.
