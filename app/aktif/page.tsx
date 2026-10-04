"use client";
import { useCallback, useEffect, useState } from "react";
import PilihUser from "@/components/PilihUser";
import { rupiah, fmtWaktu, fmtJarak } from "@/lib/format";

interface Saran {
  id: number;
  nama: string;
  slotKosong: number;
  jarakMeter: number;
}

export default function AktifPage() {
  const [userId, setUserId] = useState<number | "">("");
  const [data, setData] = useState<any>(null);
  const [stasiun, setStasiun] = useState<any[]>([]);
  const [tujuan, setTujuan] = useState("");
  const [pesan, setPesan] = useState("");
  const [saran, setSaran] = useState<Saran[]>([]);
  const [loading, setLoading] = useState(false);

  const muat = useCallback(async () => {
    if (!userId) {
      setData(null);
      return;
    }
    const r = await fetch(`/api/rentals/active?userId=${userId}`);
    setData(await r.json());
  }, [userId]);

  useEffect(() => {
    muat();
  }, [muat]);

  useEffect(() => {
    if (!userId) return;
    const t = setInterval(muat, 15000);
    return () => clearInterval(t);
  }, [userId, muat]);

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then(setStasiun)
      .catch(() => setStasiun([]));
  }, []);

  async function kembalikan() {
    setPesan("");
    setSaran([]);
    if (!tujuan) {
      setPesan("Pilih stasiun tujuan pengembalian.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/rentals/${data.rental.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: parseInt(tujuan, 10) }),
      });
      const d = await r.json();
      if (!r.ok) {
        setPesan(d.error ?? "Gagal mengembalikan");
        if (d.detail?.saran) setSaran(d.detail.saran);
      } else {
        setPesan(
          `Dikembalikan! Durasi ${d.durasiMenit} menit, biaya ${rupiah(
            d.biaya
          )}. Saldo sekarang ${rupiah(d.saldoBaru)}.`
        );
        setData(null);
      }
    } catch {
      setPesan("Kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Penyewaan Aktif</h1>
      <PilihUser
        value={userId}
        onChange={(id) => {
          setUserId(id);
          setPesan("");
          setSaran([]);
        }}
      />

      {!userId && <p className="text-slate-500">Pilih pengguna untuk melihat penyewaan aktif.</p>}

      {userId && data === null && (
        <p className="text-slate-500">Tidak ada penyewaan aktif.</p>
      )}

      {data?.rental && (
        <div className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">
            🚲 {data.rental.bike.kode}{" "}
            <span className="text-sm font-normal text-slate-500">
              dari {data.rental.stationAwal.nama}
            </span>
          </h2>
          <ul className="space-y-1 text-sm">
            <li>Mulai: {fmtWaktu(data.rental.mulaiAt)}</li>
            <li>Berjalan: <strong>{data.menitBerjalan} menit</strong></li>
            <li>
              Estimasi biaya:{" "}
              <strong className="text-emerald-700">
                {rupiah(data.estimasiBiaya)}
              </strong>
            </li>
            <li>Deposit ditahan: {rupiah(data.rental.depositHold)}</li>
          </ul>

          <div className="border-t pt-4">
            <label className="mb-1 block font-medium">
              Kembalikan ke stasiun:
            </label>
            <div className="flex gap-2">
              <select
                className="flex-1 rounded border border-slate-300 bg-white px-3 py-2"
                value={tujuan}
                onChange={(e) => setTujuan(e.target.value)}
              >
                <option value="">— pilih stasiun —</option>
                {stasiun.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.slotKosong} slot kosong
                    {s.status === "PENUH" ? ", PENUH" : ""})
                  </option>
                ))}
              </select>
              <button
                onClick={kembalikan}
                disabled={loading}
                className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "…" : "Kembalikan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pesan && (
        <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">{pesan}</p>
      )}
      {saran.length > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="font-semibold">Stasiun alternatif terdekat:</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {saran.map((s) => (
              <li key={s.id}>
                📍 {s.nama} — {s.slotKosong} slot kosong, {fmtJarak(s.jarakMeter)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
