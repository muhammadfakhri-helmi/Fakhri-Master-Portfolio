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

1. **Muat kunci privat:** pilih `jds-b8-private-key-<KEYID>.json`, ketik passphrase, klik *Buka*.
   Passphrase salah atau file rusak ditolak.
2. **Muat file asesmen:** pilih atau seret banyak `JDS_B8_ASSESSMENT_*.md` sekaligus. Log
   menunjukkan setiap file:
   - hijau: berhasil (nama — Submission ID);
   - abu-abu: file yang sama sudah dimuat (diabaikan);
   - kuning: **ID konflik** — ID sama, isi berbeda (tidak dimuat; periksa manual);
   - merah: dienkripsi untuk kunci lain, rusak/diubah, atau bukan file asesmen.
3. Label **Kemungkinan ganda** muncul bila dua Submission ID memiliki email, WhatsApp, atau nama yang
   sama — biasanya kandidat mengirim ulang. Nilai versi yang disepakati dan beri status
   "Tidak dilanjutkan" + catatan pada versi lain.

Jawaban yang didekripsi hanya ada di memori tab. Setelah reload, muat ulang kunci dan file —
skor & catatan kembali otomatis dari penyimpanan lokal.

## 3. Tampilan

- **Rekap kandidat:** filter pilihan tim, urut skor/nama/status, indikator konsistensi KPI.
- **Dashboard target:** jumlah proyeksi KPI seluruh kandidat External (atau hanya yang berstatus
  "Terpilih — External") dibandingkan target 300 / 200 offline / 100 online / 280 experienced /
  20 fresh graduate / ≥10 operator / ≥10 senior service / ≥20 networking. Subkategori boleh
  tumpang tindih; hanya "Total" yang mewakili peserta unik.
- **Bandingkan strategi Internal:** kartu berdampingan berisi strategi utama, tiga langkah pertama,
  prioritas, pemulihan 7 hari, dan deliverable 30 hari setiap kandidat Internal.
- **Detail:** seluruh jawaban, indikator otomatis KPI (bukan nilai), dan panel penilaian.
  Nama calon peserta & kandidat rekomendasi tersembunyi sampai *Tampilkan data terbatas* diklik.

## 4. Penilaian

Setiap kriteria diberi skor 0–5. Skor akhir = Σ (skor / 5 × bobot), skala 0–100.

| Internal | Bobot | External | Bobot |
| --- | ---: | --- | ---: |
| Recruitment Strategy & Target Achievement (Q9) | 35% | Target Company & Candidate Mapping (Q9–Q10) | 30% |
| Execution Planning (Q10, Q12) | 25% | Recruitment KPI Feasibility (Q11) | 25% |
| Problem Solving (Q11) | 20% | Outreach & Conversion Strategy (Q12–Q13) | 20% |
| Collaboration & Accountability (Q8, Q10b, Q16) | 10% | Collaboration & Accountability (Q8, Q13, Q16) | 15% |
| Realistic Commitment (Q5, Q12, Q17) | 10% | Commitment (Q5, Q11e, Q17) | 10% |

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
- **Mapping (External):** nilai relevansi perusahaan dan rencana pendekatan, **bukan** seberapa
  tinggi jabatan orang yang dikenal kandidat. Q9 adalah rencana sourcing, bukan bukti koneksi.
- **KPI feasibility:** bandingkan target dengan ketersediaan waktu (Q5), prospek/minggu,
  konversi, dan estimasi minggu yang ditampilkan; nilai rencana jika hanya 50%.
- **Outreach:** pesan tidak boleh menjanjikan pekerjaan, sertifikat, sponsor, atau manfaat yang
  belum resmi.

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
| Perusahaan target External | Satu baris per perusahaan per kandidat |
| Proyeksi KPI External | Target, komposisi, prospek/minggu, konversi, estimasi minggu, konsistensi |
| Ringkasan strategi Internal | Strategi a–f, prioritas, dukungan External, recovery, deliverable |

Nama calon peserta dan kandidat rekomendasi **tidak** pernah ada di ekspor. File CSV berisi data
pribadi kandidat: simpan di perangkat pribadi dan hapus setelah seleksi.

## 6. Terminal (opsional)

```bash
npm run decrypt -- --key ~/JDS-B8-Private-Keys/jds-b8-private-key-XXXX.json JDS_B8_ASSESSMENT_*.md
```

Menampilkan ringkasan per file; tambahkan `--json` untuk isi lengkap ke layar. Tidak ada yang
ditulis ke disk.
