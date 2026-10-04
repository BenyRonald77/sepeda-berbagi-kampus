import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPengaturan, ringkasanStasiun } from "@/lib/bikeshare";

export async function GET() {
  const stasiun = await ringkasanStasiun();
  const pengaturan = await getPengaturan();
  const [totalSepeda, sepedaDipinjam, rentalAktif, totalUser] = await Promise.all([
    prisma.bike.count(),
    prisma.bike.count({ where: { status: "DIPINJAM" } }),
    prisma.rental.count({ where: { status: "AKTIF" } }),
    prisma.user.count(),
  ]);
  return NextResponse.json({
    stasiun,
    pengaturan,
    ringkasan: { totalSepeda, sepedaDipinjam, rentalAktif, totalUser },
    rebalancing: {
      // Stasiun kosong butuh diisi sepeda; stasiun penuh butuh dikosongkan.
      butuhDiisi: stasiun.filter((s) => s.status === "KOSONG"),
      butuhDikosongkan: stasiun.filter((s) => s.status === "PENUH"),
    },
  });
}
