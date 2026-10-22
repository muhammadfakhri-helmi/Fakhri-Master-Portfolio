import { APPROACH_OPTIONS, INDUSTRY_OPTIONS, RELATIONSHIP_OPTIONS, TARGETS, TEAM_SIZE } from "../lib/content.ts";
import { emptyCompany, emptyProspect, MAX_COMPANIES, MAX_PROSPECTS, MIN_COMPANIES, MIN_PROSPECTS } from "../lib/initial.ts";
import type { PersonalKpi } from "../lib/types.ts";
import { checkKpi, LIMITS } from "../lib/validation.ts";
import type { StepProps } from "./types.ts";
import { Callout, NumberField, QuestionBlock, RepeaterCard, Select, TextArea, TextField } from "./ui.tsx";

export function ExternalCompaniesStep({ answers, update, errors }: StepProps) {
  const list = answers.external.companies;
  return (
    <QuestionBlock
      number="Q9 · Case study"
      title="Target Company Mapping — Who will you recruit?"
      intro={
        <>
          <p>Sebagai anggota External Team, kamu memiliki tanggung jawab mencari calon peserta yang relevan dengan visi JDS Batch 8.</p>
          <p className="font-semibold text-forest-900">
            Perusahaan apa saja yang secara spesifik ingin kamu targetkan untuk mengajak calon peserta bergabung dengan JDS Batch 8? (minimal {MIN_COMPANIES} perusahaan)
          </p>
        </>
      }
    >
      <Callout>
        <p>
          Ini adalah <strong>rencana sourcing</strong>, bukan bukti koneksi yang sudah kamu miliki. Kamu tidak perlu sudah memiliki akses ke perusahaan tersebut.
        </p>
      </Callout>
      {errors["external.companies"] && <p className="error-text">{errors["external.companies"]}</p>}
      <div className="space-y-4">
        {list.map((c, i) => {
          const k = `external.companies.${i}`;
          const set = <F extends keyof typeof c>(field: F, v: (typeof c)[F]) => update((d) => void (d.external.companies[i]![field] = v));
          return (
            <RepeaterCard key={i} title={`Perusahaan ${i + 1}`} removable={list.length > MIN_COMPANIES} onRemove={() => update((d) => void d.external.companies.splice(i, 1))}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name={`${k}.name`} label="Nama perusahaan" value={c.name} error={errors[`${k}.name`]} onChange={(v) => set("name", v)} />
                <Select name={`${k}.industry`} label="Industri" options={INDUSTRY_OPTIONS} value={c.industry} error={errors[`${k}.industry`]} onChange={(v) => set("industry", v)} />
                {c.industry === "other" && (
                  <TextField name={`${k}.industryOther`} label="Industri lainnya" value={c.industryOther} error={errors[`${k}.industryOther`]} onChange={(v) => set("industryOther", v)} />
                )}
                <TextField
                  name={`${k}.targetProfile`}
                  label="Posisi / tipe profesional yang ingin dijangkau"
                  placeholder="Contoh: Drilling engineer 2–3 tahun"
                  value={c.targetProfile}
                  error={errors[`${k}.targetProfile`]}
                  onChange={(v) => set("targetProfile", v)}
                />
                <Select name={`${k}.approach`} label="Jalur pendekatan" options={APPROACH_OPTIONS} value={c.approach} error={errors[`${k}.approach`]} onChange={(v) => set("approach", v)} />
                {c.approach === "other" && (
                  <TextField name={`${k}.approachOther`} label="Jalur pendekatan lainnya" value={c.approachOther} error={errors[`${k}.approachOther`]} onChange={(v) => set("approachOther", v)} />
                )}
              </div>
              <TextArea
                name={`${k}.reason`}
                label="Alasan memilih perusahaan tersebut"
                rows={2}
                min={20}
                maxLength={LIMITS.medium}
                value={c.reason}
                error={errors[`${k}.reason`]}
                onChange={(v) => set("reason", v)}
              />
            </RepeaterCard>
          );
        })}
      </div>
      {list.length < MAX_COMPANIES && (
        <button type="button" className="btn-ghost w-full sm:w-auto" onClick={() => update((d) => void d.external.companies.push(emptyCompany()))}>
          + Add Company
        </button>
      )}
    </QuestionBlock>
  );
}

export function ExternalProspectsStep({ answers, update, errors }: StepProps) {
  const list = answers.external.prospects;
  return (
    <QuestionBlock
      number="Q10"
      title="Personal Candidate Target"
      intro={<p className="font-semibold text-forest-900">Siapa calon peserta yang secara realistis ingin kamu ajak untuk bergabung dengan JDS Batch 8? (minimal {MIN_PROSPECTS} target)</p>}
    >
      <Callout tone="warning" title="Lindungi data pihak ketiga">
        <ul className="list-disc space-y-1 pl-5">
          <li>Jangan mencantumkan nomor telepon, email pribadi, atau data sensitif calon peserta.</li>
          <li>Nama individu hanya dicantumkan bila relevan dan kamu berhak menyampaikannya. Jika belum ada izin, tulis jabatan atau profilnya saja.</li>
          <li>Penilaian tidak didasarkan pada seberapa tinggi jabatan orang yang kamu kenal, melainkan pada relevansi dan rencana pendekatanmu.</li>
        </ul>
      </Callout>
      {errors["external.prospects"] && <p className="error-text">{errors["external.prospects"]}</p>}
      <div className="space-y-4">
        {list.map((t, i) => {
          const k = `external.prospects.${i}`;
          const set = <F extends keyof typeof t>(field: F, v: (typeof t)[F]) => update((d) => void (d.external.prospects[i]![field] = v));
          return (
            <RepeaterCard key={i} title={`Calon peserta ${i + 1}`} removable={list.length > MIN_PROSPECTS} onRemove={() => update((d) => void d.external.prospects.splice(i, 1))}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  name={`${k}.name`}
                  label="Nama calon peserta"
                  optional
                  help="Kosongkan bila belum ada izin atau belum diketahui."
                  value={t.name}
                  error={errors[`${k}.name`]}
                  onChange={(v) => set("name", v)}
                />
                <TextField
                  name={`${k}.profile`}
                  label="Jabatan atau profil target"
                  placeholder="Contoh: Well engineer di operator geothermal"
                  value={t.profile}
                  error={errors[`${k}.profile`]}
                  onChange={(v) => set("profile", v)}
                />
                <TextField name={`${k}.companyOrIndustry`} label="Perusahaan / industri" value={t.companyOrIndustry} error={errors[`${k}.companyOrIndustry`]} onChange={(v) => set("companyOrIndustry", v)} />
                <TextField
                  name={`${k}.experience`}
                  label="Estimasi pengalaman kerja"
                  placeholder="Contoh: ±3 tahun / fresh graduate"
                  value={t.experience}
                  error={errors[`${k}.experience`]}
                  onChange={(v) => set("experience", v)}
                />
              </div>
              <Select
                name={`${k}.relationship`}
                label="Apakah sudah memiliki komunikasi profesional dengan orang tersebut?"
                options={RELATIONSHIP_OPTIONS}
                value={t.relationship}
                error={errors[`${k}.relationship`]}
                onChange={(v) => set("relationship", v)}
              />
              <TextArea name={`${k}.relevance`} label="Mengapa kandidat tersebut relevan?" rows={2} min={20} maxLength={LIMITS.medium} value={t.relevance} error={errors[`${k}.relevance`]} onChange={(v) => set("relevance", v)} />
              <TextArea name={`${k}.approachPlan`} label="Rencana pendekatan" rows={2} min={20} maxLength={LIMITS.medium} value={t.approachPlan} error={errors[`${k}.approachPlan`]} onChange={(v) => set("approachPlan", v)} />
            </RepeaterCard>
          );
        })}
      </div>
      {list.length < MAX_PROSPECTS && (
        <button type="button" className="btn-ghost w-full sm:w-auto" onClick={() => update((d) => void d.external.prospects.push(emptyProspect()))}>
          + Tambah calon peserta
        </button>
      )}
    </QuestionBlock>
  );
}

const KPI_FIELDS: { field: keyof PersonalKpi; label: string; help?: string }[] = [
  { field: "total", label: "Target total peserta terkonfirmasi", help: "Jumlah individu unik." },
  { field: "offline", label: "Target offline" },
  { field: "online", label: "Target online" },
  { field: "experienced", label: "Perkiraan profesional experienced" },
  { field: "freshGraduate", label: "Perkiraan fresh graduate" },
  { field: "operator", label: "Target kandidat operator migas/geothermal", help: "Bagian dari experienced." },
  { field: "seniorService", label: "Target senior service company (5+ tahun)", help: "Bagian dari experienced." },
  { field: "networking", label: "Target peserta dengan kontribusi networking", help: "Boleh tumpang tindih dengan kategori lain." },
];

export function ExternalKpiStep({ answers, update, errors }: StepProps) {
  const kpi = answers.external.kpi;
  const check = checkKpi(kpi);
  const n = check.numbers;
  const set = (field: keyof PersonalKpi, v: string) => update((d) => void (d.external.kpi[field] = v));
  const sumLine = (a?: number, b?: number) => (a !== undefined && b !== undefined ? a + b : "–");
  return (
    <QuestionBlock
      number="Q11"
      title="Personal Recruitment KPI"
      intro={<p className="font-semibold text-forest-900">Berapa peserta yang secara realistis sanggup kamu kontribusikan hingga benar-benar terkonfirmasi bergabung dengan JDS Batch 8?</p>}
    >
      <Callout title="Contoh target awal">
        <p>
          {TEAM_SIZE.examplePerExternalMember} peserta per anggota External, dengan asumsi perencanaan {TEAM_SIZE.externalAssumption} orang External (
          {TEAM_SIZE.examplePerExternalMember} × {TEAM_SIZE.externalAssumption} = {TEAM_SIZE.examplePerExternalMember * TEAM_SIZE.externalAssumption} peserta). Angka ini hanya contoh — isi
          angka yang realistis dan sanggup kamu pertanggungjawabkan.
        </p>
        <p className="text-sm">
          Subkategori (operator, senior service, networking) dapat tumpang tindih dan <strong>tidak dijumlahkan</strong> sebagai peserta unik. Target acara: {TARGETS.total} peserta (
          {TARGETS.offline} offline / {TARGETS.online} online; {TARGETS.experienced} experienced / {TARGETS.freshGraduate} fresh graduate).
        </p>
      </Callout>

      <div className="grid gap-4 sm:grid-cols-2">
        {KPI_FIELDS.map(({ field, label, help }) => (
          <NumberField key={field} name={`external.kpi.${field}`} label={label} help={help} value={kpi[field]} suffix="orang" error={errors[`external.kpi.${field}`]} onChange={(v) => set(field, v)} />
        ))}
      </div>

      <div className="grid gap-2.5 rounded-2xl bg-forest-900 p-4 text-sm text-forest-100 sm:grid-cols-3" aria-live="polite">
        <p>
          <span className="block text-xs text-leaf-300">Peserta unik</span>
          <span className="text-lg font-bold text-white tabular-nums">{n.total ?? "–"}</span>
        </p>
        <p>
          <span className="block text-xs text-leaf-300">Offline + online</span>
          <span className="text-lg font-bold text-white tabular-nums">{sumLine(n.offline, n.online)}</span>
          {n.total !== undefined && n.offline !== undefined && n.online !== undefined && (n.offline + n.online === n.total ? " ✓" : " ≠ total")}
        </p>
        <p>
          <span className="block text-xs text-leaf-300">Experienced + fresh graduate</span>
          <span className="text-lg font-bold text-white tabular-nums">{sumLine(n.experienced, n.freshGraduate)}</span>
          {n.total !== undefined && n.experienced !== undefined && n.freshGraduate !== undefined && (n.experienced + n.freshGraduate === n.total ? " ✓" : " ≠ total")}
        </p>
      </div>
      {check.warnings.map((w) => (
        <Callout key={w} tone="warning">
          <p>{w}</p>
        </Callout>
      ))}

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          name="external.kpi.weeklyProspects"
          label="a. Berapa prospek yang akan kamu hubungi setiap minggu?"
          value={kpi.weeklyProspects}
          suffix="/minggu"
          error={errors["external.kpi.weeklyProspects"]}
          onChange={(v) => set("weeklyProspects", v)}
        />
        <NumberField
          name="external.kpi.conversionRate"
          label="b. Berapa conversion rate yang kamu perkirakan?"
          help="Persentase prospek yang menjadi peserta terkonfirmasi."
          value={kpi.conversionRate}
          decimal
          suffix="%"
          error={errors["external.kpi.conversionRate"]}
          onChange={(v) => set("conversionRate", v)}
        />
      </div>
      {check.weeksNeeded !== null && (
        <p className="rounded-xl bg-leaf-400/10 px-4 py-3 text-sm text-forest-900">
          Dengan {n.weeklyProspects} prospek/minggu dan konversi {n.conversionRate}%, kamu memperoleh ±{(((n.weeklyProspects ?? 0) * (n.conversionRate ?? 0)) / 100).toFixed(1)} peserta per
          minggu — sekitar <strong>{check.weeksNeeded} minggu</strong> untuk mencapai {n.total} peserta.
        </p>
      )}
      <TextArea
        name="external.kpi.prospectSources"
        label="c. Dari mana sumber utama prospek tersebut?"
        rows={3}
        min={20}
        maxLength={LIMITS.medium}
        value={kpi.prospectSources}
        error={errors["external.kpi.prospectSources"]}
        onChange={(v) => set("prospectSources", v)}
      />
      <TextArea
        name="external.kpi.halfKpiPlan"
        label="d. Apa rencanamu jika hanya mencapai 50% KPI?"
        rows={3}
        min={LIMITS.partMin}
        value={kpi.halfKpiPlan}
        error={errors["external.kpi.halfKpiPlan"]}
        onChange={(v) => set("halfKpiPlan", v)}
      />
      <TextArea
        name="external.kpi.accountableCommitment"
        label="e. Apa bentuk komitmen yang sanggup kamu pertanggungjawabkan?"
        rows={3}
        min={LIMITS.partMin}
        value={kpi.accountableCommitment}
        error={errors["external.kpi.accountableCommitment"]}
        onChange={(v) => set("accountableCommitment", v)}
      />
    </QuestionBlock>
  );
}

export function ExternalOutreachStep({ answers, update, errors }: StepProps) {
  return (
    <QuestionBlock number="Q12" title="Real Outreach Simulation">
      <Callout tone="dark">
        <p>Seorang engineer yang bekerja di service company selama tujuh tahun bertanya:</p>
        <p className="text-lg font-semibold text-leaf-300">“Saya sudah bekerja cukup lama. Apa manfaatnya saya ikut JDS?”</p>
      </Callout>
      <TextArea
        name="external.outreachMessage"
        label="Bagaimana kamu menjawab dan meyakinkan profesional tersebut untuk mempertimbangkan bergabung dengan JDS?"
        help="Tulis dalam bentuk pesan WhatsApp atau LinkedIn yang siap dikirim. Jangan menjanjikan pekerjaan, sertifikat, sponsor, atau manfaat yang belum resmi disetujui JDS."
        min={LIMITS.outreachMin}
        rows={9}
        value={answers.external.outreachMessage}
        error={errors["external.outreachMessage"]}
        onChange={(v) => update((d) => void (d.external.outreachMessage = v))}
      />
    </QuestionBlock>
  );
}

const FIRST30: { field: keyof StepProps["answers"]["external"]["first30"]; label: string }[] = [
  { field: "targetCompanies", label: "Target perusahaan" },
  { field: "prospectCount", label: "Jumlah prospek" },
  { field: "weeklyActivities", label: "Aktivitas mingguan" },
  { field: "followUp", label: "Follow-up" },
  { field: "conversionTarget", label: "Target konversi" },
  { field: "reporting", label: "Cara melaporkan progres kepada tim Internal dan koordinator rekrutmen" },
];

export function ExternalFirst30Step({ answers, update, errors }: StepProps) {
  return (
    <QuestionBlock number="Q13" title="First 30 Days Execution" intro={<p>Jika kamu terpilih menjadi anggota External, apa yang akan kamu lakukan dalam 30 hari pertama?</p>}>
      {FIRST30.map(({ field, label }) => (
        <TextArea
          key={field}
          name={`external.first30.${field}`}
          label={label}
          rows={3}
          min={20}
          maxLength={LIMITS.medium * 2}
          value={answers.external.first30[field]}
          error={errors[`external.first30.${field}`]}
          onChange={(v) => update((d) => void (d.external.first30[field] = v))}
        />
      ))}
    </QuestionBlock>
  );
}
