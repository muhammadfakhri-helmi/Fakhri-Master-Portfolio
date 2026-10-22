# Reviewer Guide — Ketua Rekrutmen JDS Batch 8

## 1. Menjalankan reviewer

```bash
cd jds-batch8
npm install          # sekali saja
npm run reviewer     # build + server lokal
```

Buka **http://127.0.0.1:5199/** di browser yang sama dengan terminal. Skor, catatan, dan status
disimpan otomatis di `~/JDS-B8-Reviewer/reviews.json` (ubah dengan `JDS_REVIEWER_DATA=<folder>`;
port dengan `JDS_REVIEWER_PORT`). Hentikan dengan Ctrl+C.

## 2. Membuka file

File jawaban `.md` juga bisa langsung dibaca dengan aplikasi teks apa pun (VS Code, Notepad,
Obsidian, GitHub). Reviewer dipakai untuk menilai banyak kandidat sekaligus.

1. **Muat file jawaban:** pilih atau seret banyak `JDS_B8_ASSESSMENT_*.md` sekaligus. Log
   menunjukkan setiap file:
   - hijau: berhasil (nama — Submission ID);
   - abu-abu: file yang sama sudah dimuat (diabaikan);
   - kuning: **ID konflik** — ID sama, isi berbeda (tidak dimuat; periksa manual);
   - merah: bukan file jawaban asesmen, atau blok data di akhir file rusak/diubah.
2. Label **Kemungkinan ganda** muncul bila dua Submission ID memiliki email, WhatsApp, atau nama yang
   sama — biasanya kandidat mengirim ulang. Nilai versi yang disepakati dan beri status
   "Tidak dilanjutkan" + catatan pada versi lain.

Isi file hanya dibaca di tab ini. Setelah reload, muat ulang file — skor & catatan kembali otomatis
dari penyimpanan lokal.

## 3. Tampilan

- **Rekap kandidat:** filter pilihan tim, urut skor/nama/status, indikator konsistensi KPI.
- **Dashboard target:** jumlah target peserta seluruh kandidat External (atau hanya yang berstatus
  "Terpilih — External") dibandingkan target 300 / 200 offline / 100 online.
- **Bandingkan strategi Internal:** kartu berdampingan berisi jawaban Q9–Q13 setiap kandidat
  Internal.
- **Detail:** seluruh jawaban, indikator otomatis KPI (bukan nilai), dan panel penilaian.
  Data kandidat rekomendasi tersembunyi sampai *Tampilkan data terbatas* diklik.

## 4. Penilaian

Setiap kriteria diberi skor 0–5. Skor akhir = Σ (skor / 5 × bobot), skala 0–100.

| Internal | Bobot | External | Bobot |
| --- | ---: | --- | ---: |
| Recruitment Strategy & Target Achievement (Q9, Q13) | 35% | Target Company & Candidate Mapping (Q9) | 30% |
| Execution Planning (Q10, Q11) | 25% | Recruitment KPI Feasibility (Q10) | 25% |
| Problem Solving (Q12) | 20% | Outreach & Conversion Strategy (Q11–Q12) | 20% |
| Collaboration & Accountability (Q8, Q11, Q16) | 10% | Collaboration & Accountability (Q8, Q13, Q16) | 15% |
| Realistic Commitment (Q5, Q17) | 10% | Commitment (Q5, Q17) | 10% |

Kandidat **Flexible** dinilai dengan kriteria studi kasus yang mereka kerjakan.

### Rubrik 0–5 (berlaku untuk setiap kriteria)

| Skor | Arti |
| ---: | --- |
| 0 | Tidak menjawab, tidak relevan, atau menyalin pertanyaan |
| 1 | Pernyataan umum/kesediaan saja, tanpa langkah, angka, atau sasaran |
| 2 | Ada ide, tetapi tidak spesifik, tidak berurutan, atau tidak realistis |
| 3 | Langkah konkret untuk sebagian besar sub-pertanyaan; prioritas/ukuran keberhasilan belum lengkap |
| 4 | Konkret, prioritas jelas, ada angka/ukuran keberhasilan, terhubung ke target peserta |
| 5 | Lengkap, terukur, realistis terhadap waktu tersedia, mengantisipasi risiko, memperkuat kerja Internal–External |

Petunjuk khusus:
- **Mapping (External):** nilai relevansi perusahaan dan profesional sasaran, **bukan** seberapa
  tinggi jabatan orang yang dikenal kandidat. Q9 adalah rencana sasaran, bukan bukti koneksi.
- **KPI feasibility:** bandingkan target (Q10) dan alasannya dengan ketersediaan waktu (Q5).
- Pertanyaan dibuat singkat; nilai kejelasan dan kenyataan langkahnya, bukan panjang jawaban.

### Klasifikasi

| Skor | Klasifikasi |
| --- | --- |
| 85–100 | Strong Candidate |
| 75–84 | Recommended |
| 65–74 | Consider / Interview |
| < 65 | Further Evaluation |

Klasifikasi adalah rekomendasi. Sistem tidak menerima/menolak kandidat secara otomatis dan tidak
memakai kata kunci. **Minat menjadi koordinator** dan **rencana reward rekomendasi satu nama**
hanya informasi tambahan dan tidak termasuk dalam skor. Selection status (Interview, Terpilih —
Internal/External, Cadangan, Tidak dilanjutkan) ditentukan manual.

## 5. Ekspor CSV (Excel)

Pilih pemisah: koma, atau titik koma untuk Excel dengan regional Indonesia.

| Tombol | Isi |
| --- | --- |
| Rekap kandidat | Name, Team Preference, Weekly Availability, Leadership Interest, Target Participants, Offline/Online Target, Target Companies, KPI Plan, Internal Strategy Summary, Reward Nomination Plan, Reviewer Score, Reviewer Notes, Selection Status (+ Classification, Assessment Track, Submission ID) |
| Perusahaan target External | Satu baris per perusahaan per kandidat, dengan profesional sasaran |
| Proyeksi KPI External | Target total/offline/online, konsistensi, alasan, cara menghubungi, konversi, pelaporan |
| Ringkasan strategi Internal | Jawaban Q9–Q13 kandidat Internal |

Data kandidat rekomendasi **tidak** pernah ada di ekspor. File CSV berisi data
pribadi kandidat: simpan di perangkat pribadi dan hapus setelah seleksi.
