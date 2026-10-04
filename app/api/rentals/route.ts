import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, pinjamSepeda } from "@/lib/bikeshare";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const rentals = await prisma.rental.findMany({
    where: userId ? { userId: parseInt(userId, 10) } : undefined,
    include: {
      bike: { select: { id: true, kode: true } },
      stationAwal: { select: { id: true, nama: true } },
      stationAkhir: { select: { id: true, nama: true } },
    },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(rentals);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const qrToken = body?.qrToken?.toString().trim();
  const userId = parseInt(body?.userId, 10);
  if (!qrToken || !Number.isFinite(userId)) {
    return NextResponse.json(
      { error: "qrToken dan userId wajib diisi" },
      { status: 400 }
    );
  }
  try {
    const hasil = await pinjamSepeda(qrToken, userId);
    return NextResponse.json(hasil, { status: 201 });
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
