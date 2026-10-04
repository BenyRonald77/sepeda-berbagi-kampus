import { NextRequest, NextResponse } from "next/server";
import { ApiError, kembalikanSepeda } from "@/lib/bikeshare";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  const stationId = parseInt(body?.stationId, 10);
  if (!Number.isFinite(stationId)) {
    return NextResponse.json({ error: "stationId wajib diisi" }, { status: 400 });
  }
  try {
    const hasil = await kembalikanSepeda(parseInt(params.id, 10), stationId);
    return NextResponse.json(hasil);
  } catch (e) {
    if (e instanceof ApiError) {
      const payload: Record<string, unknown> = { error: e.message };
      if (e.extra) payload.detail = e.extra;
      return NextResponse.json(payload, { status: e.status });
    }
    throw e;
  }
}
