import { NextRequest, NextResponse } from "next/server";
import { rentalAktif } from "@/lib/bikeshare";

export async function GET(req: NextRequest) {
  const userId = parseInt(req.nextUrl.searchParams.get("userId") ?? "", 10);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "userId wajib diisi" }, { status: 400 });
  }
  const hasil = await rentalAktif(userId);
  return NextResponse.json(hasil);
}
