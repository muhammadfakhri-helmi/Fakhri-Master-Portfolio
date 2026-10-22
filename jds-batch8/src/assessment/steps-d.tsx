import { LEADERSHIP_OPTIONS, PLACEMENT_OPTIONS, REWARD_OPTIONS } from "../lib/content.ts";
import { LIMITS } from "../lib/validation.ts";
import type { StepProps } from "./types.ts";
import { Callout, Checkbox, QuestionBlock, RadioCards, TextArea, TextField } from "./ui.tsx";

export function RewardLeadershipStep({ answers, update, errors }: StepProps) {
  const { reward, leadership } = answers.final;
  const leads = leadership.interest !== "" && leadership.interest !== "member_only";
  return (
    <div className="space-y-5">
      <QuestionBlock number="Q14" title="KPI Reward — Recruitment Performance Reward">
        <Callout title="Recruitment Performance Reward">
          <p>
            Panitia yang berhasil memenuhi KPI individu yang telah disepakati berhak memperoleh kesempatan mengajukan satu nama kandidat rekomendasi untuk dipertimbangkan dalam proses
            rekrutmen JDS Batch 8.
          </p>
          <p>
            Hak ini adalah <strong>hak mengajukan rekomendasi</strong>, bukan jaminan kandidat tersebut otomatis diterima. Setiap kandidat rekomendasi tetap harus memenuhi persyaratan,
            standar seleksi, dan ketentuan kuota JDS.
          </p>
          <p className="text-sm">Jawaban pada bagian ini hanya informasi tambahan dan tidak memengaruhi nilai asesmenmu.</p>
        </Callout>
        <RadioCards
          name="final.reward.plan"
          legend="Jika kamu berhasil memenuhi KPI, apakah kamu berencana menggunakan kesempatan memberikan rekomendasi satu nama calon peserta?"
          options={REWARD_OPTIONS}
          value={reward.plan}
          error={errors["final.reward.plan"]}
          onChange={(v) => update((d) => void (d.final.reward.plan = v))}
        />
        {reward.plan === "yes" && (
          <div className="step-enter space-y-4 rounded-2xl border border-stone-200 bg-forest-50/60 p-4 sm:p-5">
            <p className="text-sm text-stone-600">Jangan mencantumkan detail kontak pribadi kandidat rekomendasi.</p>
            <TextField
              name="final.reward.nomineeName"
              label="Nama kandidat rekomendasi"
              optional
              value={reward.nomineeName}
              error={errors["final.reward.nomineeName"]}
              onChange={(v) => update((d) => void (d.final.reward.nomineeName = v))}
            />
            <TextArea
              name="final.reward.nomineeBackground"
              label="Latar belakang profesional kandidat"
              rows={2}
              min={10}
              maxLength={LIMITS.medium}
              value={reward.nomineeBackground}
              error={errors["final.reward.nomineeBackground"]}
              onChange={(v) => update((d) => void (d.final.reward.nomineeBackground = v))}
            />
            <TextArea
              name="final.reward.nomineeReason"
              label="Alasan kandidat tersebut layak dipertimbangkan"
              rows={3}
              min={30}
              maxLength={LIMITS.medium * 2}
              value={reward.nomineeReason}
              error={errors["final.reward.nomineeReason"]}
              onChange={(v) => update((d) => void (d.final.reward.nomineeReason = v))}
            />
            <TextField
              name="final.reward.nomineeContext"
              label="Hubungan profesional atau konteks perkenalan"
              optional
              value={reward.nomineeContext}
              error={errors["final.reward.nomineeContext"]}
              onChange={(v) => update((d) => void (d.final.reward.nomineeContext = v))}
            />
            <Checkbox
              name="final.reward.transparencyAck"
              checked={reward.transparencyAck}
              error={errors["final.reward.transparencyAck"]}
              onChange={(v) => update((d) => void (d.final.reward.transparencyAck = v))}
            >
              Saya memahami bahwa pengajuan nama harus dilakukan secara transparan dan tidak boleh digunakan untuk menghindari proses seleksi.
            </Checkbox>
          </div>
        )}
        {reward.plan === "maybe" && <p className="text-sm text-stone-500">Tidak apa-apa. Kamu dapat menentukan kandidat nanti tanpa memengaruhi penilaian.</p>}
      </QuestionBlock>

      <QuestionBlock
        number="Q15"
        title="Leadership Interest"
        intro={<p>Koordinator tim memastikan pekerjaan tim berjalan sesuai rencana dan target. Peran ini opsional — memilih “Tidak” tidak mengurangi penilaian.</p>}
      >
        <RadioCards
          name="final.leadership.interest"
          legend="Apakah kamu tertarik menjadi Koordinator Tim Internal atau External pada Rekrutmen JDS Batch 8?"
          options={LEADERSHIP_OPTIONS}
          value={leadership.interest}
          error={errors["final.leadership.interest"]}
          onChange={(v) => update((d) => void (d.final.leadership.interest = v))}
        />
        {leads && (
          <div className="step-enter space-y-4">
            <TextArea
              name="final.leadership.readiness"
              label="a. Mengapa kamu merasa siap memimpin tim?"
              rows={4}
              min={LIMITS.essayMin}
              value={leadership.readiness}
              error={errors["final.leadership.readiness"]}
              onChange={(v) => update((d) => void (d.final.leadership.readiness = v))}
            />
            <fieldset className="space-y-3">
              <legend className="label">b. Apa tiga tindakan yang akan kamu lakukan dalam 30 hari pertama sebagai koordinator untuk memastikan pekerjaan tim berjalan?</legend>
              {leadership.actions.map((action, i) => (
                <TextField
                  key={i}
                  name={`final.leadership.actions.${i}`}
                  label={`Tindakan ${i + 1}`}
                  maxLength={LIMITS.medium}
                  value={action}
                  error={errors[`final.leadership.actions.${i}`]}
                  onChange={(v) => update((d) => void (d.final.leadership.actions[i] = v))}
                />
              ))}
            </fieldset>
          </div>
        )}
      </QuestionBlock>
    </div>
  );
}

export function CommitmentStep({ answers, update, errors }: StepProps) {
  const f = answers.final;
  return (
    <div className="space-y-5">
      <QuestionBlock number="Q16" title="Personal Accountability">
        <TextArea
          name="final.accountability"
          label="Jika kamu menerima tanggung jawab tertentu tetapi ternyata target yang disepakati tidak tercapai, tindakan apa yang akan kamu lakukan?"
          help="Jelaskan tanggung jawab, komunikasi, dan langkah perbaikan."
          rows={5}
          min={LIMITS.essayMin}
          value={f.accountability}
          error={errors["final.accountability"]}
          onChange={(v) => update((d) => void (d.final.accountability = v))}
        />
      </QuestionBlock>
      <QuestionBlock number="Q17" title="Final Commitment">
        <TextArea
          name="final.finalCommitment"
          label="Apa komitmen nyata yang dapat kamu berikan kepada JDS Batch 8 dan mengapa kami sebaiknya memilihmu sebagai bagian dari tim rekrutmen?"
          help="Ringkas tetapi konkret."
          rows={5}
          min={LIMITS.essayMin}
          value={f.finalCommitment}
          error={errors["final.finalCommitment"]}
          onChange={(v) => update((d) => void (d.final.finalCommitment = v))}
        />
      </QuestionBlock>
      <QuestionBlock number="Q18" title="Placement Flexibility">
        <RadioCards
          name="final.placement.answer"
          legend="Jika ditempatkan pada tim yang berbeda dari pilihan awal, apakah kamu bersedia?"
          options={PLACEMENT_OPTIONS}
          value={f.placement.answer}
          columns={1}
          error={errors["final.placement.answer"]}
          onChange={(v) => update((d) => void (d.final.placement.answer = v))}
        />
        <TextArea
          name="final.placement.notes"
          label="Catatan"
          optional
          rows={2}
          maxLength={LIMITS.medium}
          value={f.placement.notes}
          onChange={(v) => update((d) => void (d.final.placement.notes = v))}
        />
      </QuestionBlock>
      <div className="card p-5 sm:p-7">
        <Checkbox name="final.consent" checked={f.consent} error={errors["final.consent"]} onChange={(v) => update((d) => void (d.final.consent = v))}>
          Saya menyetujui pemrosesan data jawaban saya oleh panitia rekrutmen JDS Batch 8 untuk keperluan seleksi kepanitiaan. Saya memahami bahwa jawaban dienkripsi di perangkat saya dan
          hanya dapat dibuka oleh panitia penilai.
        </Checkbox>
      </div>
    </div>
  );
}
