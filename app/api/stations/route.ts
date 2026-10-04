import { NextResponse } from "next/server";
import { ringkasanStasiun } from "@/lib/bikeshare";

export async function GET() {
  const stations = await ringkasanStasiun();
  return NextResponse.json(stations);
}
