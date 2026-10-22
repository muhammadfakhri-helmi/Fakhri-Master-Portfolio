// Human-readable view of a submission, used by the candidate's review page and
// by the reviewer's detail view. Items about third parties are marked sensitive
// so the reviewer can keep them behind an explicit "show" action.

import {
  labelOf,
  LEADERSHIP_OPTIONS,
  PLACEMENT_OPTIONS,
  REWARD_OPTIONS,
  STATUS_OPTIONS,
  TEAM_OPTIONS,
  WEEKLY_HOURS_OPTIONS,
} from "./content.ts";
import type { SubmissionPayload } from "./types.ts";
import type { StepId } from "./validation.ts";

export interface Item {
  label: string;
  value: string | string[];
  sensitive?: boolean;
}

export interface Section {
  step: StepId;
  title: string;
  items: Item[];
}

const or = (value: string) => value || "—";

export function describeSubmission(p: SubmissionPayload): Section[] {
  const sections: Section[] = [
    {
      step: "personal",
      title: "A · Personal Background",
      items: [
        { label: "Q1 Nama lengkap", value: p.personal.fullName },
        { label: "Q2 Universitas / jurusan", value: `${p.personal.university} — ${p.personal.major} (${p.personal.graduationYear})` },
        { label: "Status", value: labelOf(STATUS_OPTIONS, p.personal.status) },
        { label: "Pekerjaan & perusahaan saat ini", value: or(p.personal.currentJob) },
        { label: "Q3 Email", value: p.personal.email },
        { label: "Nomor WhatsApp", value: p.personal.whatsapp },
      ],
    },
    {
      step: "skills",
      title: "A · Keahlian & Ketersediaan",
      items: [
        { label: "Q4 Keahlian", value: p.personal.skills.map((s) => (s === "Other" && p.personal.skillsOther ? `Other: ${p.personal.skillsOther}` : s)) },
        { label: "Keahlian paling siap digunakan", value: p.personal.readiestSkill },
        { label: "Q5 Jam per minggu", value: labelOf(WEEKLY_HOURS_OPTIONS, p.personal.weeklyHours) },
        { label: "Waktu tersedia", value: p.personal.availableTimes },
        { label: "Kendala jadwal", value: or(p.personal.scheduleConstraints) },
      ],
    },
    {
      step: "team",
      title: "B · Team Preference & Commitment",
      items: [
        { label: "Q6 Pilihan tim", value: labelOf(TEAM_OPTIONS, p.team.preference) },
        ...(p.team.preference === "flexible" ? [{ label: "Pertanyaan tim yang dijawab", value: p.team.flexibleTrack === "internal" ? "Internal" : "External" }] : []),
        { label: "Q7 Alasan & kontribusi", value: p.team.reason },
        { label: "Q8 Kontribusi nyata untuk target bersama", value: p.team.sharedContribution },
      ],
    },
  ];

  if (p.internal) {
    const i = p.internal;
    sections.push({
      step: "internal-objective",
      title: "C · Internal Team — Objective & Strategi",
      items: [
        { label: "Q9 Strategi mencapai 300 peserta", value: i.strategy },
        { label: "Q10 Membagi target & mengukur kemajuan", value: i.tracking },
        { label: "Q11 Dukungan untuk External", value: i.externalSupport },
        { label: "Q12 Jika pendaftaran masih kurang", value: i.recovery },
        { label: "Q13 Menjaga komposisi fresh graduate & experienced", value: i.composition },
      ],
    });
  }

  if (p.external) {
    const e = p.external;
    sections.push({
      step: "external-objective",
      title: "C · External Team — Objective & Outreach",
      items: [
        { label: "Q9 Perusahaan sasaran", value: e.companies },
        { label: "Profesional yang ingin diajak", value: e.targetProfile },
        { label: "Q10 Target peserta terkonfirmasi", value: `${e.kpi.total} orang (offline ${e.kpi.offline}, online ${e.kpi.online})` },
        { label: "Alasan target realistis", value: e.kpiReason },
        { label: "Q11 Cara menghubungi calon peserta", value: e.approach },
        { label: "Q12 Memastikan calon peserta bergabung", value: e.conversion },
        { label: "Q13 Pelaporan aktivitas & hambatan", value: e.reporting },
      ],
    });
  }

  const { reward, leadership } = p.final;
  sections.push(
    {
      step: "reward-leadership",
      title: "D · Reward & Leadership",
      items: [
        { label: "Q14 Rencana rekomendasi satu nama", value: labelOf(REWARD_OPTIONS, reward.plan) },
        ...(reward.plan === "yes"
          ? [
              {
                label: "Kandidat rekomendasi",
                sensitive: true,
                value: [
                  `Nama: ${or(reward.nomineeName)}`,
                  `Latar belakang: ${reward.nomineeBackground}`,
                  `Alasan: ${reward.nomineeReason}`,
                  `Konteks perkenalan: ${or(reward.nomineeContext)}`,
                  `Pernyataan transparansi: ${reward.transparencyAck ? "Ya" : "Tidak"}`,
                ],
              },
            ]
          : []),
        { label: "Q15 Minat menjadi koordinator", value: labelOf(LEADERSHIP_OPTIONS, leadership.interest) },
        ...(leadership.interest && leadership.interest !== "member_only"
          ? [
              { label: "a. Kesiapan memimpin", value: leadership.readiness },
              { label: "b. Tiga tindakan 30 hari pertama", value: leadership.actions.map((a, n) => `${n + 1}. ${a}`) },
            ]
          : []),
      ],
    },
    {
      step: "commitment",
      title: "D · Accountability & Final Commitment",
      items: [
        { label: "Q16 Personal accountability", value: p.final.accountability },
        { label: "Q17 Final commitment", value: p.final.finalCommitment },
        { label: "Q18 Bersedia ditempatkan di tim berbeda", value: labelOf(PLACEMENT_OPTIONS, p.final.placement.answer) },
        { label: "Catatan penempatan", value: or(p.final.placement.notes) },
        { label: "Persetujuan pemrosesan data", value: p.final.consent ? "Disetujui" : "Belum" },
      ],
    },
  );
  return sections;
}
