import { prisma } from "./prisma";
import { jarakMeter } from "./format";

export class ApiError extends Error {
  status: number;
  extra?: Record<string, unknown>;
  constructor(status: number, message: string, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export interface Pengaturan {
  tarifPerMenit: number;
  deposit: number;
}

export async function getPengaturan(): Promise<Pengaturan> {
  const rows = await prisma.setting.findMany();
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    tarifPerMenit: parseInt(m["tarif_per_menit"] ?? "500", 10),
    deposit: parseInt(m["deposit"] ?? "20000", 10),
  };
}

export interface RingkasanStasiun {
  id: number;
  nama: string;
  lokasi: string;
  latitude: number;
  longitude: number;
  kapasitas: number;
  terisi: number;
  slotKosong: number;
  status: "KOSONG" | "PENUH" | "NORMAL";
}

/** Daftar stasiun beserta jumlah sepeda terisi dan status slot. */
export async function ringkasanStasiun(): Promise<RingkasanStasiun[]> {
  const stations = await prisma.station.findMany({
    include: { bikes: { where: { status: "TERSEDIA" } } },
    orderBy: { id: "asc" },
  });
  return stations.map((s) => {
    const terisi = s.bikes.length;
    const status: RingkasanStasiun["status"] =
      terisi === 0 ? "KOSONG" : terisi >= s.kapasitas ? "PENUH" : "NORMAL";
    return {
      id: s.id,
      nama: s.nama,
      lokasi: s.lokasi,
      latitude: s.latitude,
      longitude: s.longitude,
      kapasitas: s.kapasitas,
      terisi,
      slotKosong: Math.max(0, s.kapasitas - terisi),
      status,
    };
  });
}

/** Pinjam sepeda via token QR. Atomic: conditional updateMany single-statement. */
export async function pinjamSepeda(qrToken: string, userId: number) {
  const bike = await prisma.bike.findUnique({
    where: { qrToken },
    include: { station: true },
  });
  if (!bike) throw new ApiError(404, "QR sepeda tidak dikenal");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "Pengguna tidak ditemukan");

  if (bike.status !== "TERSEDIA" || bike.stationId == null) {
    throw new ApiError(409, `Sepeda ${bike.kode} sedang dipinjam / tidak tersedia di stasiun`);
  }

  const aktif = await prisma.rental.count({
    where: { userId, status: "AKTIF" },
  });
  if (aktif > 0) {
    throw new ApiError(409, "Anda masih memiliki pinjaman aktif. Kembalikan dulu sebelum meminjam lagi.");
  }

  const { deposit, tarifPerMenit } = await getPengaturan();

  // 1) Tahan deposit dari saldo — hanya jika saldo mencukupi (single statement).
  const hold = await prisma.user.updateMany({
    where: { id: userId, saldo: { gte: deposit } },
    data: { saldo: { decrement: deposit } },
  });
  if (hold.count === 0) {
    throw new ApiError(
      402,
      `Saldo tidak cukup untuk deposit ${deposit}. Silakan isi saldo terlebih dahulu.`
    );
  }

  // 2) Keluarkan sepeda dari slot — hanya jika masih TERSEDIA di stasiun.
  const stationAwalId = bike.stationId;
  const keluar = await prisma.bike.updateMany({
    where: { id: bike.id, status: "TERSEDIA", stationId: { not: null } },
    data: { status: "DIPINJAM", stationId: null },
  });
  if (keluar.count === 0) {
    // rollback hold
    await prisma.user.updateMany({
      where: { id: userId },
      data: { saldo: { increment: deposit } },
    });
    throw new ApiError(409, `Sepeda ${bike.kode} baru saja dipinjam orang lain`);
  }

  const rental = await prisma.rental.create({
    data: {
      userId,
      bikeId: bike.id,
      stationAwalId,
      mulaiAt: new Date().toISOString(),
      tarifPerMenit,
      depositHold: deposit,
      status: "AKTIF",
    },
    include: { bike: true, stationAwal: true },
  });

  const userBaru = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return { rental, saldoBaru: userBaru.saldo };
}

/** Kembalikan sepeda ke stasiun tujuan. Atomic: conditional updateMany single-statement. */
export async function kembalikanSepeda(rentalId: number, stationId: number) {
  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: { bike: true, user: true },
  });
  if (!rental) throw new ApiError(404, "Penyewaan tidak ditemukan");
  if (rental.status !== "AKTIF") {
    throw new ApiError(409, "Penyewaan ini sudah dikembalikan");
  }

  const tujuan = await prisma.station.findUnique({
    where: { id: stationId },
    include: { bikes: { where: { status: "TERSEDIA" } } },
  });
  if (!tujuan) throw new ApiError(404, "Stasiun tujuan tidak ditemukan");

  if (tujuan.bikes.length >= tujuan.kapasitas) {
    // Cari stasiun terdekat yang masih punya slot kosong.
    const semua = await ringkasanStasiun();
    const kandidat = semua
      .filter((s) => s.id !== tujuan.id && s.slotKosong > 0)
      .map((s) => ({
        ...s,
        jarakMeter: Math.round(
          jarakMeter(tujuan.latitude, tujuan.longitude, s.latitude, s.longitude)
        ),
      }))
      .sort((a, b) => a.jarakMeter - b.jarakMeter);
    throw new ApiError(409, `Stasiun ${tujuan.nama} penuh. Silakan kembalikan ke stasiun lain.`, {
      stasiunPenuh: tujuan.nama,
      saran: kandidat.slice(0, 3),
    });
  }

  const selesaiAt = new Date();
  const durasiMenit = Math.max(
    0,
    Math.ceil((selesaiAt.getTime() - new Date(rental.mulaiAt).getTime()) / 60000)
  );
  const biaya = durasiMenit * rental.tarifPerMenit;

  // 1) Masukkan sepeda ke slot tujuan — hanya jika masih DIPINJAM.
  const masuk = await prisma.bike.updateMany({
    where: { id: rental.bikeId, status: "DIPINJAM" },
    data: { status: "TERSEDIA", stationId },
  });
  if (masuk.count === 0) {
    throw new ApiError(409, "Sepeda tidak dalam status dipinjam (mungkin sudah dikembalikan)");
  }

  // 2) Tandai rental SELESAI — hanya jika masih AKTIF.
  const tutup = await prisma.rental.updateMany({
    where: { id: rentalId, status: "AKTIF" },
    data: {
      status: "SELESAI",
      selesaiAt: selesaiAt.toISOString(),
      durasiMenit,
      biaya,
      stationAkhirId: stationId,
    },
  });
  if (tutup.count === 0) {
    // rollback: kembalikan sepeda ke status dipinjam
    await prisma.bike.updateMany({
      where: { id: rental.bikeId, status: "TERSEDIA", stationId },
      data: { status: "DIPINJAM", stationId: null },
    });
    throw new ApiError(409, "Penyewaan ini sudah dikembalikan");
  }

  // 3) Release hold + potong biaya dalam satu statement.
  await prisma.user.updateMany({
    where: { id: rental.userId },
    data: { saldo: { increment: rental.depositHold - biaya } },
  });

  const hasil = await prisma.rental.findUniqueOrThrow({
    where: { id: rentalId },
    include: { bike: true, stationAwal: true, stationAkhir: true },
  });
  const userBaru = await prisma.user.findUniqueOrThrow({ where: { id: rental.userId } });
  return { rental: hasil, durasiMenit, biaya, saldoBaru: userBaru.saldo };
}

/** Penyewaan aktif user + estimasi biaya berjalan. */
export async function rentalAktif(userId: number) {
  const rental = await prisma.rental.findFirst({
    where: { userId, status: "AKTIF" },
    include: { bike: true, stationAwal: true },
    orderBy: { id: "desc" },
  });
  if (!rental) return null;
  const { tarifPerMenit } = await getPengaturan();
  const menit = Math.max(
    0,
    Math.ceil((Date.now() - new Date(rental.mulaiAt).getTime()) / 60000)
  );
  return { rental, menitBerjalan: menit, estimasiBiaya: menit * tarifPerMenit };
}
