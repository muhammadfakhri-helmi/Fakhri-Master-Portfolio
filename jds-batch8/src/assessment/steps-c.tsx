import { Leaf, Target } from "lucide-react";
import type { ReactNode } from "react";
import { TARGETS, TEAM_OBJECTIVES, TEAM_SIZE } from "../lib/content.ts";
import { MAX_COMPANIES } from "../lib/initial.ts";
import type { ExternalAssessment, InternalAssessment, PersonalKpi, Team } from "../lib/types.ts";
import { checkKpi, LIMITS } from "../lib/validation.ts";
import type { StepProps } from "./types.ts";
import { Callout, NumberField, TextArea, TextField } from "./ui.tsx";

function ObjectiveCard({ team }: { team: Team }) {
  const objective = TEAM_OBJECTIVES[team];
  return (
    <section className="rounded-[var(--radius-card)] bg-forest-900 p-5 text-cream-50 shadow-[var(--shadow-card)] sm:p-6">
      <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-leaf-300 uppercase">
        <Target className="size-4" aria-hidden="true" />
        {objective.title}
      </p>
      <p className="font-display mt-2 text-xl leading-snug font-semibold">{objective.summary}</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {objective.points.map((point) => (
          <li key={point} className="flex gap-2 text-[14px] text-cream-100">
            <Leaf className="mt-1 size-3.5 shrink-0 text-leaf-300" aria-hidden="true" />
            {point}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[13px] text-cream-200/80">Jawab singkat dan jelas — cukup 2–4 kalimat per pertanyaan.</p>
    </section>
  );
}

function Question({ number, children }: { number: string; children: ReactNode }) {
  return (
    <section className="card flex gap-3.5 p-5 sm:p-6">
      <span className="font-display grid size-10 shrink-0 place-items-center rounded-2xl bg-leaf-100 text-[15px] font-semibold text-forest-800 ring-1 ring-leaf-300/70" aria-hidden="true">
        {number}
      </span>
      <div className="min-w-0 flex-1 space-y-4">{children}</div>
    </section>
  );
}

const INTERNAL_QUESTIONS: { field: keyof InternalAssessment; question: string; help: string }[] = [
  {
    field: "strategy",
    question: `Bagaimana strategi utamamu agar target ${TARGETS.total} peserta (${TARGETS.offline} offline, ${TARGETS.online} online) tercapai?`,
    help: "Contoh: kanal promosi utama, segmen yang diprioritaskan, dan urutan langkahnya.",
  },
  {
    field: "tracking",
    question: "Bagaimana kamu membagi target dan mengukur kemajuannya setiap minggu?",
    help: "Contoh: target per anggota/kategori dan angka yang dipantau di weekly meeting.",
  },
  {
    field: "externalSupport",
    question: "Dukungan apa yang akan kamu berikan agar External mencapai KPI-nya?",
    help: "Contoh: materi promosi, daftar sasaran, template pesan, data progres.",
  },
  {
    field: "recovery",
    question: "Jika dua minggu sebelum pendaftaran ditutup jumlah peserta masih kurang, apa yang akan kamu lakukan?",
    help: "Sebutkan tindakan yang paling dulu kamu lakukan.",
  },
  {
    field: "composition",
    question: `Bagaimana memastikan ${TARGETS.freshGraduate} fresh graduate dan ${TARGETS.experienced} experienced tetap terpenuhi?`,
    help: `Termasuk minimal ${TARGETS.operator} profesional operator dan ${TARGETS.seniorService} senior service company.`,
  },
];

export function InternalObjectiveStep({ answers, update, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <ObjectiveCard team="internal" />
      {INTERNAL_QUESTIONS.map((q, i) => (
        <Question key={q.field} number={`Q${9 + i}`}>
          <TextArea
            name={`internal.${q.field}`}
            label={q.question}
            help={q.help}
            min={LIMITS.partMin}
            rows={4}
            value={answers.internal[q.field]}
            error={errors[`internal.${q.field}`]}
            onChange={(v) => update((d) => void (d.internal[q.field] = v))}
          />
        </Question>
      ))}
    </div>
  );
}

const EXTERNAL_TEXT: { field: Exclude<keyof ExternalAssessment, "companies" | "kpi" | "targetProfile" | "kpiReason">; question: string; help: string }[] = [
  { field: "approach", question: "Bagaimana cara kamu menghubungi calon peserta?", help: "Contoh: LinkedIn, referral rekan kerja, komunitas, alumni." },
  { field: "conversion", question: "Bagaimana kamu memastikan calon peserta benar-benar bergabung?", help: "Contoh: jadwal follow-up dan cara menjawab keraguan mereka." },
  { field: "reporting", question: "Bagaimana kamu melaporkan aktivitas dan hambatan kepada tim?", help: "Contoh: update mingguan di dashboard bersama dan weekly meeting." },
];

const KPI_FIELDS: { field: keyof PersonalKpi; label: string }[] = [
  { field: "total", label: "Total peserta terkonfirmasi" },
  { field: "offline", label: "Offline" },
  { field: "online", label: "Online" },
];

export function ExternalObjectiveStep({ answers, update, errors }: StepProps) {
  const ext = answers.external;
  const kpi = checkKpi(ext.kpi);
  const { total, offline, online } = kpi.numbers;
  return (
    <div className="space-y-5">
      <ObjectiveCard team="external" />

      <Question number="Q9">
        <fieldset id="f-external-companies" tabIndex={-1} aria-invalid={errors["external.companies"] ? true : undefined} className="space-y-2.5 outline-none">
          <legend className="label">Perusahaan apa saja yang ingin kamu targetkan?</legend>
          <p className="help !mt-0">Sebutkan minimal 3. Ini rencana sasaran, bukan bukti bahwa kamu sudah punya koneksi di sana.</p>
          {ext.companies.map((company, i) => (
            <TextField
              key={i}
              name={`external.companies.${i}`}
              label={<span className="text-sm font-medium text-[#7d7562]">Perusahaan {i + 1}</span>}
              value={company}
              error={errors[`external.companies.${i}`]}
              onChange={(v) => update((d) => void (d.external.companies[i] = v))}
            />
          ))}
          {errors["external.companies"] && (
            <p className="error-text" role="alert">
              {errors["external.companies"]}
            </p>
          )}
          {ext.companies.length < MAX_COMPANIES && (
            <button type="button" className="btn-ghost py-2" onClick={() => update((d) => void d.external.companies.push(""))}>
              + Tambah perusahaan
            </button>
          )}
        </fieldset>
        <TextArea
          name="external.targetProfile"
          label="Posisi atau tipe profesional yang ingin kamu ajak"
          help="Contoh: drilling engineer 2–3 tahun di operator, senior engineer 5+ tahun di service company."
          min={LIMITS.partMin}
          rows={2}
          maxLength={LIMITS.medium}
          value={ext.targetProfile}
          error={errors["external.targetProfile"]}
          onChange={(v) => update((d) => void (d.external.targetProfile = v))}
        />
      </Question>

      <Question number="Q10">
        <div>
          <p className="label">Berapa peserta yang sanggup kamu ajak hingga benar-benar terkonfirmasi?</p>
          <p className="help">
            Contoh target awal: {TEAM_SIZE.examplePerExternalMember} peserta per anggota External. Isi angka yang realistis dan sanggup kamu pertanggungjawabkan.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {KPI_FIELDS.map(({ field, label }) => (
            <NumberField
              key={field}
              name={`external.kpi.${field}`}
              label={label}
              suffix="orang"
              value={ext.kpi[field]}
              error={errors[`external.kpi.${field}`]}
              onChange={(v) => update((d) => void (d.external.kpi[field] = v))}
            />
          ))}
        </div>
        {total !== undefined && offline !== undefined && online !== undefined && (
          <p className={`rounded-xl px-4 py-2.5 text-sm ${offline + online === total ? "bg-leaf-100 text-forest-900" : "bg-amber-50 text-amber-900"}`} aria-live="polite">
            Offline + online = {offline + online} {offline + online === total ? "✓ sesuai target total" : `— harus sama dengan ${total}`}
          </p>
        )}
        {kpi.warnings.map((w) => (
          <Callout key={w} tone="warning">
            <p>{w}</p>
          </Callout>
        ))}
        <TextArea
          name="external.kpiReason"
          label="Mengapa angka ini realistis?"
          help="Contoh: berapa orang yang sudah kamu kenal di industri dan berapa prospek yang bisa kamu hubungi per minggu."
          min={LIMITS.partMin}
          rows={3}
          value={ext.kpiReason}
          error={errors["external.kpiReason"]}
          onChange={(v) => update((d) => void (d.external.kpiReason = v))}
        />
      </Question>

      {EXTERNAL_TEXT.map((q, i) => (
        <Question key={q.field} number={`Q${11 + i}`}>
          <TextArea
            name={`external.${q.field}`}
            label={q.question}
            help={q.help}
            min={LIMITS.partMin}
            rows={4}
            value={ext[q.field]}
            error={errors[`external.${q.field}`]}
            onChange={(v) => update((d) => void (d.external[q.field] = v))}
          />
        </Question>
      ))}
    </div>
  );
}
