# Sepeda Berbagi Kampus

Sistem penyewaan sepeda berbasis stasiun di lingkungan kampus. Pengguna memindai QR
sepeda di stasiun untuk meminjam (deposit ditahan dari saldo), membayar tarif per menit,
dan dapat mengembalikan ke stasiun mana pun yang masih punya slot kosong.

## Cara Menjalankan

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

## Halaman

- `/` — daftar stasiun: status slot (kosong/penuh/normal) & jumlah sepeda per stasiun.
- `/scan` — scan QR (input token) + pilih user → pinjam sepeda.
- `/aktif` — penyewaan aktif per user + estimasi biaya berjalan (auto-refresh 15 dtk).
- `/riwayat` — riwayat penyewaan per user.
- `/sepeda/[id]` — QR code sepeda untuk dipindai.
- `/admin` — dashboard admin: status stasiun & kebutuhan rebalancing.

## API

| Endpoint | Deskripsi |
|---|---|
| `GET /api/stations` | Stasiun + jumlah sepeda + status slot |
| `GET /api/bikes?stationId=` | Daftar sepeda |
| `GET /api/bikes/[id]/qr` | QR code sepeda (data URL PNG dari token) |
| `GET /api/users` | Daftar user + saldo |
| `POST /api/rentals` | Pinjam: `{ qrToken, userId }` → 201 / 404 / 409 / 402 |
| `GET /api/rentals?userId=` | Riwayat penyewaan |
| `GET /api/rentals/active?userId=` | Penyewaan aktif + estimasi biaya |
| `POST /api/rentals/[id]/return` | Kembali: `{ stationId }` → 200 / 409 (+saran stasiun) |
| `GET /api/admin/overview` | Status stasiun + kebutuhan rebalancing |

## Aturan Bisnis

- Pinjam: sepeda harus tersedia di stasiun, user tanpa pinjaman aktif (409),
  saldo ≥ deposit Rp20.000 (402 jika kurang). Deposit ditahan dari saldo.
- Tarif Rp500/menit, `biaya = ceil(menit) × tarif`, dihitung saat kembali.
- Kembali ke stasiun penuh → 409 + saran 3 stasiun terdekat yang punya slot.
- Saat kembali: hold di-release, biaya dipotong, `saldo += depositHold − biaya`.
