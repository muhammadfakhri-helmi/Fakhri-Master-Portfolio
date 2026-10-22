import { SKILL_OPTIONS, STATUS_OPTIONS, TEAM_OPTIONS, WEEKLY_HOURS_OPTIONS } from "../lib/content.ts";
import { LIMITS } from "../lib/validation.ts";
import type { StepProps } from "./types.ts";
import { Callout, fieldId, QuestionBlock, RadioCards, TextArea, TextField } from "./ui.tsx";

export function PersonalStep({ answers, update, errors }: StepProps) {
  const p = answers.personal;
  return (
    <div className="space-y-5">
      <QuestionBlock number="Q1" title="Nama lengkap">
        <TextField
          name="personal.fullName"
          label="Nama lengkap"
          value={p.fullName}
          autoComplete="name"
          error={errors["personal.fullName"]}
          onChange={(v) => update((d) => void (d.personal.fullName = v))}
        />
      </QuestionBlock>

      <QuestionBlock number="Q2" title="Background pendidikan dan pekerjaan">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="personal.university" label="Universitas" value={p.university} error={errors["personal.university"]} onChange={(v) => update((d) => void (d.personal.university = v))} />
          <TextField name="personal.major" label="Jurusan" value={p.major} error={errors["personal.major"]} onChange={(v) => update((d) => void (d.personal.major = v))} />
          <TextField
            name="personal.graduationYear"
            label="Angkatan / tahun kelulusan"
            value={p.graduationYear}
            inputMode="numeric"
            maxLength={4}
            placeholder="Contoh: 2021"
            error={errors["personal.graduationYear"]}
            onChange={(v) => update((d) => void (d.personal.graduationYear = v.replace(/\D/g, "")))}
          />
          <TextField
            name="personal.currentJob"
            label="Pekerjaan dan perusahaan saat ini"
            optional
            value={p.currentJob}
            placeholder="Contoh: Drilling Engineer — nama perusahaan"
            onChange={(v) => update((d) => void (d.personal.currentJob = v))}
          />
        </div>
        <RadioCards
          name="personal.status"
          legend="Status saat ini"
          options={STATUS_OPTIONS}
          value={p.status}
          columns={2}
          error={errors["personal.status"]}
          onChange={(v) => update((d) => void (d.personal.status = v))}
        />
      </QuestionBlock>

      <QuestionBlock number="Q3" title="Kontak" intro={<p>Data kontak bersifat pribadi dan hanya digunakan panitia untuk keperluan seleksi.</p>}>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="personal.email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Alamat email aktif"
            value={p.email}
            error={errors["personal.email"]}
            onChange={(v) => update((d) => void (d.personal.email = v))}
          />
          <TextField
            name="personal.whatsapp"
            label="Nomor WhatsApp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="08xx xxxx xxxx"
            value={p.whatsapp}
            error={errors["personal.whatsapp"]}
            onChange={(v) => update((d) => void (d.personal.whatsapp = v))}
          />
        </div>
      </QuestionBlock>
    </div>
  );
}

export function SkillsStep({ answers, update, errors }: StepProps) {
  const p = answers.personal;
  const toggle = (skill: string) =>
    update((d) => {
      const set = new Set(d.personal.skills);
      if (set.has(skill)) set.delete(skill);
      else set.add(skill);
      d.personal.skills = SKILL_OPTIONS.filter((s) => set.has(s));
    });
  const skillsId = fieldId("personal.skills");
  return (
    <div className="space-y-5">
      <QuestionBlock number="Q4" title="Keahlian yang dimiliki" intro={<p>Pilih semua yang sesuai.</p>}>
        <fieldset id={skillsId} tabIndex={-1} aria-invalid={errors["personal.skills"] ? true : undefined} className="outline-none">
          <legend className="sr-only">Keahlian</legend>
          <div className="flex flex-wrap gap-2">
            {SKILL_OPTIONS.map((skill) => {
              const checked = p.skills.includes(skill);
              return (
                <label
                  key={skill}
                  className={`cursor-pointer rounded-full border px-3.5 py-2 text-sm font-medium transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-leaf-400/40 ${
                    checked ? "border-forest-900 bg-forest-900 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-forest-600"
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(skill)} />
                  {checked ? "✓ " : ""}
                  {skill}
                </label>
              );
            })}
          </div>
          {errors["personal.skills"] && (
            <p className="error-text" role="alert">
              {errors["personal.skills"]}
            </p>
          )}
        </fieldset>
        {p.skills.includes("Other") && (
          <TextField name="personal.skillsOther" label="Keahlian lainnya" value={p.skillsOther} error={errors["personal.skillsOther"]} onChange={(v) => update((d) => void (d.personal.skillsOther = v))} />
        )}
        <TextArea
          name="personal.readiestSkill"
          label="Keahlian mana yang paling siap kamu gunakan untuk membantu mencapai target rekrutmen?"
          help="Jawaban singkat: sebutkan keahliannya dan contoh penggunaannya untuk rekrutmen."
          rows={3}
          min={20}
          maxLength={LIMITS.medium}
          value={p.readiestSkill}
          error={errors["personal.readiestSkill"]}
          onChange={(v) => update((d) => void (d.personal.readiestSkill = v))}
        />
      </QuestionBlock>

      <QuestionBlock number="Q5" title="Ketersediaan waktu">
        <RadioCards
          name="personal.weeklyHours"
          legend="Berapa jam per minggu yang realistis dapat kamu alokasikan untuk JDS Batch 8?"
          options={WEEKLY_HOURS_OPTIONS}
          value={p.weeklyHours}
          columns={2}
          error={errors["personal.weeklyHours"]}
          onChange={(v) => update((d) => void (d.personal.weeklyHours = v))}
        />
        <TextField
          name="personal.availableTimes"
          label="Kapan waktu yang paling memungkinkan?"
          placeholder="Contoh: Senin–Jumat setelah 19.00, Sabtu pagi"
          value={p.availableTimes}
          error={errors["personal.availableTimes"]}
          onChange={(v) => update((d) => void (d.personal.availableTimes = v))}
        />
        <TextArea
          name="personal.scheduleConstraints"
          label="Kendala jadwal yang perlu diketahui panitia"
          optional
          rows={3}
          maxLength={LIMITS.medium}
          placeholder="Contoh: rotasi kerja 14/14 di lapangan, ujian, perjalanan dinas"
          value={p.scheduleConstraints}
          onChange={(v) => update((d) => void (d.personal.scheduleConstraints = v))}
        />
      </QuestionBlock>
    </div>
  );
}

export function TeamStep({ answers, update, errors }: StepProps) {
  const t = answers.team;
  return (
    <div className="space-y-5">
      <QuestionBlock number="Q6" title="Pilihan tim">
        <RadioCards
          name="team.preference"
          legend="Dalam proses Rekrutmen JDS Batch 8, kamu lebih tertarik berkontribusi sebagai Internal atau External?"
          options={TEAM_OPTIONS}
          value={t.preference}
          error={errors["team.preference"]}
          onChange={(v) =>
            update((d) => {
              d.team.preference = v;
              if (v !== "flexible") d.team.flexibleTrack = "";
            })
          }
        />
        {t.preference === "flexible" && (
          <div className="step-enter">
            <RadioCards
              name="team.flexibleTrack"
              legend="Studi kasus mana yang ingin kamu kerjakan?"
              help="Kamu cukup mengerjakan satu studi kasus. Pilihan ini tidak mengurangi peluangmu ditempatkan di tim mana pun."
              options={[
                { value: "internal", label: "Studi kasus Internal", hint: "Strategi mencapai 300 peserta, koordinasi, dan pemulihan target." },
                { value: "external", label: "Studi kasus External", hint: "Pemetaan perusahaan & calon peserta, KPI pribadi, dan simulasi outreach." },
              ]}
              value={t.flexibleTrack}
              columns={2}
              error={errors["team.flexibleTrack"]}
              onChange={(v) => update((d) => void (d.team.flexibleTrack = v))}
            />
          </div>
        )}
      </QuestionBlock>

      <QuestionBlock number="Q7" title="Alasan memilih tim">
        <TextArea
          name="team.reason"
          label="Mengapa kamu memilih tim tersebut, dan kontribusi apa yang dapat kamu berikan?"
          min={LIMITS.essayMin}
          rows={5}
          value={t.reason}
          error={errors["team.reason"]}
          onChange={(v) => update((d) => void (d.team.reason = v))}
        />
      </QuestionBlock>

      <QuestionBlock number="Q8" title="Shared Responsibility">
        <Callout title="One Recruitment Team, Two Functions, One Shared Target">
          <p>
            Internal dan External memiliki fungsi yang berbeda, tetapi keduanya bertanggung jawab bersama terhadap pencapaian 300 peserta. Pembagian tim bukan pembagian siapa yang
            bertanggung jawab dan siapa yang tidak.
          </p>
        </Callout>
        <TextArea
          name="team.sharedContribution"
          label="Apa bentuk kontribusi nyata yang akan kamu lakukan untuk membantu keseluruhan target rekrutmen, termasuk pekerjaan di luar fungsi utama tim pilihanmu?"
          help="Tulis tindakan konkret (apa, untuk siapa, seberapa sering, hasil yang diharapkan) — bukan sekadar pernyataan kesediaan."
          min={LIMITS.essayMin}
          rows={5}
          value={t.sharedContribution}
          error={errors["team.sharedContribution"]}
          onChange={(v) => update((d) => void (d.team.sharedContribution = v))}
        />
      </QuestionBlock>
    </div>
  );
}
