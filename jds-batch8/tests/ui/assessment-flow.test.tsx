// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/assessment/App.tsx";
import { parseAnswerMarkdown } from "../../src/lib/markdown.ts";
import { TEST_EMAIL, TEST_WA } from "../fixtures.ts";

const downloads: { name: string; text: Promise<string> }[] = [];

beforeEach(() => {
  downloads.length = 0;
  window.scrollTo = vi.fn() as never;
  Element.prototype.scrollIntoView = vi.fn();
  let lastBlob: Blob | null = null;
  URL.createObjectURL = vi.fn((blob: Blob) => {
    lastBlob = blob;
    return "blob:test";
  });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push({ name: this.download, text: lastBlob!.text() });
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const LONG = "Langkah konkret: memetakan target per kategori, membagi tugas mingguan, dan meninjau progres setiap Jumat bersama tim.";

const field = (name: string) => {
  const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${name}"]`);
  if (!el) throw new Error(`field ${name} not found`);
  return el;
};
const fill = (name: string, value: string) => fireEvent.change(field(name), { target: { value } });
const choose = (name: string, value: string) => fireEvent.click(document.querySelector(`input[type="radio"][name="${name}"][value="${value}"]`)!);
const next = () => fireEvent.click(screen.getByRole("button", { name: /^(Next|Review jawaban)/ }));
const heading = () => screen.getByRole("heading", { level: 2 }).textContent;

function start() {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Mulai asesmen/ }));
}

function fillSectionAB(team: "internal" | "external" | "flexible", flexibleTrack?: "internal" | "external") {
  fill("personal.fullName", "Kandidat Uji Coba");
  fill("personal.university", "Universitas Pertamina");
  fill("personal.major", "Teknik Perminyakan");
  fill("personal.graduationYear", "2021");
  choose("personal.status", "working_professional");
  fill("personal.email", TEST_EMAIL);
  fill("personal.whatsapp", TEST_WA);
  next();
  expect(heading()).toBe("Keahlian & Ketersediaan Waktu");
  fireEvent.click(screen.getByText("Data Analysis"));
  fill("personal.readiestSkill", "Data analysis untuk memantau progres pendaftaran.");
  choose("personal.weeklyHours", "6to10");
  fill("personal.availableTimes", "Senin–Jumat malam");
  next();
  expect(heading()).toBe("Team Preference & Commitment");
  choose("team.preference", team);
  if (flexibleTrack) choose("team.flexibleTrack", flexibleTrack);
  fill("team.reason", LONG);
  fill("team.sharedContribution", LONG);
  next();
}

function fillSectionD(opts: { reward?: "yes" | "maybe" | "no"; leadership?: string } = {}) {
  expect(heading()).toBe("Reward & Leadership");
  choose("final.reward.plan", opts.reward ?? "no");
  choose("final.leadership.interest", opts.leadership ?? "member_only");
  next();
  expect(heading()).toBe("Accountability & Final Commitment");
  fill("final.accountability", LONG);
  fill("final.finalCommitment", LONG);
  choose("final.placement.answer", "yes");
  fireEvent.click(field("final.consent"));
  next();
  expect(heading()).toBe("Review & Download");
}

describe("landing page", () => {
  it("shows the recruitment targets and team structure", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Recruitment Committee Assessment");
    expect(screen.getByText("“One Team. One Commitment. One Recruitment Goal.”")).toBeInTheDocument();
    expect(screen.getByText("300 Participants")).toBeInTheDocument();
    expect(screen.getByText("5 Members")).toBeInTheDocument();
    expect(screen.getByText("Based on Recruitment Needs")).toBeInTheDocument();
    expect(screen.getByText(/15–25 menit/)).toBeInTheDocument();
  });

  it("opens the questions directly — no key or login needed", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /Mulai asesmen/ })).toBeEnabled();
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.body.textContent).not.toMatch(/enkrip|kunci/i);
  });
});

describe("assessment flow", () => {
  it("blocks Next and lists errors when required fields are empty", () => {
    start();
    next();
    expect(heading()).toBe("Personal Background");
    expect(screen.getByText(/isian yang perlu dilengkapi/)).toBeInTheDocument();
    expect(field("personal.fullName")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not ask about past organisation or committee experience", () => {
    start();
    expect(document.body.textContent).not.toMatch(/pengalaman organisasi|riwayat jabatan|pengurus|kepanitiaan sebelumnya/i);
  });

  it("branches to the Internal case study", () => {
    start();
    fillSectionAB("internal");
    expect(heading()).toBe("Internal · Main Recruitment Strategy");
    expect(screen.getByText("Achieving 300 Participants")).toBeInTheDocument();
    expect(document.querySelector('[name="external.companies.0.name"]')).toBeNull();
  });

  it("branches to the External case study with a dynamic company form", () => {
    start();
    fillSectionAB("external");
    expect(heading()).toBe("External · Target Company Mapping");
    expect(document.querySelector('[name="internal.strategy.mainStrategy"]')).toBeNull();
    // Five entries to start with; none can be removed below the minimum of five.
    expect(screen.queryAllByRole("button", { name: "Hapus" })).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "+ Add Company" }));
    expect(screen.getByText("Perusahaan 6")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Hapus" })).toHaveLength(6);
    fireEvent.click(screen.getAllByRole("button", { name: "Hapus" })[5]!);
    expect(screen.queryByText("Perusahaan 6")).toBeNull();
    expect(screen.queryAllByRole("button", { name: "Hapus" })).toHaveLength(0);
  });

  it("lets a Flexible candidate choose one case study only", () => {
    start();
    fillSectionAB("flexible");
    expect(heading()).toBe("Team Preference & Commitment");
    expect(within(document.getElementById("f-team-flexibleTrack")!).getByRole("alert")).toHaveTextContent(/Pilih studi kasus/);
    choose("team.flexibleTrack", "external");
    next();
    expect(heading()).toBe("External · Target Company Mapping");
  });

  it("shows coordinator questions only when interested, and nominee fields only for 'Ya'", () => {
    start();
    fillSectionAB("internal");
    for (const step of ["strategy", "execution", "recovery"]) {
      document.querySelectorAll<HTMLTextAreaElement>(`textarea[name^="internal.${step}."]`).forEach((el) => fireEvent.change(el, { target: { value: LONG } }));
      next();
    }
    expect(heading()).toBe("Internal · Personal Contribution");
    for (const i of [0, 1]) {
      fill(`internal.deliverables.${i}.title`, "Dashboard progres");
      fill(`internal.deliverables.${i}.deadline`, "Hari ke-10");
      fill(`internal.deliverables.${i}.indicator`, "Dipakai di rapat mingguan");
      fill(`internal.deliverables.${i}.impact`, "Kategori tertinggal terlihat lebih awal.");
    }
    next();
    expect(heading()).toBe("Reward & Leadership");

    expect(document.querySelector('[name="final.leadership.readiness"]')).toBeNull();
    choose("final.leadership.interest", "lead_internal");
    expect(field("final.leadership.readiness")).toBeInTheDocument();
    choose("final.leadership.interest", "member_only");
    expect(document.querySelector('[name="final.leadership.readiness"]')).toBeNull();

    expect(document.querySelector('[name="final.reward.nomineeName"]')).toBeNull();
    choose("final.reward.plan", "yes");
    expect(field("final.reward.nomineeName")).toBeInTheDocument();
    choose("final.reward.plan", "maybe");
    expect(document.querySelector('[name="final.reward.nomineeName"]')).toBeNull();
    next();
    expect(heading()).toBe("Accountability & Final Commitment");
  });

  it("completes the External path, reviews, and downloads an encrypted .md that decrypts", async () => {
    start();
    fillSectionAB("external");
    for (let i = 0; i < 5; i++) {
      fill(`external.companies.${i}.name`, `Perusahaan ${i + 1}`);
      fill(`external.companies.${i}.industry`, "service_company");
      fill(`external.companies.${i}.targetProfile`, "Senior engineer 5+ tahun");
      fill(`external.companies.${i}.reason`, "Banyak profesional senior yang relevan.");
      fill(`external.companies.${i}.approach`, "linkedin");
    }
    next();
    expect(heading()).toBe("External · Personal Candidate Target");
    for (let i = 0; i < 3; i++) {
      fill(`external.prospects.${i}.profile`, "Well engineer");
      fill(`external.prospects.${i}.companyOrIndustry`, "Geothermal");
      fill(`external.prospects.${i}.experience`, "3 tahun");
      fill(`external.prospects.${i}.relevance`, "Sesuai target operator 2–3 tahun.");
      fill(`external.prospects.${i}.relationship`, "identifying");
      fill(`external.prospects.${i}.approachPlan`, "Perkenalan lewat komunitas alumni.");
    }
    next();
    expect(heading()).toBe("External · Personal Recruitment KPI");
    const kpi = { total: "20", offline: "15", online: "6", experienced: "18", freshGraduate: "2", operator: "3", seniorService: "3", networking: "4", weeklyProspects: "15", conversionRate: "20" };
    for (const [k, v] of Object.entries(kpi)) fill(`external.kpi.${k}`, v);
    fill("external.kpi.prospectSources", "LinkedIn alumni dan komunitas drilling");
    fill("external.kpi.halfKpiPlan", LONG);
    fill("external.kpi.accountableCommitment", LONG);
    next();
    expect(heading()).toBe("External · Personal Recruitment KPI");
    expect(screen.getByText(/Offline \+ online harus sama dengan target total/)).toBeInTheDocument();
    fill("external.kpi.offline", "14");
    next();
    expect(heading()).toBe("External · Outreach Simulation");
    fill("external.outreachMessage", `${LONG} ${LONG}`);
    next();
    document.querySelectorAll<HTMLTextAreaElement>('textarea[name^="external.first30."]').forEach((el) => fireEvent.change(el, { target: { value: LONG } }));
    next();
    fillSectionD();

    expect(screen.getByText("C · Q11 Personal Recruitment KPI")).toBeInTheDocument();
    expect(screen.getByText("Kandidat Uji Coba")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Download Assessment (.md)" }));
    });
    await waitFor(() => expect(screen.getByText("File jawaban berhasil dibuat")).toBeInTheDocument());

    expect(downloads).toHaveLength(1);
    const { name, text } = downloads[0]!;
    expect(name).toMatch(/^JDS_B8_ASSESSMENT_[0-9A-F]{6}\.md$/);
    const content = await text;
    expect(content).toContain("| Nama | Kandidat Uji Coba |");
    expect(content).toContain("> " + TEST_EMAIL);
    expect(content).toContain("**Target total terkonfirmasi**\n\n> 20");
    const payload = parseAnswerMarkdown(content);
    expect(payload.personal.fullName).toBe("Kandidat Uji Coba");
    expect(payload.external?.kpi).toMatchObject({ total: "20", offline: "14", online: "6" });
    expect(payload.internal).toBeNull();
  });
});

describe("public wording", () => {
  it("states the objective and choices without naming the recruitment lead", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Tujuan asesmen" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pilihan tim" })).toBeInTheDocument();
    for (const role of ["Internal Team", "External Team", "Flexible"]) expect(screen.getByRole("heading", { name: role })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Ketua|Fakhri/);
  });
});
