# Privasi & keamanan

## Ringkasan

Jawaban kandidat **tidak dienkripsi**: file `.md` berisi identitas, kontak, dan seluruh jawaban dalam
teks biasa yang bisa dibaca siapa pun yang memegang file. Ini disengaja agar file mudah dibuka dan
diperiksa. Konsekuensinya, kerahasiaan bergantung pada cara file dikirim dan disimpan.

| Data | Perlindungan |
| --- | --- |
| Identitas & jawaban kandidat | Hanya ada di memori tab sampai kandidat mengunduh file; tidak pernah dikirim oleh website |
| File `.md` | Dikirim kandidat secara manual lewat kanal resmi panitia; simpan di perangkat panitia saja |
| Data pihak ketiga (calon peserta, kandidat rekomendasi) | Tidak meminta kontak; input yang berisi email/nomor telepon ditolak; tidak masuk rekap umum; disembunyikan di detail reviewer sampai dibuka |
| Skor & catatan reviewer | Disimpan lokal di luar repository (`~/JDS-B8-Reviewer/reviews.json`, mode 600) |

## Website publik

- Tidak ada backend, login, database, cookie, analytics, font/CDN pihak ketiga.
- CSP (meta, sebelum script): `default-src 'self'; script-src 'self'; style-src 'self';
  connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'` — `fetch`, XHR,
  WebSocket dan pengiriman form diblokir browser. Tes E2E gagal bila ada pelanggaran CSP
  atau request apa pun selain GET aset situs.
- Jawaban hanya di memori React; tidak ada `localStorage`, `sessionStorage`, IndexedDB, atau URL
  yang berisi jawaban. Peringatan muncul sebelum tab ditutup.
- `scripts/check-public-build.ts` menggagalkan build bila `dist/` berisi kode reviewer, source map,
  path absolut, atau font yang di-inline.
- Pemeriksaan privasi portfolio (`scripts/check.mjs` di root repo) ikut memindai folder ini dan
  situs gabungan.

## Reviewer lokal

- File jawaban dibaca di tab browser; isinya tidak dikirim ke server reviewer.
- Server `reviewer/server.mjs` hanya listen di `127.0.0.1`, menolak header Host lain
  (perlindungan DNS rebinding), mewajibkan nilai sesi acak per-jalan pada setiap panggilan API
  (situs lain di browser yang sama tidak dapat membaca/mengubah review), membatasi ukuran body,
  memvalidasi skor 0–5 dan status, serta mengirim header `X-Frame-Options: DENY`,
  `nosniff`, `no-referrer`, `no-store`.
- Folder data review di dalam repository ditolak.
- Ekspor CSV menetralkan sel yang diawali `= + - @` (CSV/formula injection).

## Yang menjadi tanggung jawab panitia

- Gunakan kanal pengiriman yang hanya dapat diakses panitia penilai (bukan grup umum).
- Simpan file `.md` dan CSV ekspor di perangkat/folder pribadi; jangan di-commit ke repository
  (`.gitignore` sudah mengabaikan `JDS_B8_ASSESSMENT_*.md` dan `*.csv`).
- Hapus file setelah seleksi selesai sesuai kebijakan JDS.
- Isi file bisa diubah oleh siapa pun yang memegangnya; konfirmasi Submission ID dengan kandidat
  bila ada keraguan.
