# NEXUS — Pembagian Kerja Saat Build Window

## Prinsip

Kedua anggota bekerja pada satu aplikasi Next.js di folder `web/`. Hindari
mengubah file yang sedang dikerjakan pasangan tanpa berkoordinasi. Gunakan
branch atau commit kecil dan deskriptif agar integrasi cepat.

## Person 1 — Backend / Product / Tech Lead

Fokus pada lapisan data dan logika deterministik yang akan dibuat **saat
build window**:

- Membuat koneksi dan skema Supabase.
- Menyediakan telemetry sintetis dan skenario demo.
- Mengimplementasikan perhitungan PUE, WUE, deviasi baseline, serta estimasi.
- Mengimplementasikan deteksi anomali dan safety gate deterministik.
- Menambahkan route server untuk penjelasan AI; API key hanya di environment
  server.
- Menulis tes untuk perhitungan dan safety rule.

Kontrak yang perlu disepakati sebelum integrasi:

- Bentuk data telemetry, alert, dan hasil simulasi.
- Nama endpoint/server action dan state loading/error.
- Satuan untuk setiap metrik dan format timestamp.

## Person 2 — Frontend / UX Lead

Fokus pada pengalaman operator yang akan dibuat **saat build window**:

- Membuat layout dashboard dan status states.
- Membuat kartu metrik, grafik Recharts, alert list, dan tampilan AI insight.
- Membuat kontrol simulator dan hasil safety state.
- Menjaga responsivitas, aksesibilitas, dan alur demo.
- Mengonsumsi type/contract dari Person 1; jangan menduplikasi formula bisnis
  di komponen UI.

## Urutan Integrasi yang Disarankan

1. Sepakati kontrak TypeScript dan satuan data.
2. Backend menyediakan satu skenario sintetis yang stabil.
3. Frontend menghubungkan dashboard ke kontrak tersebut.
4. Tambahkan simulator dan safety state.
5. Tambahkan AI explanation setelah temuan terstruktur sudah stabil.
6. Jalankan demo path end-to-end dan freeze fitur.

## Batas Pre-existing Code

Dokumen ini adalah rencana kerja. Implementasi domain NEXUS—dashboard,
database, telemetry, anomaly detection, simulator, dan AI integration—tetap
harus dibuat dalam official build window dan dicatat secara jujur di README.
