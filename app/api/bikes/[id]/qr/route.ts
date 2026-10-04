import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const bike = await prisma.bike.findUnique({ where: { id: parseInt(params.id, 10) } });
  if (!bike) return NextResponse.json({ error: "Sepeda tidak ditemukan" }, { status: 404 });
  const qrDataUrl = await QRCode.toDataURL(bike.qrToken, { width: 256, margin: 2 });
  return NextResponse.json({ id: bike.id, kode: bike.kode, qrToken: bike.qrToken, qrDataUrl });
}
