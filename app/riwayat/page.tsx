"use client";
import { useEffect, useState } from "react";
import PilihUser from "@/components/PilihUser";
import { rupiah, fmtWaktu } from "@/lib/format";

export default function RiwayatPage() {
  const [userId, setUserId] = useState<number | "">("");
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) {
      setRows([]);
      return;
    }
    fetch(`/api/rentals?userId=${userId}`)
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setRows([]));
  }, [userId]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Riwayat Penyewaan</h1>
      <PilihUser value={userId} onChange={setUserId} />

      {!userId && <p className="text-slate-500">Pilih pengguna untuk melihat riwayat.</p>}
      {userId && rows.length === 0 && (
        <p className="text-slate-500">Belum ada riwayat penyewaan.</p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">Sepeda</th>
                <th className="px-3 py-2 text-left">Dari → Ke</th>
                <th className="px-3 py-2 text-left">Mulai</th>
                <th className="px-3 py-2 text-right">Durasi</th>
                <th className="px-3 py-2 text-right">Biaya</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{r.bike.kode}</td>
                  <td className="px-3 py-2">
                    {r.stationAwal.nama} → {r.stationAkhir?.nama ?? "—"}
                  </td>
                  <td className="px-3 py-2">{fmtWaktu(r.mulaiAt)}</td>
                  <td className="px-3 py-2 text-right">
                    {r.durasiMenit != null ? `${r.durasiMenit} mnt` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.biaya != null ? rupiah(r.biaya) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.status === "AKTIF"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
