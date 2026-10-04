import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STATIONS = [
  { nama: "Gerbang Utama", lokasi: "Depan gerbang utama kampus", latitude: -6.8915, longitude: 107.6101, kapasitas: 6 },
  { nama: "Perpustakaan", lokasi: "Samping gedung perpustakaan pusat", latitude: -6.8928, longitude: 107.6115, kapasitas: 5 },
  { nama: "Fakultas Teknik", lokasi: "Parkiran fakultas teknik", latitude: -6.8941, longitude: 107.6092, kapasitas: 4 },
  // Stasiun ini dibuat PENUH (kapasitas 1, terisi 1) untuk menguji 409 saat pengembalian.
  { nama: "Asrama Putra", lokasi: "Depan asrama putra", latitude: -6.8902, longitude: 107.6128, kapasitas: 1 },
];

async function main() {
  const n = await prisma.station.count();
  if (n > 0) {
    console.log("seed dilewati (sudah ada data)");
    return;
  }

  await prisma.setting.createMany({
    data: [
      { key: "tarif_per_menit", value: "500" },
      { key: "deposit", value: "20000" },
    ],
  });

  const stations = [];
  for (const s of STATIONS) stations.push(await prisma.station.create({ data: s }));

  // 10 sepeda: 6 di Gerbang Utama, 2 di Perpustakaan, 1 di Fakultas Teknik, 1 di Asrama Putra (penuh).
  const distribusi = [0, 0, 0, 0, 0, 0, 1, 1, 2, 3];
  for (let i = 0; i < 10; i++) {
    const kode = `SPD-${String(i + 1).padStart(3, "0")}`;
    await prisma.bike.create({
      data: {
        kode,
        qrToken: `QR-${kode}-2026`,
        status: "TERSEDIA",
        stationId: stations[distribusi[i]].id,
      },
    });
  }

  await prisma.user.createMany({
    data: [
      { nama: "Budi", saldo: 100000 }, // saldo cukup
      { nama: "Siti", saldo: 1000 },   // saldo kurang dari deposit -> test 402
    ],
  });

  console.log("seed selesai: 4 stasiun, 10 sepeda, 2 user");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
