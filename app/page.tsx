import { prisma } from "@/lib/prisma";
import { ringkasanStasiun } from "@/lib/bikeshare";

const badge: Record<string, string> = {
  KOSONG: "bg-red-100 text-red-800",
  PENUH: "bg-amber-100 text-amber-800",
  NORMAL: "bg-emerald-100 text-emerald-800",
};

export default async function Home() {
  const stasiun = await ringkasanStasiun();
  const bikes = await prisma.bike.findMany({
    where: { status: "TERSEDIA" },
    include: { station: { select: { id: true } } },
    orderBy: { id: "asc" },
  });
  const perStasiun = new Map<number, typeof bikes>();
  for (const b of bikes) {
    if (b.stationId == null) continue;
    const arr = perStasiun.get(b.stationId) ?? [];
    arr.push(b);
    perStasiun.set(b.stationId, arr);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stasiun Sepeda Kampus</h1>
        <p className="text-slate-600">
          Pinjam dengan memindai QR sepeda, kembalikan ke stasiun mana pun yang
          masih punya slot kosong.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {stasiun.map((s) => (
          <div key={s.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{s.nama}</h2>
                <p className="text-sm text-slate-500">{s.lokasi}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${badge[s.status]}`}
              >
                {s.status}
              </span>
            </div>
            <div className="mt-3 flex gap-4 text-sm">
              <span>
                🚲 <strong>{s.terisi}</strong> sepeda
              </span>
              <span>
                🅿️ <strong>{s.slotKosong}</strong> slot kosong
              </span>
              <span className="text-slate-400">kapasitas {s.kapasitas}</span>
            </div>
            {(perStasiun.get(s.id) ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(perStasiun.get(s.id) ?? []).map((b) => (
                  <a
                    key={b.id}
                    href={`/sepeda/${b.id}`}
                    className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                    title="Lihat QR"
                  >
                    {b.kode} ⬈
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
