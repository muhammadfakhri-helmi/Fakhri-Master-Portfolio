# Design system — Fakhri Master Portfolio

Written before implementation and kept in sync with `src/styles/`. This site introduces
Muhammad Fakhri Helmi and sends visitors to his separate case-study websites.

> **Since 28 Sep 2026** the page follows the CV-mapped rebuild described in §12. Where §1,
> §2, §7 or §8 describe the first version (portrait gestures in the WIMS and INPEX
> features, four-project index), §12 takes precedence. Palette, type, spacing and the
> hero are unchanged.

## 1. Audience and job

- **Audience:** recruiters and technical decision makers in Drilling Engineering, Well
  Services, Well Integrity, Technical Support and Project Coordination.
- **First viewport must answer:** who Fakhri is (name, face, petroleum engineer), what he
  does (field operations + project coordination + practical digital tools), and where to
  look next (selected-work index and CTA).
- **One primary action:** `Explore selected work` → the four project features → the
  separate public case-study sites. Secondary action: LinkedIn (the only verified public
  contact method).
- **Sentence a visitor should remember:** *a petroleum engineer who connects field
  operations, project coordination and the digital tools in between.*

## 2. Visual thesis

**A person connecting field engineering, project coordination and digital tools.**
Fakhri himself is the human anchor. Every project is either *presented by him* (his
gesture lands on the evidence) or *explained by an original technical drawing*. Nothing
else competes with him: no icon walls, no pill clouds, no stock imagery, no testimonials.

**Signature — gesture-anchored evidence.** Each character sequence ends on a gesture that
points at something true:

| Sequence | Final gesture | What sits in the gesture's negative space |
| --- | --- | --- |
| `intro` (hero) | arms crossed, facing the viewer | name to the left of the head, positioning line to the right |
| `wims` | both open palms presenting to his right (screen left) | the WIMS readout — led by the operable-valve KPI (63.2% → 68.0%), then visits, records and crews — bracketed by a thin hi-vis callout line from both hands |
| `inpex` | index finger pointing to screen right | the study deliverable callout, joined by a leader line from the fingertip |

The callout lines borrow the language of engineering drawings (leader line, node, label).

## 3. Palette (roles, not decoration)

| Token | Hex | Role |
| --- | --- | --- |
| `--deep` | `#0A111D` | Deep water. Page background (navy-charcoal). |
| `--hull` | `#0F1829` | Raised surfaces: readouts, timeline rows, diagram panels. |
| `--rule` | `#22324B` | Hairlines, borders, diagram strokes. |
| `--vellum` | `#F2EEE6` | Primary text. Warm white, never pure white. |
| `--steel` | `#9DA8BA` | Secondary text and labels (7.9:1 on `--deep`). |
| `--hivis` | `#E8622A` | **The one accent** — hi-vis orange of field PPE and safety signage, carried over from Fakhri's earlier brand orange (5.6:1 on `--deep`; button text on it is `--deep`). |
| `--rim` | `#2C4F7F` | Not an accent: the photo's own blue rim light, extended into a restrained halo behind the cutout so he sits *in* the scene. Never used for text or UI. |

Where the accent is allowed — and nowhere else: the primary action and link underlines;
live figures (readout label, the "26" of the INPEX deliverable); the gesture callout
lines; focus rings; the work-index numbers; **one** emphasised phrase in the hero
statement and in the About pull statement; the critical zones of the technical drawings
(build section, buckling, drag, compression, "My scope"). Dates, bullets and borders stay
neutral (pruned during the polish pass).

Contrast rules: body text ≥ 4.5:1, focus ring 2 px `--hivis` with 3 px offset.

## 4. Typography

| Role | Face | Why |
| --- | --- | --- |
| Display | **Sofia Sans Extra Condensed** (variable, 600–800) | Tall, condensed verticals let an oversized name sit beside his head without touching it; reads like equipment tags and site signage, but with humanist warmth. Used for the name, section and project titles, big numerals. |
| Body | **IBM Plex Sans** (variable, 400–600) | Engineering-born, calm and very legible at 16–18 px on dark backgrounds. |
| Mono | **IBM Plex Mono** (400/500) | Technical labels only: eyebrows, units, sources, diagram labels, dates. |

Contrast is on one axis only (extra-condensed vs normal width). All fonts are self-hosted
(Latin subset) — no third-party font requests.

Scale (fluid `clamp()`): name `≈ 4.5–9.5 rem` (fitted to the space beside the head with
container units), section title `2.6–5 rem`, project title `2–3.25 rem`, lead `1.2–1.5 rem`,
body `1–1.0625 rem` (line-height 1.6, max ≈ 68 ch), label `0.75 rem` mono uppercase,
tracking `0.12em`. Figures use tabular lining numerals.

## 5. Spacing, shape, depth

- 8-point rhythm: `8 16 24 32 48 64 96 128` (`--s1 … --s8`); section padding `96–160 px`.
- Gutters: 64 px desktop, 40 px tablet, 16 px mobile. Content max width 1312 px.
- Radius: 2 px on panels (engineering-drawing crispness), 999 px only on the CTA buttons.
- Depth comes from light, not shadows: `--hull` surfaces + `--rule` borders.

## 6. Layout silhouette (scroll rhythm)

Alternating editorial structures — person, drawing, person, drawing:

```
HERO        [ name      ( FIGURE )   statement ]   centred cutout, asymmetric type
            [ intro+CTA ( intro  )   work index]
ABOUT       [ pull statement | narrative | facts ]  text-led, calm
01 WIMS     [ text column |  readout ][ FIGURE ]    figure right, gesture points left
02 THESIS   [ ======== wide well-section drawing ======== ]  drawing band + 3 text columns
03 INPEX    [ FIGURE ][ title / callout / text ]    figure left, finger points right
04 SIMPRUG  [ ======== field-to-value chain ======== ]       drawing band + 3 text columns
EXPLORE     [ small SVG | Alpha-05 sentence + link ] compact, clearly secondary
EXPERIENCE  [ year | role & organisation | what I did ] + capabilities in 3 groups
CONTACT     [ closing statement + CTA | contact card: LinkedIn, base, availability ]
```

The reference site's swipe gallery is translated into a numbered, anchored editorial
sequence (indexed from the hero) so no project is hidden behind a carousel or hover.

## 7. Image usage

- Only the supplied character frames, as WebP derivatives with bit-exact alpha
  (`public/character/`, see `docs/ASSET_MANIFEST.md`). Intro in the hero, `wims` in
  feature 01, `inpex` in feature 03 — never reused elsewhere.
- `object-fit: contain`, aspect ratio 1122 × 1402 reserved, bottom edge faded into the
  page so the cropped torso never ends on a hard line. Face and hands are never covered.
- Drillstring, Simprug and Alpha-05 use **original inline SVG/CSS drawings**, labelled
  as conceptual. No reports, screenshots, well data or client material.
- Contact sheet and motion preview are references only and are not shipped.

## 8. Motion logic

- **One component:** `<character-sequence sequence="intro|wims|inpex">`
  (`src/character/character-sequence.ts`, data in `sequences.ts`).
  Plays once when ≥ 50 % of the figure is on screen and the tab is visible; holds from
  `motion-config.json`; 180 ms crossfade (incoming frame fades in on top, outgoing fades
  out underneath after 60 ms — measured coverage never drops below 0.99, so the body
  never turns see-through); final frame stays; only the next frame is preloaded; a
  hidden tab pauses the timeline (and a sequence never starts while hidden).
- **Static first:** the hero HTML shows frame 01, a complete pose. The WIMS and INPEX
  figures ship their *final* pose in the HTML, so without JavaScript the gesture still
  matches its evidence; with JavaScript they rewind to their first frame while off
  screen, then play when reached.
- **Reduced motion:** each sequence shows its *own* final frame immediately (intro 03,
  wims 06, inpex 10) via `<picture media="(prefers-reduced-motion: reduce)">`; evidence
  is visible at once; no transforms.
- **Evidence reveal:** the WIMS readout and its bracket appear with frame 06; the INPEX
  callout appears with frame 09; on frame 10 the "26" is underlined and the leader line
  draws from the fingertip (measured at 97.7 % × 36.5 % of the frame) to the callout —
  straight when aligned, one clean elbow when a long title pushes the callout down.
  Without JS the evidence is simply visible.
- **Page motion:** name line-mask reveal on load (≤ 700 ms), sections fade up 16 px once,
  drawings draw on once. Hover/focus 160–240 ms. Shared easing `cubic-bezier(.22,1,.36,1)`.
  No endless loops; no scroll-jacking.

## 9. Desktop / tablet / mobile

| Width | Hero | Features |
| --- | --- | --- |
| ≥ 1180 px | centred cutout, name left of head, statement right, CTA + index in lower corners | text and figure side by side; readout between the palms, callout on the finger's line, callout lines drawn |
| 900–1179 px | copy left, figure right (pinned to the first viewport), work index as a 4-column strip below | WIMS: text above, figure + bracketed readout below; INPEX: figure left, callout + text right, elbow leader |
| < 900 px | stacked: name, statement, figure with CTA over its faded base; index after | single column; readout/callout below the figure (readout as a 2 × 2 grid); callout lines hidden; drawing labels replaced by numbered pins + legend |

Header collapses into an accessible menu button below 760 px. No horizontal scroll at
390 px; touch targets ≥ 44 px; body text ≥ 16 px.

## 10. Components and states

Buttons (primary hi-vis, ghost outline), text links with animated underline, index
links, readout, callout, diagram figure + legend, timeline row, capability group. Every
interactive element has hover, `:focus-visible` (2 px hi-vis ring) and active states;
external links carry an ↗ icon and a visually hidden "opens in a new tab" note.

## 11. Two languages

- **English at `/`, Bahasa Indonesia at `/id/`** — two real static pages rendered from
  one template (`src/page.html`) and two dictionaries (`src/i18n/en.ts`, `id.ts`), so
  both work without JavaScript and are indexed separately (`lang`, `og:locale`,
  `hreflang` + canonical once `VITE_SITE_URL` is set).
- **Switch:** an `EN | ID` pill in the header (current language filled in vellum), also
  visible on phones. It keeps the reader on the section they are reading.
- **Voice:** first person in both. Indonesian keeps the industry terms Indonesian teams
  use in English (well integrity, wellhead, X-mas tree, drillstring, torque, drag,
  buckling, HWDP, BHA, P&L, HSE, JSA) and follows the wording of Fakhri's own Indonesian
  thesis site ("Merancang untuk gaya yang tak terlihat", "Tugas akhir S1").
- **Numbers:** each page uses its own format (63.2% / 63,2%; 7,713 / 7.713).
- **Outbound links:** the drillstring link opens the thesis site's Indonesian version from
  `/id/`; English-only case studies say so on the Indonesian page.
- **Layout:** Indonesian copy runs longer; the hero statement, nav, buttons, readout and
  contact card were checked in both languages at every breakpoint.
- **Link previews:** `og-image.jpg` (English) and `og-image-id.jpg` (Indonesian).

## 12. CV-mapped rebuild (28 Sep 2026)

**Job, restated.** Within 60–90 seconds a recruiter should know: Petroleum Engineering
graduate; Asia Serv Future Leader alumnus; drilling and well operations, well integrity,
field coordination, technical data and client-facing delivery; ready for junior roles.
Primary action: *Explore experience*. Secondary: *Download CV*, LinkedIn.

**Signature, restated — evidence you can open.** The portrait now appears once, in the
hero. Every role is followed by the work itself: views of the public case-study sites in
a quiet browser frame, which can be explored live without leaving the page. The frame is
deliberately plain (one hi-vis dot, a mono URL, an outlined *Open*) so the captured view
carries the colour.

**Section order = CV order, in three explicit categories.** Hero → career snapshot →
**work experience** (PT Asia Serv Indonesia: workstreams A–D; PT Pertamina Drilling
Services Indonesia) → **academic experience** (Universitas Pertamina, thesis, capstone,
student leadership) → **professional affiliation** (JDS Alpha-05) → digital evidence →
about (voice, competencies, skills, training, languages, mobility) → contact. Each
category head opens with a 3 px hi-vis bar and a plain title ("Work experience",
"Academic experience", "Professional affiliation"). Navigation: Work experience ·
Academic experience · Digital evidence · About · Contact. The hero index groups its six
items the same way (category column on desktop, three columns on tablet).

**Workstream anatomy** (every role and project reads the same way):

1. Meta line (mono, workstream key in a hi-vis ring) and a condensed display headline.
2. **Impact strip** — the CV numbers first, display figures over steel labels, one row
   from 1000 px, two columns below.
3. **Story** — Problem · My role / contribution · Actions · Outputs, then tools and a
   small steel note that states the evidence boundary.
4. **Evidence** — a window, a card rail, a matrix or an explainer; beside the story from
   1000 px (sticky while the story is read, when the viewport is at least 820 px tall),
   after it on phones.

**Employer identity bar.** Org name (display), role, dates (mono) on one line; sticky
under the site header from 900 px while that employer's workstreams scroll by; normal
flow on phones.

**Evidence window** (`.ev-window`): chrome bar → tabs (ARIA tabs, arrows/Home/End) →
16:10 stage → per-view caption → provenance line. Views crossfade (360 ms; the outgoing
view stays opaque underneath, so there is never an empty frame). Windows marked
`data-autoplay` tour their views every 5.2 s while half on screen — a hi-vis line fills
under the active tab; hover or focus holds it, choosing a tab or the pause button stops
it; never with reduced motion. *Explore live* (hi-vis pill, bottom-right of the view)
opens the live site in one modal dialog; the iframe exists only while it is open.

**Scroll-told stages** (INPEX): the window is sticky on the left from 900 px; the four
numbered stages scroll on the right and the one crossing mid-screen selects its view.
Inactive stages dim to 45 %. On phones the window is not sticky and only its tabs drive it.

**Measurable assessment table** (INPEX): area (display) · measurable evidence · result
(display figure + text), mono caption in hi-vis; only the rate (26/26) is hi-vis. On
phones each row becomes a card: area label, result, evidence.

**Public-safe diagrams.** Everything drawn in HTML/SVG states only what the CV states:
OSES cards (execution loop, cadence 84→120, readiness gates, invoice bars, 4.20/5 meter),
the readiness matrix (a dot = recorded, a dash = not recorded), the PDSI explainer
(labelled illustrative), the INPEX comment tracker (26 squares, no content), the fiscal
switch (radio pills; bars dim the regime not selected).

**Accent budget.** Hi-vis stays for action (*Explore live*, primary buttons), the live
dot, workstream keys, the selected tab line, and the one number that matters in a
diagram (NPT block, MWD, the "after" invoice bar, Gross Split bars). Tables and cards
otherwise stay vellum/steel.

**Phones.** One column; tables become cards (row header first, then each labelled cell;
unrecorded gates omitted); the OSES cards become a horizontal snap rail; window tabs
scroll sideways; the live dialog fills the screen. Single-column grids use
`minmax(0, 1fr)` so a scroller inside never widens the page (verified at 320 px).

