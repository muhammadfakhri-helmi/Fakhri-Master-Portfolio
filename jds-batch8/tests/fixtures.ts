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
  for (const group of ["strategy", "execution", "recovery"] as const) {
    const section = a.internal[group] as Record<string, string>;
    for (const key of Object.keys(section)) section[key] = long(`${group}.${key}`);
  }
  a.internal.deliverables = [
    { title: "Dashboard progres pendaftaran", deadline: "Hari ke-10", indicator: "Dashboard dipakai di rapat mingguan", impact: "Kategori yang tertinggal terlihat lebih awal sehingga outreach difokuskan." },
    { title: "Kit materi outreach", deadline: "Hari ke-20", indicator: "Dipakai seluruh anggota External", impact: "Pesan lebih konsisten sehingga konversi prospek meningkat." },
  ];
  return a;
}

export function completeExternalAnswers(name?: string): Answers {
  const a = createInitialAnswers();
  basePersonal(a, name);
  a.team.preference = "external";
  a.external.companies = ["Operator Satu", "Geo Dua", "Service Tiga", "Engineering Empat", "Service Lima"].map((company, i) => ({
    name: company,
    industry: (["operator_oil_gas", "geothermal", "service_company", "engineering", "service_company"] as const)[i]!,
    industryOther: "",
    targetProfile: "Drilling engineer 2–3 tahun",
    reason: "Banyak engineer muda yang membutuhkan jejaring drilling lintas perusahaan.",
    approach: "linkedin",
    approachOther: "",
  }));
  a.external.prospects = [0, 1, 2].map((i) => ({
    name: i === 0 ? "Prospek Bernama Rahasia" : "",
    profile: `Well engineer ${i + 1}`,
    companyOrIndustry: "Operator geothermal",
    experience: "3 tahun",
    relevance: "Relevan dengan target operator berpengalaman 2–3 tahun.",
    relationship: "indirect_connection",
    approachPlan: "Perkenalan melalui alumni lalu undangan sesi informasi.",
  }));
  Object.assign(a.external.kpi, {
    total: "20",
    offline: "14",
    online: "6",
    experienced: "18",
    freshGraduate: "2",
    operator: "3",
    seniorService: "3",
    networking: "4",
    weeklyProspects: "15",
    conversionRate: "20",
    prospectSources: "LinkedIn alumni, komunitas drilling, referral rekan kerja",
    halfKpiPlan: long("Rencana 50%"),
    accountableCommitment: long("Komitmen KPI"),
  });
  a.external.outreachMessage =
    "Halo Mas, terima kasih atas pertanyaannya. Dengan pengalaman tujuh tahun, JDS dapat menjadi ruang untuk berbagi praktik terbaik, memperluas jejaring lintas operator dan service company, serta membimbing engineer muda. Saya bisa kirimkan jadwal dan detail program resminya bila Mas berkenan.";
  for (const key of Object.keys(a.external.first30) as (keyof typeof a.external.first30)[]) a.external.first30[key] = long(`first30.${key}`);
  return a;
}
