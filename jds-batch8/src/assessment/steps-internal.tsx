import { TARGETS, TEAM_SIZE } from "../lib/content.ts";
import { emptyDeliverable, MAX_DELIVERABLES, MIN_DELIVERABLES } from "../lib/initial.ts";
import type { InternalAssessment } from "../lib/types.ts";
import { LIMITS } from "../lib/validation.ts";
import type { StepProps } from "./types.ts";
import { Callout, QuestionBlock, RepeaterCard, TextArea, TextField } from "./ui.tsx";

type Group = "strategy" | "execution" | "recovery";

function PartArea<G extends Group>({
  group,
  field,
  letter,
  label,
  help,
  answers,
  update,
  errors,
}: StepProps & { group: G; field: keyof InternalAssessment[G] & string; letter: string; label: string; help?: string }) {
  const section = answers.internal[group] as Record<string, string>;
  const name = `internal.${group}.${field}`;
  return (
    <TextArea
      name={name}
      label={
        <>
          <span className="mr-1.5 text-leaf-700">{letter}.</span>
          {label}
        </>
      }
      help={help}
      min={LIMITS.partMin}
      rows={4}
      value={section[field] ?? ""}
      error={errors[name]}
      onChange={(v) => update((d) => void ((d.internal[group] as Record<string, string>)[field] = v))}
    />
  );
}

export function InternalStrategyStep(props: StepProps) {
  return (
    <QuestionBlock
      number="Q9 · Case study"
      title="Achieving 300 Participants"
      intro={
        <>
          <p>
            Sebagai bagian dari {TEAM_SIZE.internal} orang Internal Team, kamu ditantang membantu mencapai {TARGETS.total} peserta JDS Batch 8, terdiri dari {TARGETS.offline} offline
            dan {TARGETS.online} online, dengan komposisi {TARGETS.experienced} experienced dan {TARGETS.freshGraduate} fresh graduate.
          </p>
          <p className="font-medium text-forest-800">Jawaban harus menyertakan langkah nyata dan prioritas.</p>
        </>
      }
    >
      <PartArea {...props} group="strategy" field="mainStrategy" letter="a" label="Bagaimana strategi utama kamu agar target 300 peserta tercapai?" />
      <PartArea {...props} group="strategy" field="operatorPlan" letter="b" label="Bagaimana mendapatkan minimal 10 profesional operator migas/geothermal dengan pengalaman 2–3 tahun?" />
      <PartArea {...props} group="strategy" field="seniorServicePlan" letter="c" label="Bagaimana menarik minimal 10 profesional service company dengan pengalaman 5+ tahun?" />
      <PartArea {...props} group="strategy" field="freshGraduatePlan" letter="d" label="Bagaimana memastikan 20 fresh graduate terpenuhi tanpa mengurangi kualitas komposisi experienced?" />
      <PartArea
        {...props}
        group="strategy"
        field="networkingPlan"
        letter="e"
        label="Bagaimana membantu memperoleh 20 peserta yang memiliki potensi membangun networking dan peluang sponsorship?"
        help="Pengembangan sponsorship dilakukan melalui koneksi profesional yang etis — hubungan keluarga bukan syarat kelulusan."
      />
      <PartArea {...props} group="strategy" field="firstThreeSteps" letter="f" label="Apa tiga langkah pertama yang akan kamu lakukan sebelum open recruitment?" help="Urutkan berdasarkan prioritas (1, 2, 3)." />
    </QuestionBlock>
  );
}

export function InternalExecutionStep(props: StepProps) {
  return (
    <QuestionBlock
      number="Q10"
      title="Strategy Execution & Team Coordination"
      intro={<p>Kamu hanya mempunyai lima anggota Internal dan harus membantu External yang bertugas menjangkau calon peserta.</p>}
    >
      <PartArea {...props} group="execution" field="priorities" letter="a" label="Apa tiga prioritas pekerjaan Internal?" />
      <PartArea {...props} group="execution" field="externalSupport" letter="b" label="Dukungan konkret apa yang kamu berikan kepada External?" />
      <PartArea {...props} group="execution" field="effectivenessMeasure" letter="c" label="Bagaimana cara mengukur apakah strategi berjalan efektif?" />
      <PartArea {...props} group="execution" field="workloadSplit" letter="d" label="Bagaimana membagi beban pekerjaan tanpa membentuk terlalu banyak sub-divisi?" />
    </QuestionBlock>
  );
}

const RECOVERY_STATUS = [
  { label: "Offline", now: 120, target: 200 },
  { label: "Online", now: 35, target: 100 },
  { label: "Fresh Graduate", now: 8, target: 20 },
  { label: "Operator professionals", now: 4, target: 10 },
  { label: "Senior service company", now: 3, target: 10 },
  { label: "Networking contributors", now: 6, target: 20 },
];

export function InternalRecoveryStep(props: StepProps) {
  return (
    <QuestionBlock
      number="Q11 · Case study"
      title="Target tidak tercapai — Recruitment Recovery Strategy"
      intro={<p>Dua minggu sebelum pendaftaran ditutup, kondisi pendaftaran adalah sebagai berikut:</p>}
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {RECOVERY_STATUS.map((row) => {
          const pct = Math.round((row.now / row.target) * 100);
          return (
            <div key={row.label} className="rounded-xl border border-stone-200 bg-forest-50 p-3">
              <p className="text-xs font-medium text-stone-500">{row.label}</p>
              <p className="mt-0.5 text-lg font-bold text-forest-900 tabular-nums">
                {row.now}
                <span className="text-sm font-medium text-stone-400">/{row.target}</span>
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200" aria-hidden="true">
                <div className={`h-full rounded-full ${pct < 50 ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <Callout tone="dark">
        <p className="font-semibold">Jika kamu bertanggung jawab terhadap strategi, bagaimana kamu memperbaiki situasi ini dalam tujuh hari?</p>
      </Callout>
      <PartArea {...props} group="recovery" field="priorities" letter="a" label="Prioritas tindakan" help="Kategori mana yang ditangani lebih dulu dan mengapa." />
      <PartArea {...props} group="recovery" field="outreachChanges" letter="b" label="Perubahan strategi promosi atau outreach" />
      <PartArea {...props} group="recovery" field="externalCoordination" letter="c" label="Cara berkoordinasi dengan External" />
      <PartArea {...props} group="recovery" field="recoveryKpi" letter="d" label="KPI pemulihan" help="Angka harian/mingguan yang akan kamu pantau selama tujuh hari." />
      <PartArea {...props} group="recovery" field="risks" letter="e" label="Risiko dan langkah antisipasi" />
    </QuestionBlock>
  );
}

export function InternalDeliverablesStep({ answers, update, errors }: StepProps) {
  const list = answers.internal.deliverables;
  return (
    <QuestionBlock
      number="Q12"
      title="Personal Strategy Contribution"
      intro={
        <p>
          Jika kamu resmi menjadi anggota Internal, kontribusi atau output apa yang sanggup kamu hasilkan secara pribadi dalam 30 hari pertama? Isi minimal {MIN_DELIVERABLES} deliverable
          yang jelas.
        </p>
      }
    >
      {errors["internal.deliverables"] && <p className="error-text">{errors["internal.deliverables"]}</p>}
      <div className="space-y-4">
        {list.map((item, i) => {
          const k = `internal.deliverables.${i}`;
          const set = (field: keyof typeof item, v: string) => update((d) => void (d.internal.deliverables[i]![field] = v));
          return (
            <RepeaterCard
              key={i}
              title={`Deliverable ${i + 1}`}
              removable={list.length > MIN_DELIVERABLES}
              onRemove={() => update((d) => void d.internal.deliverables.splice(i, 1))}
            >
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <TextField name={`${k}.title`} label="Deliverable" placeholder="Contoh: Dashboard progres pendaftaran per kategori" value={item.title} error={errors[`${k}.title`]} onChange={(v) => set("title", v)} />
                <TextField name={`${k}.deadline`} label="Deadline" placeholder="Contoh: Hari ke-10" value={item.deadline} error={errors[`${k}.deadline`]} onChange={(v) => set("deadline", v)} />
              </div>
              <TextArea name={`${k}.indicator`} label="Indikator keberhasilan" rows={2} min={15} maxLength={LIMITS.medium} value={item.indicator} error={errors[`${k}.indicator`]} onChange={(v) => set("indicator", v)} />
              <TextArea
                name={`${k}.impact`}
                label="Hubungan deliverable dengan peningkatan jumlah peserta"
                rows={2}
                min={20}
                maxLength={LIMITS.medium}
                value={item.impact}
                error={errors[`${k}.impact`]}
                onChange={(v) => set("impact", v)}
              />
            </RepeaterCard>
          );
        })}
      </div>
      {list.length < MAX_DELIVERABLES && (
        <button type="button" className="btn-ghost w-full sm:w-auto" onClick={() => update((d) => void d.internal.deliverables.push(emptyDeliverable()))}>
          + Tambah deliverable
        </button>
      )}
    </QuestionBlock>
  );
}
