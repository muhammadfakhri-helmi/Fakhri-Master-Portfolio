import {
  ArrowRight,
  Building2,
  CalendarCheck,
  FileText,
  ChartLine,
  ClipboardX,
  Clock,
  Compass,
  Gauge,
  Handshake,
  LayoutDashboard,
  Leaf,
  ListChecks,
  Send,
  Shuffle,
  Target,
  UsersRound,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { TARGETS, TEAM_SIZE } from "../lib/content.ts";
import { SceneBanner } from "./Illustration.tsx";

const OBJECTIVES: { icon: LucideIcon; text: string }[] = [
  { icon: Target, text: "Merancang strategi untuk mencapai 300 peserta" },
  { icon: Building2, text: "Mengidentifikasi perusahaan dan calon peserta secara nyata" },
  { icon: Gauge, text: "Siap mempertanggungjawabkan KPI" },
  { icon: Handshake, text: "Bekerja bersama Internal dan External" },
  { icon: ChartLine, text: "Berkomitmen pada kontribusi yang terukur" },
  { icon: Compass, text: "Siap memimpin bila diperlukan" },
];

const COMPOSITION = [
  { label: "Peserta offline", value: TARGETS.offline },
  { label: "Peserta online", value: TARGETS.online },
  { label: "Experienced professionals", value: TARGETS.experienced },
  { label: "Fresh graduate", value: TARGETS.freshGraduate },
];

const MINIMUMS = [
  { value: TARGETS.operator, label: "Operator migas/geothermal", hint: "±2–3 tahun" },
  { value: TARGETS.seniorService, label: "Senior service company", hint: "5+ tahun" },
  { value: TARGETS.networking, label: "Potensi networking/sponsorship", hint: "boleh tumpang tindih" },
];

const ROLES: { icon: LucideIcon; tint: string; title: string; quota: string; text: string; focus: string[]; caseStudy: string }[] = [
  {
    icon: ChartLine,
    tint: "bg-[#e3ecd2] text-forest-700",
    title: "Internal Team",
    quota: `${TEAM_SIZE.internal} orang`,
    text: "Memimpin perencanaan dan evaluasi. Bukan tim administratif pasif — ikut bertanggung jawab atas hasil akhir.",
    focus: ["Strategi mencapai 300 peserta", "Membagi target & mengukur kemajuan", "Membantu External mencapai KPI"],
    caseStudy: "5 pertanyaan singkat: strategi 300 peserta, mengukur kemajuan, dukungan External, saat target kurang, komposisi peserta.",
  },
  {
    icon: Handshake,
    tint: "bg-[#f3e4cc] text-wood-700",
    title: "External Team",
    quota: "Sesuai kebutuhan",
    text: "Memimpin pelaksanaan outreach: mendekati profesional industri dan mengonversi calon peserta menjadi peserta terkonfirmasi.",
    focus: ["Perusahaan & profesional sasaran", "Kontribusi peserta terkonfirmasi", "Laporan aktivitas & hambatan"],
    caseStudy: "5 pertanyaan singkat: perusahaan sasaran, target peserta, cara menghubungi, memastikan bergabung, pelaporan.",
  },
  {
    icon: Shuffle,
    tint: "bg-[#e2ebe8] text-[#3f6b63]",
    title: "Flexible",
    quota: "Keduanya",
    text: "Bersedia ditempatkan di Internal maupun External. Kamu cukup memilih salah satu set pertanyaan.",
    focus: ["Pilih pertanyaan Internal atau External", "Durasi pengerjaan tetap sama", "Penempatan sesuai kebutuhan tim"],
    caseStudy: "Sesuai set pertanyaan yang kamu pilih.",
  },
];

const FLOW = [
  { code: "A", title: "Personal Background", text: "Pendidikan, kontak, keahlian, waktu", minutes: "2 mnt" },
  { code: "B", title: "Team Preference", text: "Pilihan tim & kontribusi bersama", minutes: "2 mnt" },
  { code: "C", title: "Objective Tim", text: "5 pertanyaan sesuai tim pilihanmu", minutes: "5 mnt" },
  { code: "D", title: "Leadership & Commitment", text: "Reward KPI, peran koordinator, komitmen", minutes: "3 mnt" },
  { code: "R", title: "Review & Download", text: "Periksa jawaban lalu unduh file .md", minutes: "1 mnt" },
];

function CardTitle({ icon: Icon = Leaf, children, id }: { icon?: LucideIcon; children: string; id: string }) {
  return (
    <h2 id={id} className="card-title">
      <Icon className="size-5 text-leaf-600" strokeWidth={2.2} aria-hidden="true" />
      {children}
    </h2>
  );
}

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-8 sm:py-8">
      <SceneBanner>
        <div className="flex flex-col gap-6 p-6 sm:p-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow">JDS Batch 8 · Rekrutmen Panitia</p>
            <h1 className="mt-3 text-[2.35rem] leading-[1.04] font-semibold text-forest-900 sm:text-[3.35rem]">Recruitment Committee Assessment</h1>
            <p className="font-display mt-3 text-lg font-medium text-leaf-700 sm:text-xl">“One Team. One Commitment. One Recruitment Goal.”</p>
            <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-[#5b5544] sm:text-base">
              Selamat datang! Asesmen ini memetakan cara kamu menyusun strategi, menetapkan target, dan berkontribusi nyata untuk mencapai 300 peserta JDS Batch 8.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button type="button" className="btn-accent px-6 py-3 text-base" onClick={onStart}>
                Mulai asesmen
                <ArrowRight className="size-4.5" aria-hidden="true" />
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-50/90 px-3.5 py-2 text-sm font-medium text-forest-800 ring-1 ring-cream-300">
                <Clock className="size-4 text-leaf-600" aria-hidden="true" />
                Estimasi waktu pengerjaan: 10–15 menit
              </span>
            </div>
          </div>
          <dl className="hidden w-60 shrink-0 space-y-3 rounded-2xl bg-cream-50/90 p-4 text-sm shadow-[var(--shadow-card)] ring-1 ring-cream-300/70 backdrop-blur md:block">
            {[
              { icon: ListChecks, term: "Struktur", desc: "4 bagian + review" },
              { icon: FileText, term: "Hasil", desc: "File jawaban .md" },
              { icon: WifiOff, term: "Akun", desc: "Tanpa login & tanpa server" },
            ].map(({ icon: Icon, term, desc }) => (
              <div key={term} className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-xl bg-leaf-100 text-forest-700">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="leading-tight">
                  <dt className="text-[11px] font-semibold tracking-wide text-[#8a826c] uppercase">{term}</dt>
                  <dd className="font-medium text-forest-900">{desc}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </SceneBanner>

      <div className="grid gap-5 lg:grid-cols-3">
        <section aria-labelledby="objective" className="card p-5 sm:p-6">
          <CardTitle id="objective" icon={Target}>
            Tujuan asesmen
          </CardTitle>
          <p className="mt-2 text-sm text-[#6b6450]">Kami ingin melihat kemampuan dan pemikiranmu saat ini:</p>
          <ul className="mt-4 space-y-2.5">
            {OBJECTIVES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[14.5px] leading-snug text-ink">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-leaf-100 text-forest-700">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-cream-100 px-3 py-2 text-[13px] text-[#6b6450]">Kami tidak menilai jabatan organisasi yang pernah kamu pegang.</p>
        </section>

        <section aria-labelledby="targets" className="card p-5 sm:p-6">
          <CardTitle id="targets" icon={Gauge}>
            Komposisi target peserta
          </CardTitle>
          <ul className="mt-4 space-y-3.5">
            {COMPOSITION.map((row) => (
              <li key={row.label}>
                <div className="flex items-baseline justify-between gap-3 text-[14.5px]">
                  <span className="text-ink">{row.label}</span>
                  <span className="font-semibold text-forest-900 tabular-nums">
                    {row.value}
                    <span className="font-normal text-[#a49a82]"> / {TARGETS.total}</span>
                  </span>
                </div>
                <div className="progress-track mt-1.5">
                  <div className="progress-fill" style={{ width: `${(row.value / TARGETS.total) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[11px] font-semibold tracking-[0.14em] text-[#8a826c] uppercase">Target minimum</p>
          <ul className="mt-2 space-y-2">
            {MINIMUMS.map((m) => (
              <li key={m.label} className="flex items-center gap-3 rounded-xl bg-cream-100 px-3 py-2">
                <span className="font-display w-11 shrink-0 text-lg font-semibold text-forest-900">≥{m.value}</span>
                <span className="min-w-0 text-[13.5px] leading-tight text-ink">
                  {m.label}
                  <span className="block text-[12px] text-[#8a826c]">{m.hint}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] leading-relaxed text-[#857d68]">Sponsorship dikembangkan lewat koneksi profesional yang etis — hubungan keluarga bukan syarat kelulusan.</p>
        </section>

        <section aria-labelledby="structure" className="card p-5 sm:p-6">
          <CardTitle id="structure" icon={UsersRound}>
            Struktur tim rekrutmen
          </CardTitle>
          <div className="mt-4 space-y-2.5">
            {[
              { k: "Target", v: "300 Participants" },
              { k: "Internal Team", v: "5 Members" },
              { k: "External Team", v: "Based on Recruitment Needs" },
            ].map((tile) => (
              <div key={tile.k} className="rounded-2xl bg-forest-900 px-4 py-3 text-cream-50">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-leaf-300 uppercase">{tile.k}</p>
                <p className="font-display text-xl leading-snug font-semibold">{tile.v}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-[#857d68]">
            Target peserta berbeda dari jumlah panitia. External memakai asumsi perencanaan {TEAM_SIZE.externalAssumption} orang — belum keputusan final.
          </p>
        </section>
      </div>

      <section aria-labelledby="roles" className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <CardTitle id="roles" icon={Compass}>
            Pilihan tim
          </CardTitle>
          <p className="text-sm text-[#857d68]">Kamu memilih salah satu di Section B.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {ROLES.map((role) => (
            <article key={role.title} className="flex flex-col rounded-[1.25rem] border border-cream-300/80 bg-white/60 p-5">
              <div className="flex items-center gap-3">
                <span className={`grid size-14 place-items-center rounded-full ring-4 ring-white ${role.tint}`}>
                  <role.icon className="size-6" strokeWidth={2.2} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg leading-tight font-semibold text-forest-900">{role.title}</h3>
                  <span className="mt-1 inline-block rounded-full bg-cream-200 px-2.5 py-0.5 text-[12px] font-semibold text-forest-800">{role.quota}</span>
                </div>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-[#5b5544]">{role.text}</p>
              <ul className="mt-3 space-y-1.5 text-[13.5px] text-ink">
                {role.focus.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Leaf className="mt-0.5 size-3.5 shrink-0 text-leaf-600" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-4 text-[12.5px] leading-relaxed text-[#857d68]">
                <span className="font-semibold text-forest-800">Pertanyaan: </span>
                {role.caseStudy}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="together" className="card p-5 sm:p-6">
        <CardTitle id="together" icon={Leaf}>
          One Recruitment Team, Two Functions, One Shared Target
        </CardTitle>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { icon: LayoutDashboard, title: "Shared recruitment dashboard", text: "Satu sumber data untuk target, progres per kategori, dan prioritas — dipakai Internal dan External bersama." },
            { icon: CalendarCheck, title: "Weekly coordination meeting", text: "Evaluasi mingguan bersama: capaian vs target, hambatan outreach, dan penyesuaian strategi." },
            { icon: Handshake, title: "Tanggung jawab bersama", text: "Internal memimpin perencanaan, External memimpin outreach, tetapi target 300 peserta adalah milik semua." },
          ].map((note) => (
            <div key={note.title} className="flex gap-3 rounded-2xl bg-cream-100 p-4">
              <note.icon className="mt-0.5 size-5 shrink-0 text-wood-500" aria-hidden="true" />
              <div>
                <p className="font-semibold text-forest-900">{note.title}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-[#6b6450]">{note.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <section aria-labelledby="flow" className="card p-5 sm:p-6">
          <CardTitle id="flow" icon={ListChecks}>
            Alur asesmen
          </CardTitle>
          <ol className="mt-4 space-y-2">
            {FLOW.map((step) => (
              <li key={step.code} className="flex items-center gap-3 rounded-2xl bg-white/60 px-3 py-2.5 ring-1 ring-cream-300/60">
                <span className="font-display grid size-9 shrink-0 place-items-center rounded-xl bg-forest-700 text-base font-semibold text-cream-50">{step.code}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-semibold text-forest-900">{step.title}</span>
                  <span className="block text-[13px] text-[#857d68]">{step.text}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-[#a49a82]">{step.minutes}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="privacy" className="card p-5 sm:p-6">
          <CardTitle id="privacy" icon={FileText}>
            Jawaban & pengiriman
          </CardTitle>
          <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#5b5544]">
            {[
              { icon: FileText, text: "Semua jawaban direkam ke satu file .md yang bisa kamu baca dan simpan sendiri." },
              { icon: WifiOff, text: "Tidak ada login, server, database, atau analytics — halaman ini tidak mengirim data ke mana pun." },
              { icon: Clock, text: "Jawaban hanya ada di tab ini. Jangan menutup atau me-refresh halaman sebelum mengunduh file." },
              { icon: ClipboardX, text: "Copy-paste dinonaktifkan di kolom jawaban. Tulis jawabanmu sendiri; percobaan paste ikut tercatat di file." },
              { icon: Send, text: "Data kontak dan jawabanmu hanya digunakan panitia untuk seleksi kepanitiaan." },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3">
                <Icon className="mt-0.5 size-4.5 shrink-0 text-leaf-600" aria-hidden="true" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-cream-100 px-3 py-2 text-[13px] text-[#6b6450]">
            Setelah selesai, kirim file <code className="font-semibold text-forest-800">.md</code> secara manual melalui kanal resmi yang diberikan panitia.
          </p>
        </section>
      </div>
    </main>
  );
}
