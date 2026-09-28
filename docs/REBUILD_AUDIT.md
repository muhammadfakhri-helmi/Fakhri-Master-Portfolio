# CV-mapped rebuild — audit and change log

Brief: `Fakhri_Portfolio_CV_Mapped_Rebuild_Prompt.md` (28 Sep 2026), plus Fakhri's
request of the same day: replace his portrait in the WIMS and INPEX features with
views of the linked 3D case studies, so a recruiter sees the work itself.
Source of every fact: the latest CV (28 Sep 2026) — see `CONTENT_SOURCES.md`.

## 1. Audit of the page before the rebuild

| Area | Before | Gap against the brief |
| --- | --- | --- |
| Architecture | Hero → About → four projects (WIMS, thesis, INPEX, Simprug) → Alpha-05 aside → experience timeline → capabilities → contact | Project-first, not CV-first. PT Asia Serv appeared only as a timeline row; PDSI had two bullets; leadership, training and mobility were missing. |
| Navigation | Work · About · Experience · Contact | Needs Experience · Technical work · Digital evidence · About · Contact. |
| Hero | Statement about connecting field, projects and tools; 4-item index; no CV | Positioning line, supporting paragraph, *Download CV*, 6-item index. |
| Metrics | Headline KPI "operable valve 63.2 % → 68.0 %"; 84/month; 7,713; 1,418; 2 crews | The KPI is not in the latest CV → removed. Missing: >1,100 visits, peak 120, ~735 wells, 5–6 reports/day, 4.20/5, tenders, readiness, first-time personnel, contract transition, invoice cycle. |
| INPEX | "26 client comments closed" callout pointed at by the portrait | Must lead with interpretation, interface coordination, action resolution, report issuance and 3D communication. Boundary note existed and is kept. |
| Visuals | Portrait sequences in the WIMS and INPEX features | Replace with digital evidence (Fakhri's request). Hero portrait kept ("preserve cutout portraits"). |
| Digital evidence | Outbound links only | Every main experience needs a visible preview. |
| Alpha-05 | "Independent 3D mockup" aside | Professional affiliation: Jakarta Drilling Society, active member. |
| Contact | Site · rotation · offshore | CV: field/site, rotation, shifts, relocation, deployment across Indonesia; CV download. |
| Skills | Three capability lists | Add Compass, StressCheck, EDM, Power BI, training and certifications, languages. |

## 2. Decisions

- **Job title** stays "Project Coordinator, Well Integrity". The brief writes "Project &
  Technical Coordinator — Well Integrity and Technical Studies", but on 28 Sep 2026
  Fakhri told us to follow the WIMS website. Flagged for him to confirm.
- **Operable-valve KPI** (63.2 % → 68.0 %) removed: the brief marks it unverified and
  the latest CV no longer carries it.
- **Role labels inside Asia Serv** follow the CV and the brief: "Technical analysis
  support and client–consultant interface" (INPEX), "Economic analysis contributor"
  (capstone), "Active member" (JDS).
- **Layout**: each workstream shows its metrics directly under the headline (role and
  impact first), then the story on one side and the evidence on the other. A
  three-column desktop layout would have shrunk the 3D previews below readable size.
- **Previews** are posters captured from the public sites
  (`scripts/evidence/capture.mjs`); the live site loads in a dialog only when asked.
- **CV download**: the latest CV with the recruiter-specific footer and title replaced
  (`scripts/make_public_cv.py`).

## 3. Change log

**Content architecture.** Hero → career snapshot → professional experience → technical
work → digital evidence → about → contact, in CV order. Navigation: Experience ·
Technical work · Digital evidence · About · Contact. Hero index now lists six items.

**Role names.** PT Asia Serv Indonesia shown as the employer with the Asia Serv Future
Leader Program; PHE OSES and INPEX Masela as projects under it. Role kept as "Project
Coordinator, Well Integrity" (pending Fakhri's confirmation, see §2). New labels: INPEX
"Technical analysis support and client–consultant interface"; thesis "Undergraduate
Researcher — Drilling Mechanics"; capstone "Economic Analysis Contributor"; JDS "Active
Member — Alpha-05 Integrated Drilling Project"; PDSI "Drilling Engineer Intern".

**INPEX story.** Leads with interpretation of study outputs, client–consultant
coordination, action resolution, report issuance and 3D communication. The headline
impact is "26 multidisciplinary review comments converted into traceable technical
actions and resolved — supporting issuance of a 94-page engineering report". Four
scroll-told stages (Inputs → Analysis themes → Technical response → Issued deliverable)
beside the 3D story; the contribution boundary is stated in both languages.

**Added sections.** Career snapshot with nine CV figures; Workstream A (PHE OSES
operations); Workstream D (delivery readiness, matrix); PDSI as a full experience with a
DDR / NPT / BHA explainer; education card; three-design comparison; fiscal-regime switch
with KPI cards; digital-evidence index; leadership experience; core competencies,
skills, training, languages and mobility; *Download CV* in header, hero and contact.

**Digital previews.** Portraits in the WIMS and INPEX features replaced by evidence
windows (Fakhri's request): WIMS (five views), INPEX (four stages, one drawn in HTML),
Alpha-05 (four views); preview cards for the thesis and Simprug sites; all five in the
evidence index. Every window can load its live site in the page (*Explore live*).
Portrait kept in the hero only; frames 04–10 retired.

**Removed claims.** Operable-valve KPI (63.2 % → 68.0 %); the "26 client comments closed"
callout framing; older-CV figures not in the latest CV (margin, upselling, TKDN,
safe man-hours, IWCF).

**Responsive and accessibility checks.** 1440 × 900, 1024 × 768, 768 × 1024, 390 × 844
and 320 px in both languages with no horizontal overflow; reduced motion, no JavaScript,
keyboard (tabs pattern, dialog focus return, Esc), language switch and console all
verified — details in `RELEASE_CHECK.md`.

## 4. Update after Fakhri's review (28 Sep 2026)

- **INPEX measurable assessment.** The four-figure strip is replaced by his six-row
  table — review closure 26/26 (100 %), deliverable control (1 final 94-page report),
  workstream coordination (2 engineering-study workstreams), change control (1 signed
  scope variation), stakeholder interface (3-party), technical communication (1
  interactive 3D model). The contribution paragraph now names the same facts.
- **Work vs academic.** Three clearly titled categories, each opened by a hi-vis bar:
  *Work experience* (PT Asia Serv Indonesia, PT Pertamina Drilling Services
  Indonesia), *Academic experience* (Universitas Pertamina, thesis, capstone, student
  leadership — moved here from About) and *Professional affiliation* (Jakarta Drilling
  Society, Alpha-05). Navigation: Work experience · Academic experience · Digital
  evidence · About · Contact. The hero index and the digital-evidence cards carry the
  same categories.
