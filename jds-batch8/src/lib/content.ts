// Labels shared by the assessment and the reviewer, plus the recruitment targets.

import type {
  ApproachChannel,
  CandidateStatus,
  CompanyIndustry,
  LeadershipInterest,
  PlacementAnswer,
  RelationshipStatus,
  RewardPlan,
  Team,
  TeamPreference,
  WeeklyHours,
} from "./types.ts";

export const RECRUITMENT_LEAD = "Muhammad Fakhri Helmi";

export const TARGETS = {
  total: 300,
  offline: 200,
  online: 100,
  experienced: 280,
  freshGraduate: 20,
  operator: 10,
  seniorService: 10,
  networking: 20,
} as const;

export const TEAM_SIZE = {
  internal: 5,
  /** Planning assumption only; the final number follows the selected candidates. */
  externalAssumption: 15,
  examplePerExternalMember: 20,
} as const;

export type Option<T extends string> = { value: T; label: string; hint?: string };

export const STATUS_OPTIONS: Option<CandidateStatus>[] = [
  { value: "mahasiswa", label: "Mahasiswa" },
  { value: "fresh_graduate", label: "Fresh Graduate" },
  { value: "working_professional", label: "Working Professional" },
];

export const SKILL_OPTIONS = [
  "Strategic Planning",
  "Microsoft Excel / Google Sheets",
  "Data Analysis",
  "Canva / Graphic Design",
  "Content & Social Media",
  "Communication",
  "Networking & Public Relations",
  "Project Management",
  "Programming / Automation",
  "Problem Solving",
  "Negotiation",
  "Other",
] as const;

export const WEEKLY_HOURS_OPTIONS: Option<WeeklyHours>[] = [
  { value: "lt3", label: "Kurang dari 3 jam" },
  { value: "3to5", label: "3–5 jam" },
  { value: "6to10", label: "6–10 jam" },
  { value: "gt10", label: "Lebih dari 10 jam" },
];

export const TEAM_OPTIONS: Option<TeamPreference>[] = [
  {
    value: "internal",
    label: "Internal Team",
    hint: "Menyusun strategi, menyiapkan kebutuhan rekrutmen, menganalisis data, membantu promosi, dan mengevaluasi capaian target.",
  },
  {
    value: "external",
    label: "External Team",
    hint: "Menjalankan strategi: mencari kandidat, mendekati profesional industri, dan mengonversi calon peserta menjadi peserta terkonfirmasi.",
  },
  {
    value: "flexible",
    label: "Flexible / Bersedia ditempatkan di keduanya",
    hint: "Kamu cukup mengerjakan satu studi kasus (Internal atau External) yang kamu pilih.",
  },
];

export const TRACK_LABEL: Record<Team, string> = { internal: "Internal", external: "External" };
export const PREFERENCE_LABEL: Record<TeamPreference, string> = {
  internal: "Internal",
  external: "External",
  flexible: "Flexible",
};

export const INDUSTRY_OPTIONS: Option<CompanyIndustry>[] = [
  { value: "operator_oil_gas", label: "Operator Oil & Gas" },
  { value: "geothermal", label: "Geothermal" },
  { value: "service_company", label: "Service Company" },
  { value: "engineering", label: "Engineering" },
  { value: "other", label: "Other" },
];

export const APPROACH_OPTIONS: Option<ApproachChannel>[] = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "referral", label: "Referral" },
  { value: "personal_network", label: "Personal Network" },
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
];

export const RELATIONSHIP_OPTIONS: Option<RelationshipStatus>[] = [
  { value: "professional_contact", label: "Sudah memiliki komunikasi profesional" },
  { value: "indirect_connection", label: "Memiliki koneksi tidak langsung" },
  { value: "no_connection", label: "Belum memiliki koneksi" },
  { value: "identifying", label: "Masih dalam tahap identifikasi" },
];

export const REWARD_OPTIONS: Option<RewardPlan>[] = [
  { value: "yes", label: "Ya, sudah memiliki kandidat rekomendasi." },
  { value: "maybe", label: "Mungkin, tetapi belum menentukan kandidat." },
  { value: "no", label: "Tidak, belum berencana." },
];

export const LEADERSHIP_OPTIONS: Option<LeadershipInterest>[] = [
  { value: "lead_internal", label: "Ya, tertarik memimpin Internal Team." },
  { value: "lead_external", label: "Ya, tertarik memimpin External Team." },
  { value: "lead_either", label: "Ya, bersedia memimpin sesuai kebutuhan." },
  { value: "member_only", label: "Tidak, lebih memilih berkontribusi sebagai anggota." },
];

export const PLACEMENT_OPTIONS: Option<PlacementAnswer>[] = [
  { value: "yes", label: "Ya." },
  { value: "conditional", label: "Ya, dengan pertimbangan." },
  { value: "no", label: "Tidak." },
];

export function labelOf<T extends string>(options: Option<T>[], value: T | "" | null | undefined): string {
  if (!value) return "—";
  return options.find((option) => option.value === value)?.label ?? value;
}

/** Short labels for tables and CSV. */
export const LEADERSHIP_SHORT: Record<LeadershipInterest, string> = {
  lead_internal: "Ya — Internal",
  lead_external: "Ya — External",
  lead_either: "Ya — sesuai kebutuhan",
  member_only: "Tidak (anggota)",
};
export const REWARD_SHORT: Record<RewardPlan, string> = {
  yes: "Ya, sudah ada kandidat",
  maybe: "Mungkin",
  no: "Tidak",
};
