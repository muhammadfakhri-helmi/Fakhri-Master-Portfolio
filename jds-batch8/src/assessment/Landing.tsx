import { RECRUITMENT_LEAD, TARGETS, TEAM_SIZE } from "../lib/content.ts";
import { LogoMark } from "./Logo.tsx";

const STATS = [
  { value: TARGETS.offline, label: "Peserta offline" },
  { value: TARGETS.online, label: "Peserta online" },
  { value: TARGETS.experienced, label: "Experienced professionals" },
  { value: TARGETS.freshGraduate, label: "Fresh graduate" },
  { value: `≥${TARGETS.operator}`, label: "Profesional operator migas/geothermal" },
  { value: `≥${TARGETS.seniorService}`, label: "Profesional service company 5+ tahun" },
  { value: `≥${TARGETS.networking}`, label: "Potensi networking/sponsorship" },
];

const SECTIONS = [
  { code: "A", title: "Personal Background", text: "Latar belakang, kontak, keahlian, dan ketersediaan waktu." },
  { code: "B", title: "Team Preference & Commitment", text: "Pilihan tim dan kontribusi nyata untuk target bersama." },
  { code: "C", title: "Strategic Case Assessment", text: "Studi kasus berbeda untuk Internal dan External." },
  { code: "D", title: "Leadership & Final Commitment", text: "Reward KPI, minat koordinator, akuntabilitas, dan komitmen." },
];

export function Landing({ onStart, keyReady, keyId }: { onStart: () => void; keyReady: boolean; keyId: string }) {
  return (
    <div>
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60rem_30rem_at_85%_-10%,#0e7490_0%,transparent_60%),radial-gradient(40rem_20rem_at_0%_110%,#18335c_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl px-4 pt-6 pb-14 sm:px-6 sm:pt-8 sm:pb-20">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-wide">Jakarta Drilling Society</p>
              <p className="text-xs text-navy-100/70">Rekrutmen Batch 8</p>
            </div>
          </div>
          <p className="mt-12 text-sm font-bold tracking-[0.2em] text-accent-400 uppercase sm:mt-16">JDS Batch 8</p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-6xl">Recruitment Committee Assessment</h1>
          <p className="mt-5 text-xl font-medium text-accent-300 sm:text-2xl">“One Team. One Commitment. One Recruitment Goal.”</p>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-navy-100/85 sm:text-lg">
            Asesmen ini membantu Ketua Rekrutmen memilih panitia berdasarkan kemampuan merancang strategi, memetakan target nyata, dan mempertanggungjawabkan KPI — bukan berdasarkan
            jabatan organisasi sebelumnya.
          </p>
          <div className="mt-9 grid max-w-3xl gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold tracking-wide text-accent-300 uppercase">Target</p>
              <p className="mt-1 text-2xl font-bold">{TARGETS.total} Participants</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold tracking-wide text-accent-300 uppercase">Internal Team</p>
              <p className="mt-1 text-2xl font-bold">{TEAM_SIZE.internal} Members</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold tracking-wide text-accent-300 uppercase">External Team</p>
              <p className="mt-1 text-lg leading-snug font-bold">Based on Recruitment Needs</p>
            </div>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" className="btn-accent px-7 py-3.5 text-base" onClick={onStart} disabled={!keyReady}>
              Mulai asesmen
              <span aria-hidden="true">→</span>
            </button>
            <p className="text-sm text-navy-100/75">Estimasi waktu pengerjaan: 15–25 menit</p>
          </div>
          {!keyReady && (
            <p role="status" className="mt-5 max-w-2xl rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              Website belum siap menerima jawaban: kunci enkripsi Ketua Rekrutmen belum dipasang. Silakan kembali setelah panitia mengumumkan bahwa asesmen telah dibuka.
            </p>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-14 px-4 py-14 sm:px-6">
        <section aria-labelledby="targets-title">
          <h2 id="targets-title" className="text-2xl font-bold text-navy-900">
            Target peserta JDS Batch 8
          </h2>
          <p className="mt-2 max-w-3xl text-slate-600">
            Target peserta berbeda dari jumlah panitia. Kategori networking dapat dihitung bersamaan dengan kategori experienced, dan target 20 fresh graduate tetap wajib dipenuhi dari
            total {TARGETS.total} peserta.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="card p-4">
                <p className="text-2xl font-extrabold text-navy-900 tabular-nums">{s.value}</p>
                <p className="mt-1 text-sm leading-snug text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Profesional operator diutamakan berpengalaman sekitar 2–3 tahun; senior service company minimal 5 tahun. Pengembangan sponsorship dilakukan melalui koneksi profesional yang
            etis — hubungan keluarga bukan syarat kelulusan.
          </p>
        </section>

        <section aria-labelledby="teams-title">
          <h2 id="teams-title" className="text-2xl font-bold text-navy-900">
            One Recruitment Team, Two Functions, One Shared Target
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="card p-6">
              <p className="text-xs font-bold tracking-[0.16em] text-accent-700 uppercase">Internal Team · {TEAM_SIZE.internal} orang</p>
              <h3 className="mt-2 text-lg font-bold text-navy-900">Memimpin perencanaan dan evaluasi</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                Mengembangkan strategi, menyiapkan kebutuhan rekrutmen, menganalisis data, membantu promosi, dan mengevaluasi capaian target. Internal bukan tim administratif pasif — ikut
                bertanggung jawab atas hasil akhir.
              </p>
            </article>
            <article className="card p-6">
              <p className="text-xs font-bold tracking-[0.16em] text-accent-700 uppercase">External Team · sesuai kebutuhan</p>
              <h3 className="mt-2 text-lg font-bold text-navy-900">Memimpin pelaksanaan outreach</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                Mencari kandidat, mendekati profesional industri secara langsung, dan mengonversi calon peserta menjadi peserta terkonfirmasi. Asumsi perencanaan {TEAM_SIZE.externalAssumption}{" "}
                orang — belum keputusan final.
              </p>
            </article>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-navy-900 p-5 text-white">
              <p className="font-semibold text-accent-300">Shared recruitment dashboard</p>
              <p className="mt-1 text-sm text-navy-100/85">Satu sumber data untuk target, progres per kategori, dan prioritas — dipakai Internal dan External bersama.</p>
            </div>
            <div className="rounded-2xl bg-navy-900 p-5 text-white">
              <p className="font-semibold text-accent-300">Weekly coordination meeting</p>
              <p className="mt-1 text-sm text-navy-100/85">Evaluasi mingguan bersama: capaian vs target, hambatan outreach, dan penyesuaian strategi.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="flow-title">
          <h2 id="flow-title" className="text-2xl font-bold text-navy-900">
            Alur asesmen
          </h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SECTIONS.map((s) => (
              <li key={s.code} className="card p-5">
                <span className="grid size-9 place-items-center rounded-lg bg-accent-400/15 font-bold text-accent-700">{s.code}</span>
                <p className="mt-3 font-semibold text-navy-900">{s.title}</p>
                <p className="mt-1 text-sm text-slate-500">{s.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-slate-500">
            Setelah review, jawabanmu diunduh sebagai file <code className="rounded bg-slate-100 px-1.5 py-0.5">.md</code> terenkripsi untuk dikirim secara manual kepada {RECRUITMENT_LEAD},
            Ketua Rekrutmen JDS Batch 8, melalui kanal resmi yang diberikan panitia.
          </p>
        </section>

        <section aria-labelledby="privacy-title" className="card p-6 sm:p-8">
          <h2 id="privacy-title" className="text-xl font-bold text-navy-900">
            Privasi & keamanan jawaban
          </h2>
          <ul className="mt-4 grid gap-3 text-[15px] text-slate-600 sm:grid-cols-2">
            <li>🔒 Jawaban dienkripsi di perangkatmu (AES-256-GCM + RSA-OAEP SHA-256) sebelum diunduh.</li>
            <li>🚫 Tidak ada server, database, login, analytics, atau pihak ketiga — website ini tidak dapat mengirim data.</li>
            <li>🧠 Jawaban hanya tersimpan di memori tab ini. Jangan menutup atau me-refresh halaman sebelum mengunduh file.</li>
            <li>🗝️ Hanya Ketua Rekrutmen yang memegang kunci privat untuk membuka file.{keyReady && keyId ? ` ID kunci: ${keyId}.` : ""}</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
