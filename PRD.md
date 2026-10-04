# PRD — Sepeda Berbagi di Kampus

Sistem penyewaan sepeda berbasis stasiun (station-based bike sharing) untuk lingkungan kampus.
Pengguna meminjam sepeda dengan memindai QR di stasiun, membayar tarif per menit, dan dapat
mengembalikan sepeda ke stasiun mana pun yang masih punya slot kosong.

## Stack

Next.js 14 + TypeScript + Prisma 5.22 + SQLite + Tailwind CSS.

## Entitas

- **Station**: nama, lokasi (teks), koordinat (latitude/longitude), kapasitas slot.
  Slot stasiun terisi oleh sepeda tertentu atau kosong (dihitung dari relasi Bike → Station).
- **Bike**: kode sepeda, token QR unik (string), status (`TERSEDIA` / `DIPINJAM`), stasiun saat ini.
- **User**: nama, saldo (integer rupiah). Deposit ditahan (hold) dari saldo selama peminjaman.
- **Rental**: user, sepeda, stasiun awal, stasiun akhir (nullable), waktu mulai/selesai (ISO),
  durasi menit, tarif per menit saat itu, deposit hold, biaya akhir, status (`AKTIF` / `SELESAI`).
- **Setting**: key-value untuk `tarif_per_menit` dan `deposit`.

## Aturan Bisnis

1. **Pinjam** (`POST /api/rentals`, body `{ qrToken, userId }`):
   - QR tak dikenal → 404.
   - Sepeda tidak tersedia di stasiun (sudah dipinjam) → 409.
   - User masih punya pinjaman aktif → 409.
   - Saldo < deposit → 402 (Payment Required).
   - Sukses → 201: deposit DITAHAN (saldo berkurang sebesar deposit), sepeda keluar dari slot
     (status `DIPINJAM`, `stationId` = null), rental `AKTIF` dibuat.
   - Atomicity: conditional `updateMany` single-statement + cek row terpengaruh
     (saldo hanya berkurang jika `saldo >= deposit`; sepeda hanya berubah jika masih `TERSEDIA`).
2. **Tarif berjalan per menit**: `biaya = ceil(menit_berjalan) × tarif_per_menit`,
   dihitung saat pengembalian; estimasi berjalan ditampilkan di halaman penyewaan aktif.
3. **Kembali** (`POST /api/rentals/[id]/return`, body `{ stationId }`):
   - Rental tidak aktif/sudah dikembalikan → 409.
   - Stasiun tujuan penuh (jumlah sepeda ≥ kapasitas) → 409 + saran stasiun terdekat
     yang punya slot kosong (jarak haversine dari koordinat).
   - Sukses → 200: deposit hold di-release dan biaya dipotong —
     `saldo += depositHold - biaya` (satu statement); sepeda kembali ke slot
     (status `TERSEDIA`, `stationId` = tujuan); rental `SELESAI` dengan durasi & biaya tercatat.
4. **Admin dashboard**: daftar stasiun dengan status `KOSONG` (0 sepeda) / `PENUH`
   (sepeda ≥ kapasitas) / `NORMAL`, jumlah sepeda per stasiun, daftar kebutuhan rebalancing
   (stasiun kosong & stasiun penuh ditandai jelas).
5. QR: tiap sepeda punya token unik; halaman/endpoint menampilkan QR (data URL PNG)
   yang meng-encode token tersebut untuk dipindai.

## Halaman

- `/` — daftar/peta stasiun: status ketersediaan slot & sepeda per stasiun.
- `/scan` — scan QR (input token) + pilih user → pinjam.
- `/aktif` — penyewaan aktif per user + estimasi biaya berjalan (auto-refresh).
- `/riwayat` — riwayat penyewaan per user.
- `/sepeda/[id]` — menampilkan QR code sepeda untuk dipindai.
- `/admin` — dashboard admin: status stasiun, jumlah sepeda, kebutuhan rebalancing.

## API

- `GET /api/stations` — stasiun + jumlah sepeda + status slot.
- `GET /api/bikes` — daftar sepeda (+ filter `stationId`).
- `GET /api/bikes/[id]/qr` — `{ qrDataUrl }` PNG data URL dari token QR.
- `GET /api/users` — daftar user + saldo.
- `POST /api/rentals` — pinjam (201 / 404 / 409 / 402).
- `GET /api/rentals?userId=` — riwayat + aktif per user.
- `GET /api/rentals/active?userId=` — rental aktif + estimasi biaya berjalan.
- `POST /api/rentals/[id]/return` — kembali (200 / 409 + saran stasiun).
- `GET /api/admin/overview` — status stasiun + rebalancing.

## Seed

4 stasiun (satu dibuat PENUH untuk test 409), 10 sepeda, 2 user:
`Budi` saldo Rp100.000 (cukup), `Siti` saldo Rp1.000 (kurang dari deposit Rp20.000 → test 402).
Tarif Rp500/menit.
