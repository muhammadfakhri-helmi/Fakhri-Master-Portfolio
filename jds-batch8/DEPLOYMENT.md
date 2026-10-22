# Deployment — GitHub Pages

Website asesmen dipublikasikan bersama portfolio di repository ini:

- **URL:** `https://muhammadfakhri-helmi.github.io/Fakhri-Master-Portfolio/jds-batch8/`
- **Workflow:** `.github/workflows/deploy-pages.yml` (jalan setiap push ke `main`)

Workflow membangun portfolio, lalu di folder `jds-batch8/` menjalankan `npm ci` dan
`npm run verify` (typecheck, unit & UI test, build, gerbang `check:build`), menyalin
`jds-batch8/dist/` ke `dist/jds-batch8/`, dan menjalankan pemeriksaan privasi portfolio sekali
lagi pada situs gabungan. Kegagalan di langkah mana pun menghentikan deployment.

Build memakai `base: "./"` (path relatif), sehingga berfungsi di sub-path mana pun. Hal ini
diuji di `npm run test:e2e`, yang menyajikan build di `/Fakhri-Master-Portfolio/jds-batch8/`.

## Langkah pertama kali (wajib sebelum asesmen dibuka)

Website **tidak menerima jawaban** sampai kunci publik Ketua Rekrutmen dipasang: tombol
"Mulai asesmen" nonaktif dan CI menampilkan peringatan.

1. Di **komputer pribadi** Ketua Rekrutmen (bukan komputer bersama):

   ```bash
   cd jds-batch8
   npm install
   npm run keys:generate
   ```

   - Masukkan passphrase yang kuat (min. 12 karakter, disarankan kalimat 4–5 kata).
   - Kunci privat ditulis ke `~/JDS-B8-Private-Keys/jds-b8-private-key-<KEYID>.json`
     (dilindungi passphrase). Skrip **menolak** menulis kunci privat di dalam repository.
   - Kunci publik ditulis ke `src/config/recipient-public-key.json`.

2. **Cadangkan kunci privat** (mis. USB terenkripsi + pengelola password untuk passphrase).
   Kehilangan kunci atau passphrase = seluruh file asesmen tidak dapat dibuka.

3. Commit dan push **hanya** kunci publik:

   ```bash
   git add jds-batch8/src/config/recipient-public-key.json
   git commit -m "Set JDS B8 recruitment public key"
   git push
   ```

4. Setelah workflow selesai, buka URL di atas dan pastikan **ID kunci** di bagian
   "Privasi & keamanan jawaban" sama dengan Key ID yang dicetak oleh `keys:generate`.

5. Bagikan URL kepada calon panitia, beserta kanal resmi untuk mengirim file `.md`.

## Uji sebelum dibuka

```bash
cd jds-batch8
npm run verify        # typecheck, 49 unit/UI test, build, gerbang build publik
npm run test:e2e      # browser nyata (desktop & mobile) + reviewer — butuh Chromium Playwright
```

Lalu lakukan satu asesmen percobaan di URL live, unduh file, dan buka dengan reviewer
(`npm run reviewer`) untuk memastikan kunci di website cocok dengan kunci privatmu.

## Mengganti kunci

`npm run keys:generate -- --force` membuat pasangan baru. File yang sudah masuk tetap bisa dibuka
dengan kunci lama, jadi **simpan kunci lama**. Kandidat yang sedang mengisi saat deployment baru
tidak terpengaruh (kunci dimuat saat halaman dibuka).

## Host lain

Unggah isi `jds-batch8/dist/` sebagai file statis di HTTPS. Web Crypto API membutuhkan konteks
aman (HTTPS atau localhost).
