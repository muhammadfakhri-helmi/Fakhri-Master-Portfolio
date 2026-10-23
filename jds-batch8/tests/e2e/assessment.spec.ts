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


test("Internal path: five Internal objective questions, coordinator questions, answer file download", async ({ page }) => {
  const problems = watch(page);
  const name = `Internal E2E ${test.info().project.name}`;
  await sectionAB(page, name, "internal");
  await next(page, "Internal Team · Objective & Strategi");
  await expect(page.getByText("Objective Internal Team")).toBeVisible();
  await expect(page.locator('textarea[name^="internal."]')).toHaveCount(5);
  await expect(page.locator('[name^="external."]')).toHaveCount(0);
  await page.screenshot({ path: join(shots, `${test.info().project.name}-internal-objective.png`), fullPage: true });
  await fillAll(page, 'textarea[name^="internal."]', LONG);
  await next(page, "Reward & Leadership");
  const content = await sectionDAndDownload(page, { leadership: "lead_internal", reward: "maybe" });

  // Readable answers, recorded by section.
  for (const text of [`| Nama | ${name} |`, `> ${EMAIL}`, "## C · Internal Team — Objective & Strategi", "**Q12 Jika pendaftaran masih kurang**", `> ${LONG}`]) expect(content).toContain(text);
  const payload = parseAnswerMarkdown(content);
  expect(payload).toMatchObject({ track: "internal", external: null, personal: { fullName: name, email: EMAIL } });
  expect(payload.internal?.composition).toBe(LONG);
  expect(payload.final.leadership.interest).toBe("lead_internal");
  expect(payload.final.leadership.actions[2]).toContain("nomor 3");
  expect(payload.final.reward).toMatchObject({ plan: "maybe", nomineeName: "" });
  expect(problems).toEqual([]);
});

test("Flexible → External path: five External objective questions, KPI check, answer file download", async ({ page }) => {
  const problems = watch(page);
  const name = `External E2E ${test.info().project.name}`;
  await sectionAB(page, name, "flexible", "external");
  await next(page, "External Team · Objective & Outreach");
  await expect(page.getByText("Objective External Team")).toBeVisible();
  await expect(page.locator('[name^="internal."]')).toHaveCount(0);
  await page.getByRole("button", { name: "+ Tambah perusahaan" }).click();
  for (let i = 0; i < 4; i++) await fill(page, `external.companies.${i}`, `Target Co ${i + 1}`);
  await fill(page, "external.targetProfile", "Drilling engineer 2–3 tahun di operator");
  await fill(page, "external.kpi.total", "25");
  await fill(page, "external.kpi.offline", "20");
  await fill(page, "external.kpi.online", "6");
  for (const field of ["kpiReason", "approach", "conversion", "reporting"]) await fill(page, `external.${field}`, LONG);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText(/Offline \+ online harus sama dengan target total \(20 \+ 6 = 26, target 25\)/)).toBeVisible();
  await fill(page, "external.kpi.offline", "19");
  await expect(page.getByText(/sesuai target total/)).toBeVisible();
  await page.screenshot({ path: join(shots, `${test.info().project.name}-external-objective.png`), fullPage: true });
  await next(page, "Reward & Leadership");
  const content = await sectionDAndDownload(page, { leadership: "member_only", reward: "yes" });

  for (const text of [`| Nama | ${name} |`, "| Pilihan tim | Flexible (menjawab pertanyaan External) |", "- Target Co 4", "> 25 orang (offline 19, online 6)", "Latar belakang: Production engineer 4 tahun"]) {
    expect(content).toContain(text);
  }
  const payload = parseAnswerMarkdown(content);
  expect(payload).toMatchObject({ track: "external", internal: null, team: { preference: "flexible", flexibleTrack: "external" } });
  expect(payload.external?.companies).toHaveLength(4);
  expect(payload.external?.kpi).toEqual({ total: "25", offline: "19", online: "6" });
  expect(payload.final.reward).toMatchObject({ plan: "yes", nomineeBackground: "Production engineer 4 tahun", transparencyAck: true });
  expect(problems).toEqual([]);
});

test("copy-paste with the keyboard is blocked in answer fields but allowed for contact details", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(SITE_URL).origin });
  const problems = watch(page);
  await page.goto(SITE_URL);
  await page.getByRole("button", { name: /Mulai asesmen/ }).click();
  await page.evaluate(() => navigator.clipboard.writeText("tempel.ini"));

  // Contact field: the real paste goes through.
  await page.locator('[name="personal.email"]').focus();
  await page.keyboard.press("ControlOrMeta+V");
  await expect(page.locator('[name="personal.email"]')).toHaveValue("tempel.ini");

  // Answer field (Section B): the paste is refused and the candidate is told why.
  await page.locator('[name="personal.email"]').fill("");
  const name = `Paste E2E ${test.info().project.name}`;
  await sectionAB(page, name, "internal");
  await page.evaluate(() => navigator.clipboard.writeText("Jawaban yang disalin dari tempat lain, panjang dan rapi."));
  await page.locator('[name="team.reason"]').fill("");
  await page.locator('[name="team.reason"]').focus();
  await page.keyboard.press("ControlOrMeta+V");
  await expect(page.locator('[name="team.reason"]')).toHaveValue("");
  await expect(page.getByRole("status")).toHaveText("Copy-paste tidak diizinkan. Tulis jawabanmu sendiri.");
  await page.screenshot({ path: join(shots, `${test.info().project.name}-paste-blocked.png`) });
  expect(problems).toEqual([]);
});
