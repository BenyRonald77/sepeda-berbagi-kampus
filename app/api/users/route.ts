import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, nama: true, saldo: true },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(users);
}
