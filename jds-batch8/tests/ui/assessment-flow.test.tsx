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
    expect(screen.getByText(/10–15 menit/)).toBeInTheDocument();
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

  it("gives Internal candidates five short questions on the Internal objective", () => {
    start();
    fillSectionAB("internal");
    expect(heading()).toBe("Internal Team · Objective & Strategi");
    expect(screen.getByText("Objective Internal Team")).toBeInTheDocument();
    expect(document.querySelectorAll('textarea[name^="internal."]')).toHaveLength(5);
    expect(document.querySelector('[name^="external."]')).toBeNull();
  });

  it("gives External candidates five short questions on the External objective", () => {
    start();
    fillSectionAB("external");
    expect(heading()).toBe("External Team · Objective & Outreach");
    expect(screen.getByText("Objective External Team")).toBeInTheDocument();
    expect(document.querySelector('[name^="internal."]')).toBeNull();
    expect(document.querySelectorAll('[name^="external.companies."]')).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "+ Tambah perusahaan" }));
    expect(document.querySelectorAll('[name^="external.companies."]')).toHaveLength(4);
  });

  it("lets a Flexible candidate choose one set of team questions only", () => {
    start();
    fillSectionAB("flexible");
    expect(heading()).toBe("Team Preference & Commitment");
    expect(within(document.getElementById("f-team-flexibleTrack")!).getByRole("alert")).toHaveTextContent(/Pilih set pertanyaan/);
    choose("team.flexibleTrack", "external");
    next();
    expect(heading()).toBe("External Team · Objective & Outreach");
  });

  it("shows coordinator questions only when interested, and nominee fields only for 'Ya'", () => {
    start();
    fillSectionAB("internal");
    document.querySelectorAll<HTMLTextAreaElement>('textarea[name^="internal."]').forEach((el) => fireEvent.change(el, { target: { value: LONG } }));
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

  it("completes the External path, reviews, and downloads a readable .md", async () => {
    start();
    fillSectionAB("external");
    expect(heading()).toBe("External Team · Objective & Outreach");
    ["Perusahaan Satu", "Perusahaan Dua", "Perusahaan Tiga"].forEach((name, i) => fill(`external.companies.${i}`, name));
    fill("external.targetProfile", "Senior engineer 5+ tahun di service company");
    fill("external.kpi.total", "20");
    fill("external.kpi.offline", "15");
    fill("external.kpi.online", "6");
    for (const field of ["kpiReason", "approach", "conversion", "reporting"]) fill(`external.${field}`, LONG);
    next();
    expect(heading()).toBe("External Team · Objective & Outreach");
    expect(screen.getByText(/Offline \+ online harus sama dengan target total/)).toBeInTheDocument();
    fill("external.kpi.offline", "14");
    next();
    fillSectionD();

    expect(screen.getByText("C · External Team — Objective & Outreach")).toBeInTheDocument();
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
    expect(content).toContain("**Q10 Target peserta terkonfirmasi**\n\n> 20 orang (offline 14, online 6)");
    expect(content).toContain("- Perusahaan Dua");
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

describe("copy-paste guard", () => {
  it("blocks pasting into answers, allows it in contact fields, and records attempts in the file", async () => {
    start();
    // Contact details may be pasted.
    expect(fireEvent.paste(field("personal.email"))).toBe(true);
    expect(screen.queryByText(/Copy-paste tidak diizinkan/)).toBeNull();

    fillSectionAB("internal");
    expect(heading()).toBe("Internal Team · Objective & Strategi");
    const answer = field("internal.strategy");
    expect(fireEvent.paste(answer)).toBe(false);
    expect(screen.getByRole("status")).toHaveTextContent("Copy-paste tidak diizinkan. Tulis jawabanmu sendiri.");
    expect(fireEvent.drop(field("internal.tracking"))).toBe(false);
    // Mobile keyboards insert clipboard text through beforeinput.
    const insert = new InputEvent("beforeinput", { inputType: "insertFromPaste", data: "teks", cancelable: true, bubbles: true });
    field("internal.recovery").dispatchEvent(insert);
    expect(insert.defaultPrevented).toBe(true);
    // Typing is untouched.
    const typing = new InputEvent("beforeinput", { inputType: "insertText", data: "a", cancelable: true, bubbles: true });
    field("internal.recovery").dispatchEvent(typing);
    expect(typing.defaultPrevented).toBe(false);

    document.querySelectorAll<HTMLTextAreaElement>('textarea[name^="internal."]').forEach((el) => fireEvent.change(el, { target: { value: LONG } }));
    next();
    fillSectionD();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Download Assessment (.md)" }));
    });
    await waitFor(() => expect(screen.getByText("File jawaban berhasil dibuat")).toBeInTheDocument());
    const content = await downloads[0]!.text;
    expect(content).toContain("| Percobaan paste yang diblokir | 3 |");
    expect(parseAnswerMarkdown(content).integrity).toEqual({ pasteBlocked: 3 });
  });
});
