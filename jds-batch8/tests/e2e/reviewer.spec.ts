import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { join } from "node:path";
import { createEncryptedAssessment, type RecipientKey } from "../../src/lib/payload.ts";
import { completeExternalAnswers, completeInternalAnswers } from "../fixtures.ts";
import { E2E_DIR, PASSPHRASE, paths, REVIEWER_PORT, REVIEWER_URL } from "./env.ts";

const shots = join(E2E_DIR, "screenshots");

async function makeFiles() {
  mkdirSync(paths.files, { recursive: true });
  const recipient = JSON.parse(readFileSync(paths.publicKey, "utf8")) as RecipientKey;
  const other = JSON.parse(readFileSync(paths.otherPublicKey, "utf8")) as RecipientKey;
  const ayu = completeInternalAnswers("Ayu Internal");
  ayu.personal.email = ["ayu.internal", "contoh.id"].join("@");
  ayu.personal.whatsapp = ["0", "811 2222 3333"].join("");
  const internal = await createEncryptedAssessment(ayu, recipient);
  const external = await createEncryptedAssessment(completeExternalAnswers("Bima External"), recipient);
  const repeat = await createEncryptedAssessment(completeInternalAnswers("Bima External"), recipient);
  const foreign = await createEncryptedAssessment(completeInternalAnswers("Kunci Lain"), other);
  const tampered = internal.content.replace(/"ciphertext": "(.)/, (_m, ch: string) => `"ciphertext": "${ch === "A" ? "B" : "A"}`);
  const files: Record<string, string> = {
    [internal.fileName]: internal.content,
    [external.fileName]: external.content,
    [repeat.fileName]: repeat.content,
    [`copy-${internal.fileName}`]: internal.content,
    "foreign.md": foreign.content,
    "tampered.md": tampered,
  };
  for (const [name, content] of Object.entries(files)) writeFileSync(join(paths.files, name), content);
  return { internal, external, repeat, all: Object.keys(files).map((f) => join(paths.files, f)) };
}

const keyFile = () => join(paths.keys, readdirSync(paths.keys).find((f) => f.endsWith(".json"))!);
const otherKeyFile = () => join(paths.otherKeys, readdirSync(paths.otherKeys).find((f) => f.endsWith(".pem"))!);

async function unlock(page: Page) {
  await page.getByLabel("File kunci privat").setInputFiles(keyFile());
  await page.getByLabel("Passphrase kunci privat").fill(PASSPHRASE);
  await page.getByRole("button", { name: /^Buka / }).click();
  await expect(page.getByText(/Kunci dimuat ·/)).toBeVisible({ timeout: 20_000 });
}

function rawRequest(path: string, headers: Record<string, string>): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: "127.0.0.1", port: REVIEWER_PORT, path, headers }, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on("error", reject);
    req.end();
  });
}

test("reviewer: decrypts many files, detects duplicates, scores, saves locally and exports CSV", async ({ page }) => {
  const { internal, external, repeat, all } = await makeFiles();
  await page.goto(REVIEWER_URL);
  await expect(page.getByRole("heading", { name: "Private Reviewer (lokal)" })).toBeVisible();
  await expect(page.getByText(/Review tersimpan otomatis/)).toBeVisible();

  // Wrong passphrase, then the right one.
  await page.getByLabel("File kunci privat").setInputFiles(keyFile());
  await page.getByLabel("Passphrase kunci privat").fill("passphrase yang salah sekali");
  await page.getByRole("button", { name: /^Buka / }).click();
  await expect(page.getByRole("alert")).toHaveText(/Passphrase salah/, { timeout: 20_000 });
  await page.getByLabel("Passphrase kunci privat").fill(PASSPHRASE);
  await page.getByRole("button", { name: /^Buka / }).click();
  await expect(page.getByText(/Kunci dimuat ·/)).toBeVisible({ timeout: 20_000 });

  await page.getByLabel("File asesmen").setInputFiles(all);
  const log = page.getByRole("list", { name: "Hasil pemuatan file" });
  await expect(log.locator("li")).toHaveCount(6);
  await expect(log).toContainText("sudah dimuat — diabaikan");
  await expect(log).toContainText("dienkripsi untuk kunci");
  // The tampered copy shares its ID with a loaded file → flagged as an ID conflict, never loaded.
  await expect(log).toContainText("isi berbeda — file ini tidak dimuat");
  await expect(page.getByText("3 kandidat")).toBeVisible();
  await expect(page.getByText("Kemungkinan ganda")).toHaveCount(2);

  // Detail + restricted third-party data + scoring.
  await page.getByRole("button", { name: "Bima External" }).first().click();
  await expect(page.getByRole("heading", { name: "Bima External", level: 2 })).toBeVisible();
  await expect(page.getByText(/Kemungkinan pengiriman ganda/)).toBeVisible();
  await expect(page.getByText("Nama: Prospek Bernama Rahasia")).toHaveCount(0);
  await page.getByRole("button", { name: "Tampilkan data terbatas" }).click();
  await expect(page.getByText("Nama: Prospek Bernama Rahasia")).toBeVisible();
  const scores: [string, number][] = [
    ["Target Company & Candidate Mapping", 5],
    ["Recruitment KPI Feasibility", 4],
    ["Outreach & Conversion Strategy", 4],
    ["Collaboration & Accountability", 3],
    ["Commitment", 5],
  ];
  for (const [criterion, score] of scores) await page.getByRole("button", { name: `${criterion}: ${score}`, exact: true }).click();
  await expect(page.getByText("Strong Candidate")).toBeVisible();
  await page.locator("aside select").selectOption("Interview");
  await page.locator("aside textarea").fill("Pemetaan perusahaan kuat");
  await page.screenshot({ path: join(shots, "reviewer-detail.png"), fullPage: true });
  await page.waitForTimeout(1200); // debounce → saved on the local server

  // Dashboard and Internal comparison.
  await page.getByRole("button", { name: "Dashboard target" }).click();
  await expect(page.getByRole("img", { name: "Total peserta: 20 dari 300" })).toBeVisible();
  await page.getByRole("button", { name: "Bandingkan strategi Internal" }).click();
  await expect(page.getByRole("button", { name: "Ayu Internal" })).toBeVisible();

  // Reload: reviews come back from the local server; answers need the key again.
  await page.reload();
  await unlock(page);
  await page.getByLabel("File asesmen").setInputFiles([internal, external, repeat].map((f) => join(paths.files, f.fileName)));
  await expect(page.getByText("3 kandidat")).toBeVisible();
  const row = page.locator("tr", { hasText: external.submissionId });
  await expect(row).toContainText("85");
  await expect(row).toContainText("Interview");
  await page.screenshot({ path: join(shots, "reviewer-recap.png"), fullPage: true });

  // CSV exports.
  const exportCsv = async (button: string) => {
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: `${button} (CSV)` }).click()]);
    const file = join(E2E_DIR, "downloads", download.suggestedFilename());
    await download.saveAs(file);
    return readFileSync(file, "utf8");
  };
  const recap = await exportCsv("Rekap kandidat");
  expect(recap.startsWith("﻿\"Name\",\"Team Preference\",\"Weekly Availability\"")).toBe(true);
  expect(recap).toContain(`"Bima External","External"`);
  expect(recap).toContain(`"85","Pemetaan perusahaan kuat","Interview","Strong Candidate"`);
  expect(recap).not.toContain("Prospek Bernama Rahasia");
  await page.getByLabel("Pemisah CSV").selectOption(";");
  const companies = await exportCsv("Perusahaan target External");
  expect(companies).toContain(`"Bima External";"${external.submissionId}";"Operator Satu"`);
  const kpi = await exportCsv("Proyeksi KPI External");
  expect(kpi).toContain(`"20";"14";"6"`);
  const strategy = await exportCsv("Ringkasan strategi Internal");
  expect(strategy).toContain("Ayu Internal");

  // A plain PEM key for a different recipient opens, but cannot decrypt these files.
  await page.getByRole("button", { name: "Lepas kunci" }).click();
  await page.getByLabel("File kunci privat").setInputFiles(otherKeyFile());
  await page.getByRole("button", { name: /^Buka / }).click();
  await expect(page.getByText(/Kunci dimuat ·/)).toBeVisible({ timeout: 20_000 });
  await page.reload();
  await page.getByLabel("File kunci privat").setInputFiles(otherKeyFile());
  await page.getByRole("button", { name: /^Buka / }).click();
  await page.getByLabel("File asesmen").setInputFiles([join(paths.files, external.fileName)]);
  await expect(page.getByRole("list", { name: "Hasil pemuatan file" })).toContainText("dienkripsi untuk kunci");
  await expect(page.getByText("0 kandidat")).toBeVisible();
});

test("reviewer server: localhost only, session required", async () => {
  expect(await rawRequest("/api/reviews", { Host: `127.0.0.1:${REVIEWER_PORT}` })).toBe(403);
  expect(await rawRequest("/api/reviews", { Host: `evil.example:${REVIEWER_PORT}` })).toBe(421);
  expect(await rawRequest("/../package.json", { Host: `127.0.0.1:${REVIEWER_PORT}` })).toBe(404);
});
