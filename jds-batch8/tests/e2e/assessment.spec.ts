import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseAnswerMarkdown } from "../../src/lib/markdown.ts";
import { E2E_DIR, SITE_URL } from "./env.ts";

const LONG = "Langkah konkret: memetakan target per kategori, membagi tugas mingguan, dan meninjau progres setiap Jumat bersama tim.";
const EMAIL = ["e2e.kandidat", "contoh.id"].join("@");
const shots = join(E2E_DIR, "screenshots");
mkdirSync(shots, { recursive: true });

/** Collects CSP violations, page errors and any request that leaves the site. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith("blob:") || url.startsWith("data:")) return;
    if (!url.startsWith(SITE_URL) || request.method() !== "GET") problems.push(`request: ${request.method()} ${url}`);
  });
  return problems;
}

async function noHorizontalOverflow(page: Page) {
  const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(scroll, "page must not scroll horizontally").toBeLessThanOrEqual(client);
}

const h2 = (page: Page) => page.getByRole("heading", { level: 2 }).first();
const fill = (page: Page, name: string, value: string) => page.locator(`[name="${name}"]`).fill(value);
const choose = (page: Page, name: string, value: string) => page.locator(`input[type="radio"][name="${name}"][value="${value}"]`).check();
async function next(page: Page, expectedHeading: string) {
  await noHorizontalOverflow(page);
  expect(await page.locator("body").innerText(), "public pages must not name the recruitment lead").not.toMatch(/Ketua|Fakhri/);
  await page.getByRole("button", { name: /^(Next|Review jawaban)/ }).click();
  await expect(h2(page)).toHaveText(expectedHeading);
}
async function fillAll(page: Page, selector: string, value: string) {
  for (const el of await page.locator(selector).all()) await el.fill(value);
}

async function sectionAB(page: Page, name: string, team: "internal" | "external" | "flexible", track?: "internal" | "external") {
  await page.goto(SITE_URL);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Recruitment Committee Assessment");
  await noHorizontalOverflow(page);
  await page.screenshot({ path: join(shots, `${test.info().project.name}-landing.png`), fullPage: true });
  await page.getByRole("button", { name: /Mulai asesmen/ }).click();
  await expect(h2(page)).toHaveText("Personal Background");

  // Next on an empty step shows errors and stays.
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText(/isian yang perlu dilengkapi/)).toBeVisible();

  await fill(page, "personal.fullName", name);
  await fill(page, "personal.university", "Universitas Pertamina");
  await fill(page, "personal.major", "Teknik Perminyakan");
  await fill(page, "personal.graduationYear", "2022");
  await choose(page, "personal.status", "fresh_graduate");
  await fill(page, "personal.email", EMAIL);
  await fill(page, "personal.whatsapp", ["0", "813 0000 1111"].join(""));
  await next(page, "Keahlian & Ketersediaan Waktu");
  await page.getByText("Strategic Planning", { exact: true }).click();
  await page.getByText("Communication", { exact: true }).click();
  await fill(page, "personal.readiestSkill", "Strategic planning untuk menyusun target mingguan.");
  await choose(page, "personal.weeklyHours", "3to5");
  await fill(page, "personal.availableTimes", "Sabtu dan Minggu");
  await next(page, "Team Preference & Commitment");
  await choose(page, "team.preference", team);
  if (track) await choose(page, "team.flexibleTrack", track);
  await fill(page, "team.reason", LONG);
  await fill(page, "team.sharedContribution", LONG);
  await page.screenshot({ path: join(shots, `${test.info().project.name}-team.png`), fullPage: true });
}

async function sectionDAndDownload(page: Page, opts: { leadership: string; reward: "yes" | "maybe" | "no" }) {
  await choose(page, "final.reward.plan", opts.reward);
  if (opts.reward === "yes") {
    await fill(page, "final.reward.nomineeBackground", "Production engineer 4 tahun");
    await fill(page, "final.reward.nomineeReason", "Aktif membina engineer muda dan relevan untuk target experienced.");
    await page.locator('[name="final.reward.transparencyAck"]').check();
  }
  await choose(page, "final.leadership.interest", opts.leadership);
  if (opts.leadership !== "member_only") {
    await fill(page, "final.leadership.readiness", LONG);
    for (const i of [0, 1, 2]) await fill(page, `final.leadership.actions.${i}`, `Tindakan koordinasi nomor ${i + 1} yang terukur`);
  }
  await next(page, "Accountability & Final Commitment");
  await fill(page, "final.accountability", LONG);
  await fill(page, "final.finalCommitment", LONG);
  await choose(page, "final.placement.answer", "conditional");
  await page.locator('[name="final.consent"]').check();
  await next(page, "Review & Download");
  await noHorizontalOverflow(page);
  await page.screenshot({ path: join(shots, `${test.info().project.name}-review.png`), fullPage: true });

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download Assessment (.md)" }).click()]);
  await expect(page.getByText("File jawaban berhasil dibuat")).toBeVisible();
  await page.screenshot({ path: join(shots, `${test.info().project.name}-done.png`), fullPage: true });
  expect(download.suggestedFilename()).toMatch(/^JDS_B8_ASSESSMENT_[0-9A-F]{6}\.md$/);
  const target = join(E2E_DIR, "downloads", `${test.info().project.name}-${download.suggestedFilename()}`);
  await download.saveAs(target);
  return readFileSync(target, "utf8");
}


test("Internal path: case study, coordinator questions, answer file download", async ({ page }) => {
  const problems = watch(page);
  const name = `Internal E2E ${test.info().project.name}`;
  await sectionAB(page, name, "internal");
  await next(page, "Internal · Main Recruitment Strategy");
  await expect(page.getByText("Achieving 300 Participants")).toBeVisible();
  await fillAll(page, 'textarea[name^="internal.strategy."]', LONG);
  await next(page, "Internal · Execution & Coordination");
  await fillAll(page, 'textarea[name^="internal.execution."]', LONG);
  await next(page, "Internal · Recovery Strategy");
  await expect(page.getByText(/Dua minggu sebelum pendaftaran ditutup/)).toBeVisible();
  await expect(page.getByText("Online", { exact: true })).toBeVisible();
  await page.screenshot({ path: join(shots, `${test.info().project.name}-internal-recovery.png`), fullPage: true });
  await fillAll(page, 'textarea[name^="internal.recovery."]', LONG);
  await next(page, "Internal · Personal Contribution");
  await page.getByRole("button", { name: "+ Tambah deliverable" }).click();
  for (const i of [0, 1, 2]) {
    await fill(page, `internal.deliverables.${i}.title`, `Deliverable ${i + 1}`);
    await fill(page, `internal.deliverables.${i}.deadline`, `Hari ke-${(i + 1) * 10}`);
    await fill(page, `internal.deliverables.${i}.indicator`, "Dipakai di weekly meeting");
    await fill(page, `internal.deliverables.${i}.impact`, "Membantu fokus outreach ke kategori yang tertinggal.");
  }
  await next(page, "Reward & Leadership");
  const content = await sectionDAndDownload(page, { leadership: "lead_internal", reward: "maybe" });

  // Readable answers, recorded by section.
  for (const text of [`| Nama | ${name} |`, `> ${EMAIL}`, "## C · Q9 Achieving 300 Participants", "Deliverable 1 — deadline: Hari ke-10", `> ${LONG}`]) expect(content).toContain(text);
  const payload = parseAnswerMarkdown(content);
  expect(payload).toMatchObject({ track: "internal", external: null, personal: { fullName: name, email: EMAIL } });
  expect(payload.internal?.deliverables).toHaveLength(3);
  expect(payload.final.leadership.interest).toBe("lead_internal");
  expect(payload.final.leadership.actions[2]).toContain("nomor 3");
  expect(payload.final.reward).toMatchObject({ plan: "maybe", nomineeName: "" });
  expect(problems).toEqual([]);
});

test("Flexible → External path: dynamic forms, KPI validation, answer file download", async ({ page }) => {
  const problems = watch(page);
  const name = `External E2E ${test.info().project.name}`;
  await sectionAB(page, name, "flexible", "external");
  await next(page, "External · Target Company Mapping");
  await page.getByRole("button", { name: "+ Add Company" }).click();
  for (let i = 0; i < 6; i++) {
    await fill(page, `external.companies.${i}.name`, `Target Co ${i + 1}`);
    await page.locator(`[name="external.companies.${i}.industry"]`).selectOption(i === 5 ? "other" : "operator_oil_gas");
    if (i === 5) await fill(page, `external.companies.${i}.industryOther`, "Mining");
    await fill(page, `external.companies.${i}.targetProfile`, "Engineer 2–3 tahun");
    await fill(page, `external.companies.${i}.reason`, "Banyak engineer muda yang relevan dengan JDS.");
    await page.locator(`[name="external.companies.${i}.approach"]`).selectOption("community");
  }
  await next(page, "External · Personal Candidate Target");
  for (let i = 0; i < 3; i++) {
    if (i === 0) await fill(page, `external.prospects.${i}.name`, "Nama Prospek E2E");
    await fill(page, `external.prospects.${i}.profile`, "Drilling engineer");
    await fill(page, `external.prospects.${i}.companyOrIndustry`, "Operator migas");
    await fill(page, `external.prospects.${i}.experience`, "2 tahun");
    await fill(page, `external.prospects.${i}.relevance`, "Sesuai target operator 2–3 tahun.");
    await page.locator(`[name="external.prospects.${i}.relationship"]`).selectOption("professional_contact");
    await fill(page, `external.prospects.${i}.approachPlan`, "Ajak diskusi santai lalu kirim info resmi.");
  }
  await next(page, "External · Personal Recruitment KPI");
  const kpi: Record<string, string> = { total: "25", offline: "20", online: "6", experienced: "23", freshGraduate: "2", operator: "4", seniorService: "4", networking: "5", weeklyProspects: "20", conversionRate: "15" };
  for (const [k, v] of Object.entries(kpi)) await fill(page, `external.kpi.${k}`, v);
  await fill(page, "external.kpi.prospectSources", "Komunitas alumni dan LinkedIn");
  await fill(page, "external.kpi.halfKpiPlan", LONG);
  await fill(page, "external.kpi.accountableCommitment", LONG);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText(/Offline \+ online harus sama dengan target total \(20 \+ 6 = 26, target 25\)/)).toBeVisible();
  await fill(page, "external.kpi.offline", "19");
  await expect(page.getByText(/sekitar 9 minggu/)).toBeVisible();
  await page.screenshot({ path: join(shots, `${test.info().project.name}-external-kpi.png`), fullPage: true });
  await next(page, "External · Outreach Simulation");
  await fill(page, "external.outreachMessage", `${LONG} ${LONG}`);
  await next(page, "External · First 30 Days");
  await fillAll(page, 'textarea[name^="external.first30."]', LONG);
  await next(page, "Reward & Leadership");
  const content = await sectionDAndDownload(page, { leadership: "member_only", reward: "yes" });

  for (const text of [`| Nama | ${name} |`, "| Pilihan tim | Flexible (studi kasus External) |", "**Perusahaan 1: Target Co 1**", "Nama: Nama Prospek E2E", "> 25"]) expect(content).toContain(text);
  const payload = parseAnswerMarkdown(content);
  expect(payload).toMatchObject({ track: "external", internal: null, team: { preference: "flexible", flexibleTrack: "external" } });
  expect(payload.external?.companies).toHaveLength(6);
  expect(payload.external?.kpi).toMatchObject({ total: "25", offline: "19", online: "6" });
  expect(payload.final.reward).toMatchObject({ plan: "yes", nomineeBackground: "Production engineer 4 tahun", transparencyAck: true });
  expect(problems).toEqual([]);
});
