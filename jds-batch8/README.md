# JDS Batch 8 — Recruitment Committee Assessment V2

Website asesmen calon panitia **Rekrutmen Jakarta Drilling Society (JDS) Batch 8** dan
**reviewer privat lokal** untuk Ketua Rekrutmen, Muhammad Fakhri Helmi.

> **One Team. One Commitment. One Recruitment Goal.**
> Target 300 peserta · Internal Team 5 orang · External Team sesuai kebutuhan rekrutmen.

- **Website publik** (GitHub Pages, `/jds-batch8/`): kuesioner multi-langkah berbahasa Indonesia,
  jawaban dienkripsi di browser kandidat (AES-256-GCM + RSA-OAEP SHA-256, Web Crypto API) lalu
  diunduh sebagai `JDS_B8_ASSESSMENT_<ID>.md`. Tanpa server, login, database, atau analytics.
  CSP `connect-src 'none'` membuat halaman ini memang *tidak bisa* mengirim data.
- **Reviewer privat** (Node.js, hanya `127.0.0.1`): membuka banyak file sekaligus dengan kunci
  privat, menampilkan profil, strategi, perusahaan target, KPI, calon peserta, minat koordinator
  dan rencana reward; penilaian berbobot 0–5; deteksi duplikasi; ekspor CSV untuk Excel.

Dokumen lain: [DEPLOYMENT.md](DEPLOYMENT.md) · [SECURITY.md](SECURITY.md) · [REVIEWER_GUIDE.md](REVIEWER_GUIDE.md)

## Alur asesmen

| Bagian | Isi |
| --- | --- |
| A · Personal Background | Q1 nama, Q2 pendidikan & pekerjaan, Q3 kontak (terenkripsi), Q4 keahlian, Q5 ketersediaan waktu |
| B · Team Preference | Q6 Internal / External / Flexible, Q7 alasan, Q8 kontribusi nyata untuk target bersama |
| C · Strategic Case | **Internal:** Q9 strategi 300 peserta (a–f), Q10 eksekusi & koordinasi, Q11 recovery 7 hari, Q12 deliverable 30 hari. **External:** Q9 pemetaan ≥5 perusahaan (form dinamis), Q10 calon peserta (form dinamis), Q11 KPI pribadi tervalidasi, Q12 simulasi pesan outreach, Q13 eksekusi 30 hari. **Flexible** memilih salah satu studi kasus saja. |
| D · Leadership & Commitment | Q14 reward rekomendasi satu nama (opsional, tidak dinilai), Q15 minat koordinator (pertanyaan lanjutan hanya bila "Ya"), Q16 akuntabilitas, Q17 komitmen, Q18 fleksibilitas penempatan, persetujuan data |
| Review | Seluruh jawaban + tombol "Ubah", validasi semua field wajib, **Download Assessment (.md)** |

Tidak ada pertanyaan tentang pengalaman organisasi/kepanitiaan sebelumnya.

Validasi KPI External: offline + online = total; experienced + fresh graduate = total;
operator + senior service ≤ experienced; networking ≤ total (subkategori yang tumpang tindih tidak
dijumlahkan sebagai peserta unik); estimasi minggu dari prospek/minggu × konversi.

## Menjalankan

Butuh Node.js **22.18+** (skrip `.ts` dijalankan langsung oleh Node).

```bash
cd jds-batch8
npm install
npm run dev            # website asesmen → http://localhost:5190
```

| Script | Fungsi |
| --- | --- |
| `npm run keys:generate` | Membuat pasangan kunci; kunci privat (ber-passphrase) di luar repo, kunci publik ke `src/config/recipient-public-key.json` |
| `npm run build` | Build website publik ke `dist/` (path relatif, tanpa source map, dengan CSP) |
| `npm run check:build` | Gerbang rilis: tidak ada kunci privat/kode reviewer di `dist/`, CSP ada, path relatif |
| `npm run verify` | typecheck → unit & UI test → build → check:build (dijalankan CI) |
| `npm run test:e2e` | Playwright: alur Internal & Flexible→External di desktop dan mobile, unduh & dekripsi, reviewer, ekspor CSV |
| `npm run reviewer` | Build & jalankan reviewer privat di http://127.0.0.1:5199 |
| `npm run decrypt -- --key <file> <file.md…>` | Dekripsi via terminal (ringkasan; `--json` untuk isi lengkap ke layar) |

## Struktur

```
index.html                     entry website publik
reviewer.html                  entry reviewer (tidak ikut build publik)
src/assessment/                UI asesmen (React): landing, langkah A–D, review, unduhan
src/reviewer/                  UI reviewer: kunci, muat file, rekap, dashboard, perbandingan strategi, detail & skor
src/lib/crypto.ts              enkripsi hibrida + amplop (header terikat sebagai AAD)
src/lib/private-key.ts         file kunci privat (PBKDF2 + AES-GCM), hanya reviewer & skrip
src/lib/validation.ts          validasi per langkah + KPI
src/lib/scoring.ts             kriteria berbobot, rubrik 0–5, klasifikasi
src/lib/recap.ts, csv.ts       ekspor CSV (BOM, CRLF, anti formula injection)
src/lib/intake.ts              muat file + deteksi duplikasi
src/config/recipient-public-key.json   kunci publik yang di-embed saat build
reviewer/server.mjs            server lokal reviewer (127.0.0.1, sesi per-jalan)
scripts/                       keys:generate, decrypt, check-public-build
tests/unit, tests/ui, tests/e2e
```

## Logo

Logo di website adalah **placeholder** (`src/assessment/Logo.tsx`, `public/favicon.svg`), bukan logo
resmi JDS. Ganti dengan file resmi dari JDS bila tersedia.

## Mengubah teks atau target

Target dan label ada di `src/lib/content.ts`; teks pertanyaan di `src/assessment/steps-*.tsx`;
aturan validasi di `src/lib/validation.ts`; bobot dan rubrik penilaian di `src/lib/scoring.ts`.
Jalankan `npm run verify` setelah mengubah.
