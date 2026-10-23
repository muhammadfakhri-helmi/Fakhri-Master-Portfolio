# JDS Batch 8 — Recruitment Committee Assessment V2

Website asesmen calon panitia **Rekrutmen Jakarta Drilling Society (JDS) Batch 8** dan
**reviewer lokal** untuk panitia penilai.

> **One Team. One Commitment. One Recruitment Goal.**
> Target 300 peserta · Internal Team 5 orang · External Team sesuai kebutuhan rekrutmen.

- **Website publik** (GitHub Pages, `/jds-batch8/`): kandidat langsung mengerjakan kuesioner
  multi-langkah berbahasa Indonesia. Di akhir, semua jawaban direkam ke satu file
  `JDS_B8_ASSESSMENT_<ID>.md` yang bisa dibaca biasa, lalu dikirim manual ke panitia. Tanpa login,
  tanpa server, tanpa database. CSP `connect-src 'none'` membuat halaman ini tidak bisa mengirim
  data ke mana pun.
- **Dashboard Kelayakan** (`/jds-batch8/reviewer.html`, tanpa install): seret banyak file `.md`
  sekaligus — dibaca di perangkat sendiri, tidak di-upload. Menampilkan Layak / Perlu wawancara /
  Belum layak / Belum dinilai, kuota Internal, proyeksi peserta External, pra-seleksi otomatis,
  detail jawaban, penilaian berbobot 0–5, deteksi duplikasi, ekspor CSV untuk Excel, dan backup skor.
  Skor tersimpan di browser (localStorage); versi server lokal (`npm run reviewer`, 127.0.0.1)
  menyimpannya sebagai file.

Dokumen lain: [DEPLOYMENT.md](DEPLOYMENT.md) · [SECURITY.md](SECURITY.md) · [REVIEWER_GUIDE.md](REVIEWER_GUIDE.md)

## Alur asesmen

| Bagian | Isi |
| --- | --- |
| A · Personal Background | Q1 nama, Q2 pendidikan & pekerjaan, Q3 kontak, Q4 keahlian, Q5 ketersediaan waktu |
| B · Team Preference | Q6 Internal / External / Flexible, Q7 alasan, Q8 kontribusi nyata untuk target bersama |
| C · Objective Tim | Satu halaman, 5 pertanyaan singkat sesuai objective tim. **Internal:** Q9 strategi 300 peserta, Q10 membagi target & mengukur kemajuan, Q11 dukungan untuk External, Q12 jika pendaftaran masih kurang, Q13 komposisi fresh graduate & experienced. **External:** Q9 perusahaan sasaran (min. 3) & profesional yang diajak, Q10 target peserta terkonfirmasi (total/offline/online) & alasannya, Q11 cara menghubungi, Q12 memastikan bergabung, Q13 pelaporan. **Flexible** memilih salah satu set pertanyaan. |
| D · Leadership & Commitment | Q14 reward rekomendasi satu nama (opsional, tidak dinilai), Q15 minat koordinator (pertanyaan lanjutan hanya bila "Ya"), Q16 akuntabilitas, Q17 komitmen, Q18 fleksibilitas penempatan, persetujuan data |
| Review | Seluruh jawaban + tombol "Ubah", validasi semua field wajib, **Download Assessment (.md)** |

Tidak ada pertanyaan tentang pengalaman organisasi/kepanitiaan sebelumnya.

Validasi KPI External: target 1–300 peserta dan offline + online = total. Jawaban teks cukup
singkat (minimal 20–30 karakter).

**Larangan copy-paste:** semua kolom jawaban (esai dan tindakan koordinator) menolak paste,
drag-and-drop teks, dan sisipan clipboard dari keyboard HP. Kandidat melihat pesan "Copy-paste
tidak diizinkan", dan jumlah percobaan yang diblokir dicatat di file `.md`
(`Percobaan paste yang diblokir`). Kolom identitas & kontak (nama, kampus, email, WhatsApp, angka)
tetap boleh di-paste.

## File jawaban (.md)

~~~markdown
# JDS Batch 8 — Recruitment Committee Assessment
| Submission ID | `7F29A3` |  Nama | Pilihan tim | Dikirim

## A · Personal Background
**Q1 Nama lengkap**
> …jawaban…
…semua bagian dan pertanyaan…

---
```jds-b8-data
{ …jawaban yang sama dalam format data, dibaca aplikasi reviewer… }
```
~~~

Bagian atas untuk dibaca manusia; blok `jds-b8-data` di akhir dibaca reviewer. Kandidat diminta
tidak mengubah file.

## Menjalankan

Butuh Node.js **22.18+** (skrip `.ts` dijalankan langsung oleh Node).

```bash
cd jds-batch8
npm install
npm run dev            # website asesmen → http://localhost:5190
```

| Script | Fungsi |
| --- | --- |
| `npm run build` | Build website publik ke `dist/` (path relatif, tanpa source map, dengan CSP) |
| `npm run check:build` | Gerbang rilis: tidak ada kode reviewer di `dist/`, CSP ada, path relatif, font tidak di-inline |
| `npm run verify` | typecheck → unit & UI test → build → check:build (dijalankan CI) |
| `npm run test:e2e` | Playwright: alur Internal & Flexible→External di desktop dan mobile, unduh file `.md`, reviewer, ekspor CSV |
| `npm run reviewer` | Dashboard versi server lokal di http://127.0.0.1:5199 (skor disimpan sebagai file) |

## Struktur

```
index.html                     entry website publik
src/assessment/                UI asesmen (React): beranda, langkah A–D, review, unduhan
reviewer.html, src/reviewer/   Dashboard Kelayakan: muat file, kelayakan, rekap, perbandingan strategi, detail & skor
src/lib/eligibility.ts         pra-seleksi otomatis + status kelayakan dari skor
src/lib/markdown.ts            format file jawaban .md (tulis & baca)
src/lib/validation.ts          validasi per langkah + KPI
src/lib/scoring.ts             kriteria berbobot, rubrik 0–5, klasifikasi
src/lib/recap.ts, csv.ts       ekspor CSV (BOM, CRLF, anti formula injection)
src/lib/intake.ts              muat file + deteksi duplikasi
reviewer/server.mjs            server lokal reviewer (127.0.0.1, sesi per-jalan)
scripts/check-public-build.ts  gerbang rilis build publik
tests/unit, tests/ui, tests/e2e
```

## Logo

Logo di website adalah **placeholder** (`src/assessment/Logo.tsx`, `public/favicon.svg`), bukan logo
resmi JDS. Ganti dengan file resmi dari JDS bila tersedia.

## Mengubah teks atau target

Target dan label ada di `src/lib/content.ts`; teks pertanyaan di `src/assessment/steps-*.tsx`;
aturan validasi di `src/lib/validation.ts`; bobot dan rubrik penilaian di `src/lib/scoring.ts`.
Jalankan `npm run verify` setelah mengubah.
