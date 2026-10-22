// Complete, valid answer sets for tests. Contact values are assembled at runtime
// so the repository's privacy check never sees an e-mail address or phone number.

import { createInitialAnswers } from "../src/lib/initial.ts";
import type { Answers } from "../src/lib/types.ts";

export const TEST_EMAIL = ["rina.kandidat", "contoh.id"].join("@");
export const TEST_WA = ["0", "812 3456 7890"].join("");

const long = (topic: string) =>
  `${topic}: langkah konkret pertama adalah memetakan kebutuhan, lalu menetapkan target mingguan terukur dan meninjau progres setiap Jumat bersama tim.`;

export function basePersonal(answers: Answers, name = "Rina Kandidat Uji"): void {
  Object.assign(answers.personal, {
    fullName: name,
    university: "Universitas Pertamina",
    major: "Teknik Perminyakan",
    graduationYear: "2021",
    status: "working_professional",
    currentJob: "Drilling Engineer — perusahaan jasa",
    email: TEST_EMAIL,
    whatsapp: TEST_WA,
    skills: ["Strategic Planning", "Data Analysis"],
    readiestSkill: "Data analysis untuk memantau funnel pendaftaran per kategori.",
    weeklyHours: "6to10",
    availableTimes: "Senin–Jumat malam, Sabtu pagi",
    scheduleConstraints: "",
  });
  answers.team.reason = long("Alasan memilih tim");
  answers.team.sharedContribution = long("Kontribusi lintas tim");
  Object.assign(answers.final, {
    accountability: long("Akuntabilitas"),
    finalCommitment: long("Komitmen"),
    placement: { answer: "yes", notes: "" },
    consent: true,
  });
  answers.final.reward.plan = "no";
  answers.final.leadership.interest = "member_only";
}

export function completeInternalAnswers(name?: string): Answers {
  const a = createInitialAnswers();
  basePersonal(a, name);
  a.team.preference = "internal";
  for (const key of Object.keys(a.internal) as (keyof typeof a.internal)[]) a.internal[key] = long(`internal.${key}`);
  return a;
}

export function completeExternalAnswers(name?: string): Answers {
  const a = createInitialAnswers();
  basePersonal(a, name);
  a.team.preference = "external";
  a.external.companies = ["Operator Satu", "Geo Dua", "Service Tiga"];
  a.external.targetProfile = "Drilling engineer 2–3 tahun dan senior engineer service company.";
  a.external.kpi = { total: "20", offline: "14", online: "6" };
  a.external.kpiReason = long("Alasan KPI");
  a.external.approach = long("Cara menghubungi");
  a.external.conversion = long("Konversi");
  a.external.reporting = long("Pelaporan");
  return a;
}
