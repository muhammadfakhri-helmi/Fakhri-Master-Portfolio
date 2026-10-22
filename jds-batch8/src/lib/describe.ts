// Human-readable view of a submission, used by the candidate's review page and
// by the reviewer's detail view. Items about third parties are marked sensitive
// so the reviewer can keep them behind an explicit "show" action.

import {
  APPROACH_OPTIONS,
  INDUSTRY_OPTIONS,
  labelOf,
  LEADERSHIP_OPTIONS,
  PLACEMENT_OPTIONS,
  RELATIONSHIP_OPTIONS,
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
        ...(p.team.preference === "flexible" ? [{ label: "Studi kasus yang dikerjakan", value: p.team.flexibleTrack === "internal" ? "Internal" : "External" }] : []),
        { label: "Q7 Alasan & kontribusi", value: p.team.reason },
        { label: "Q8 Kontribusi nyata untuk target bersama", value: p.team.sharedContribution },
      ],
    },
  ];

  if (p.internal) {
    const i = p.internal;
    sections.push(
      {
        step: "internal-strategy",
        title: "C · Q9 Achieving 300 Participants",
        items: [
          { label: "a. Strategi utama", value: i.strategy.mainStrategy },
          { label: "b. 10 profesional operator (2–3 tahun)", value: i.strategy.operatorPlan },
          { label: "c. 10 senior service company (5+ tahun)", value: i.strategy.seniorServicePlan },
          { label: "d. 20 fresh graduate", value: i.strategy.freshGraduatePlan },
          { label: "e. 20 peserta networking & sponsorship", value: i.strategy.networkingPlan },
          { label: "f. Tiga langkah pertama", value: i.strategy.firstThreeSteps },
        ],
      },
      {
        step: "internal-execution",
        title: "C · Q10 Execution & Coordination",
        items: [
          { label: "a. Tiga prioritas Internal", value: i.execution.priorities },
          { label: "b. Dukungan untuk External", value: i.execution.externalSupport },
          { label: "c. Ukuran efektivitas", value: i.execution.effectivenessMeasure },
          { label: "d. Pembagian beban kerja", value: i.execution.workloadSplit },
        ],
      },
      {
        step: "internal-recovery",
        title: "C · Q11 Recovery Strategy (7 hari)",
        items: [
          { label: "Prioritas tindakan", value: i.recovery.priorities },
          { label: "Perubahan promosi/outreach", value: i.recovery.outreachChanges },
          { label: "Koordinasi dengan External", value: i.recovery.externalCoordination },
          { label: "KPI pemulihan", value: i.recovery.recoveryKpi },
          { label: "Risiko & antisipasi", value: i.recovery.risks },
        ],
      },
      {
        step: "internal-deliverables",
        title: "C · Q12 Deliverable 30 hari",
        items: i.deliverables.map((d, n) => ({
          label: `Deliverable ${n + 1}`,
          value: [`${d.title} — deadline: ${d.deadline}`, `Indikator: ${d.indicator}`, `Dampak ke jumlah peserta: ${d.impact}`],
        })),
      },
    );
  }

  if (p.external) {
    const e = p.external;
    sections.push(
      {
        step: "external-companies",
        title: "C · Q9 Target Company Mapping",
        items: e.companies.map((c, n) => ({
          label: `Perusahaan ${n + 1}: ${c.name}`,
          value: [
            `Industri: ${c.industry === "other" ? `Other — ${c.industryOther}` : labelOf(INDUSTRY_OPTIONS, c.industry)}`,
            `Target profesional: ${c.targetProfile}`,
            `Alasan: ${c.reason}`,
            `Jalur: ${c.approach === "other" ? `Other — ${c.approachOther}` : labelOf(APPROACH_OPTIONS, c.approach)}`,
          ],
        })),
      },
      {
        step: "external-prospects",
        title: "C · Q10 Personal Candidate Target",
        items: e.prospects.map((t, n) => ({
          label: `Calon peserta ${n + 1}: ${t.profile}`,
          sensitive: !!t.name,
          value: [
            ...(t.name ? [`Nama: ${t.name}`] : []),
            `Perusahaan/industri: ${t.companyOrIndustry}`,
            `Pengalaman: ${t.experience}`,
            `Relevansi: ${t.relevance}`,
            `Hubungan: ${labelOf(RELATIONSHIP_OPTIONS, t.relationship)}`,
            `Rencana pendekatan: ${t.approachPlan}`,
          ],
        })),
      },
      {
        step: "external-kpi",
        title: "C · Q11 Personal Recruitment KPI",
        items: [
          { label: "Target total terkonfirmasi", value: e.kpi.total },
          { label: "Offline / online", value: `${e.kpi.offline} / ${e.kpi.online}` },
          { label: "Experienced / fresh graduate", value: `${e.kpi.experienced} / ${e.kpi.freshGraduate}` },
          { label: "Operator / senior service / networking", value: `${e.kpi.operator} / ${e.kpi.seniorService} / ${e.kpi.networking}` },
          { label: "a. Prospek per minggu", value: e.kpi.weeklyProspects },
          { label: "b. Conversion rate", value: `${e.kpi.conversionRate}%` },
          { label: "c. Sumber prospek", value: e.kpi.prospectSources },
          { label: "d. Rencana jika 50% KPI", value: e.kpi.halfKpiPlan },
          { label: "e. Komitmen yang dipertanggungjawabkan", value: e.kpi.accountableCommitment },
        ],
      },
      { step: "external-outreach", title: "C · Q12 Real Outreach Simulation", items: [{ label: "Pesan outreach", value: e.outreachMessage }] },
      {
        step: "external-first30",
        title: "C · Q13 First 30 Days Execution",
        items: [
          { label: "Target perusahaan", value: e.first30.targetCompanies },
          { label: "Jumlah prospek", value: e.first30.prospectCount },
          { label: "Aktivitas mingguan", value: e.first30.weeklyActivities },
          { label: "Follow-up", value: e.first30.followUp },
          { label: "Target konversi", value: e.first30.conversionTarget },
          { label: "Pelaporan progres", value: e.first30.reporting },
        ],
      },
    );
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
