import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const stationId = req.nextUrl.searchParams.get("stationId");
  const bikes = await prisma.bike.findMany({
    where: stationId ? { stationId: parseInt(stationId, 10) } : undefined,
    include: { station: { select: { id: true, nama: true } } },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(bikes);
}
