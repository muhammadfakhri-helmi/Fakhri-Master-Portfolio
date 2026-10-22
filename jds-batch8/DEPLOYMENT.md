# Deployment — GitHub Pages

Website asesmen dipublikasikan bersama portfolio di repository ini:

- **URL:** `https://muhammadfakhri-helmi.github.io/Fakhri-Master-Portfolio/jds-batch8/`
- **Workflow:** `.github/workflows/deploy-pages.yml` (jalan setiap push ke `main`)

Workflow membangun portfolio, lalu di folder `jds-batch8/` menjalankan `npm ci` dan
`npm run verify` (typecheck, unit & UI test, build, gerbang `check:build`), menyalin
`jds-batch8/dist/` ke `dist/jds-batch8/`, dan menjalankan pemeriksaan privasi portfolio sekali
lagi pada situs gabungan. Kegagalan di langkah mana pun menghentikan deployment.

Tidak ada konfigurasi tambahan: setelah deploy, kandidat langsung dapat mengerjakan asesmen.

Build memakai `base: "./"` (path relatif), sehingga berfungsi di sub-path mana pun. Hal ini
diuji di `npm run test:e2e`, yang menyajikan build di `/Fakhri-Master-Portfolio/jds-batch8/`.

## Sebelum membagikan link

```bash
cd jds-batch8
npm run verify        # typecheck, unit/UI test, build, gerbang build publik
npm run test:e2e      # browser nyata (desktop & mobile) + reviewer — butuh Chromium Playwright
```

Lalu kerjakan satu asesmen percobaan di URL live, unduh file `.md`, dan buka dengan reviewer
(`npm run reviewer`) untuk memastikan alurnya berjalan.

Bagikan URL kepada calon panitia, beserta kanal resmi untuk mengirim file `.md`.

## Host lain

Unggah isi `jds-batch8/dist/` sebagai file statis.
