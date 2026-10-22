# Security

## Model ancaman singkat

| Aset | Perlindungan |
| --- | --- |
| Identitas & jawaban kandidat | Dienkripsi di browser kandidat sebelum meninggalkan memori; file `.md` tidak memuat plaintext |
| Kunci privat Ketua Rekrutmen | Tidak pernah di repository/website; dilindungi passphrase; di reviewer hanya sebagai `CryptoKey` non-extractable di memori tab |
| Data pihak ketiga (calon peserta, kandidat rekomendasi) | Tidak meminta kontak; input yang berisi email/nomor telepon ditolak; tidak masuk rekap umum; disembunyikan di detail reviewer sampai dibuka |
| Skor & catatan reviewer | Disimpan lokal di luar repository (`~/JDS-B8-Reviewer/reviews.json`, mode 600) |

## Kriptografi

- **Konten:** AES-256-GCM, kunci acak baru dan IV 96-bit acak untuk setiap file, tag 128-bit.
- **Kunci konten:** dienkripsi RSA-OAEP dengan SHA-256 (RSA 4096-bit secara default).
- **Integritas header:** `format`, `submissionId`, `createdAt`, `keyId`, `alg`, `enc` dipakai
  sebagai *additional authenticated data*. Mengubah ID atau tanggal di file membuat dekripsi gagal.
  Reviewer juga memeriksa bahwa Submission ID di dalam enkripsi sama dengan yang di luar.
- **Key ID:** 64 bit pertama SHA-256 dari SPKI kunci publik. Reviewer menolak file untuk kunci lain
  sebelum mencoba dekripsi; RSA-OAEP tetap gagal bila pemeriksaan ini dilewati.
- **File kunci privat:** PKCS#8 dienkripsi AES-256-GCM dengan kunci turunan PBKDF2-SHA-256
  600.000 iterasi dari passphrase (salt 128-bit), Key ID terikat sebagai AAD.
  Opsi `--plain` menghasilkan PEM tanpa proteksi (tidak disarankan).
- Semua operasi memakai Web Crypto API (browser dan Node.js). Base64 hanya dipakai sebagai
  encoding di atas ciphertext, bukan pengganti enkripsi.

## Website publik

- Tidak ada backend, login, database, cookie, analytics, font/CDN pihak ketiga.
- CSP (meta, sebelum script): `default-src 'self'; script-src 'self'; style-src 'self';
  connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'` — `fetch`, XHR,
  WebSocket dan pengiriman form diblokir browser. Tes E2E gagal bila ada pelanggaran CSP
  atau request apa pun selain GET aset situs.
- Jawaban hanya di memori React; tidak ada `localStorage`, `sessionStorage`, IndexedDB, atau URL
  yang berisi jawaban. Peringatan muncul sebelum tab ditutup.
- `scripts/check-public-build.ts` menggagalkan build bila `dist/` berisi armour kunci privat,
  file kunci terproteksi, eksponen privat JWK, kode reviewer, source map, atau path absolut.
  Build juga gagal bila file kunci publik yang di-embed tampak berisi materi privat.
- Pemeriksaan privasi portfolio (`scripts/check.mjs` di root repo) ikut memindai folder ini dan
  situs gabungan.

## Reviewer lokal

- Server `reviewer/server.mjs` hanya listen di `127.0.0.1`, menolak header Host lain
  (perlindungan DNS rebinding), mewajibkan nilai sesi acak per-jalan pada setiap panggilan API
  (situs lain di browser yang sama tidak dapat membaca/mengubah review), membatasi ukuran body,
  memvalidasi skor 0–5 dan status, serta mengirim header `X-Frame-Options: DENY`,
  `nosniff`, `no-referrer`, `no-store`.
- Server tidak pernah menerima kunci privat atau jawaban yang didekripsi.
- Folder data review di dalam repository ditolak.
- Ekspor CSV menetralkan sel yang diawali `= + - @` (CSV/formula injection).

## Yang tetap menjadi tanggung jawab pengguna

- Simpan kunci privat & passphrase dengan aman, dan cadangkan.
- Jalankan reviewer di perangkat pribadi yang terkunci; tutup tab setelah selesai.
- Hapus file `.md` dan CSV ekspor setelah seleksi selesai sesuai kebijakan JDS.
- Website tidak dapat memverifikasi identitas pengirim file; konfirmasi Submission ID melalui
  kanal resmi bila perlu.

## Melaporkan masalah

Hubungi Ketua Rekrutmen JDS Batch 8 secara langsung. Jangan membuka issue publik yang memuat
data kandidat.
