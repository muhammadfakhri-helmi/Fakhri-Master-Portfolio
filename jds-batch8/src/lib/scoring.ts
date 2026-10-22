// Reviewer scoring. Every criterion is scored 0–5 by the recruitment lead using the
// rubric below; the final score is the weighted sum scaled to 0–100. Nothing here
// scores answers automatically, and neither coordinator interest nor the
// nomination-reward plan is part of any criterion.

import type { Team } from "./types.ts";

export interface Criterion {
  id: string;
  label: string;
  weight: number;
  /** What the reviewer looks at in the candidate's answers. */
  evidence: string;
}

export const CRITERIA: Record<Team, Criterion[]> = {
  internal: [
    {
      id: "strategy",
      label: "Recruitment Strategy & Target Achievement",
      weight: 35,
      evidence: "Q9 (strategi mencapai 300 peserta) dan Q13 (komposisi fresh graduate & experienced).",
    },
    { id: "execution", label: "Execution Planning", weight: 25, evidence: "Q10 (membagi target & mengukur kemajuan) dan Q11 (dukungan untuk External)." },
    { id: "problemSolving", label: "Problem Solving", weight: 20, evidence: "Q12 (tindakan jika pendaftaran masih kurang)." },
    { id: "collaboration", label: "Collaboration & Accountability", weight: 10, evidence: "Q8, Q11, Q16 (kontribusi lintas tim dan tanggung jawab saat target tidak tercapai)." },
    { id: "commitment", label: "Realistic Commitment", weight: 10, evidence: "Q5 (ketersediaan waktu) dan Q17 (komitmen yang terukur dan realistis)." },
  ],
  external: [
    {
      id: "mapping",
      label: "Target Company & Candidate Mapping",
      weight: 30,
      evidence: "Q9 (perusahaan sasaran dan profesional yang ingin diajak).",
    },
    { id: "kpiFeasibility", label: "Recruitment KPI Feasibility", weight: 25, evidence: "Q10 (target peserta terkonfirmasi dan alasannya; bandingkan dengan waktu di Q5)." },
    { id: "outreach", label: "Outreach & Conversion Strategy", weight: 20, evidence: "Q11 (cara menghubungi) dan Q12 (memastikan calon peserta bergabung)." },
    { id: "collaboration", label: "Collaboration & Accountability", weight: 15, evidence: "Q8, Q13 (pelaporan aktivitas & hambatan), Q16." },
    { id: "commitment", label: "Commitment", weight: 10, evidence: "Q5 dan Q17 (komitmen yang dapat dipertanggungjawabkan)." },
  ],
};

/** Generic anchors for every criterion; the criterion's evidence says where to look. */
export const RUBRIC: { score: number; label: string; description: string }[] = [
  { score: 0, label: "Tidak ada", description: "Tidak menjawab, jawaban tidak relevan, atau hanya menyalin pertanyaan." },
  { score: 1, label: "Sangat lemah", description: "Pernyataan umum/kesediaan saja, tanpa langkah, angka, atau sasaran." },
  { score: 2, label: "Lemah", description: "Ada beberapa ide, tetapi tidak spesifik, tidak berurutan, atau tidak realistis." },
  { score: 3, label: "Cukup", description: "Langkah konkret untuk sebagian besar sub-pertanyaan; prioritas atau ukuran keberhasilan belum lengkap." },
  { score: 4, label: "Baik", description: "Langkah konkret, prioritas jelas, ada angka/ukuran keberhasilan, dan terhubung ke target peserta." },
  { score: 5, label: "Sangat baik", description: "Rencana lengkap, terukur, realistis terhadap waktu yang tersedia, mengantisipasi risiko, dan memperkuat kerja Internal–External." },
];

export type Scores = Record<string, number | null>;

export interface Classification {
  id: "strong" | "recommended" | "consider" | "further";
  label: string;
}

export function classify(score: number): Classification {
  if (score >= 85) return { id: "strong", label: "Strong Candidate" };
  if (score >= 75) return { id: "recommended", label: "Recommended" };
  if (score >= 65) return { id: "consider", label: "Consider / Interview" };
  return { id: "further", label: "Further Evaluation" };
}

export interface ScoreResult {
  complete: boolean;
  /** 0–100 with one decimal, or null until every criterion is scored. */
  score: number | null;
  classification: Classification | null;
  scored: number;
  total: number;
}

export function computeScore(track: Team, scores: Scores): ScoreResult {
  const criteria = CRITERIA[track];
  let sum = 0;
  let scored = 0;
  for (const criterion of criteria) {
    const value = scores[criterion.id];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 5) continue;
    sum += (value / 5) * criterion.weight;
    scored++;
  }
  const complete = scored === criteria.length;
  const score = complete ? Math.round(sum * 10) / 10 : null;
  return { complete, score, classification: score === null ? null : classify(score), scored, total: criteria.length };
}

export const SELECTION_STATUSES = [
  "Belum direview",
  "Sedang direview",
  "Interview",
  "Terpilih — Internal",
  "Terpilih — External",
  "Cadangan",
  "Tidak dilanjutkan",
] as const;
export type SelectionStatus = (typeof SELECTION_STATUSES)[number];

export interface Review {
  submissionId: string;
  scores: Scores;
  notes: string;
  status: SelectionStatus;
  updatedAt: string;
}

export const emptyReview = (submissionId: string): Review => ({
  submissionId,
  scores: {},
  notes: "",
  status: "Belum direview",
  updatedAt: "",
});
