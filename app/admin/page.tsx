import { prisma } from "@/lib/prisma";
import { getPengaturan, ringkasanStasiun } from "@/lib/bikeshare";
import { rupiah } from "@/lib/format";

const badge: Record<string, string> = {
  KOSONG: "bg-red-100 text-red-800",
  PENUH: "bg-amber-100 text-amber-800",
  NORMAL: "bg-emerald-100 text-emerald-800",
};

export default async function AdminPage() {
  const [stasiun, pengaturan] = await Promise.all([
    ringkasanStasiun(),
    getPengaturan(),
  ]);
  const [totalSepeda, sepedaDipinjam, rentalAktif] = await Promise.all([
    prisma.bike.count(),
    prisma.bike.count({ where: { status: "DIPINJAM" } }),
    prisma.rental.count({ where: { status: "AKTIF" } }),
  ]);
  const butuhDiisi = stasiun.filter((s) => s.status === "KOSONG");
  const butuhDikosongkan = stasiun.filter((s) => s.status === "PENUH");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Total sepeda", totalSepeda],
          ["Sedang dipinjam", sepedaDipinjam],
          ["Rental aktif", rentalAktif],
          ["Tarif/menit", rupiah(pengaturan.tarifPerMenit)],
        ].map(([label, val]) => (
          <div key={label} className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-bold">{val}</p>
          </div>
        ))}
      </div>

      {(butuhDiisi.length > 0 || butuhDikosongkan.length > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">
            ⚠️ Kebutuhan Rebalancing
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {butuhDiisi.map((s) => (
              <li key={s.id}>
                🔴 <strong>{s.nama}</strong> KOSONG — perlu diisi sepeda
                (kapasitas {s.kapasitas})
              </li>
            ))}
            {butuhDikosongkan.map((s) => (
              <li key={s.id}>
                🟠 <strong>{s.nama}</strong> PENUH — perlu dikurangi sepedanya
                ({s.terisi}/{s.kapasitas})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left">Stasiun</th>
              <th className="px-3 py-2 text-left">Lokasi</th>
              <th className="px-3 py-2 text-right">Sepeda</th>
              <th className="px-3 py-2 text-right">Slot kosong</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {stasiun.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-3 py-2 font-medium">{s.nama}</td>
                <td className="px-3 py-2 text-slate-500">{s.lokasi}</td>
                <td className="px-3 py-2 text-right">
                  {s.terisi}/{s.kapasitas}
                </td>
                <td className="px-3 py-2 text-right">{s.slotKosong}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge[s.status]}`}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
