import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export default async function SepedaQrPage({
  params,
}: {
  params: { id: string };
}) {
  const bike = await prisma.bike.findUnique({
    where: { id: parseInt(params.id, 10) },
    include: { station: true },
  });
  if (!bike) notFound();
  const qrDataUrl = await QRCode.toDataURL(bike.qrToken, {
    width: 320,
    margin: 2,
  });

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-2xl font-bold">QR Sepeda {bike.kode}</h1>
      <p className="text-slate-600">
        {bike.status === "TERSEDIA"
          ? `Tersedia di stasiun ${bike.station?.nama ?? "—"}`
          : "Sedang dipinjam"}
      </p>
      <div className="inline-block rounded-lg border bg-white p-4 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt={`QR ${bike.kode}`} width={320} height={320} />
      </div>
      <p className="font-mono text-sm text-slate-500">{bike.qrToken}</p>
      <p className="text-sm text-slate-500">
        Pindai dengan halaman <a href="/scan" className="text-emerald-700 underline">Scan QR</a>{" "}
        untuk meminjam.
      </p>
    </div>
  );
}
