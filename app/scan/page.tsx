"use client";
import { useState } from "react";
import PilihUser from "@/components/PilihUser";
import { rupiah, fmtWaktu } from "@/lib/format";

export default function ScanPage() {
  const [userId, setUserId] = useState<number | "">("");
  const [qrToken, setQrToken] = useState("");
  const [hasil, setHasil] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function pinjam() {
    setError("");
    setHasil(null);
    if (!userId) {
      setError("Pilih pengguna dulu.");
      return;
    }
    if (!qrToken.trim()) {
      setError("Masukkan / tempel token QR sepeda.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: qrToken.trim(), userId }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error ?? "Gagal meminjam");
      } else {
        setHasil(d);
        setQrToken("");
      }
    } catch {
      setError("Kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan QR — Pinjam Sepeda</h1>
        <p className="text-slate-600">
          Pindai QR di sepeda (atau salin tokennya), lalu tekan Pinjam.
          Deposit Rp20.000 ditahan dari saldo selama peminjaman.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
        <PilihUser value={userId} onChange={setUserId} />
        <div>
          <label className="mb-1 block font-medium">Token QR sepeda</label>
          <input
            className="w-full rounded border border-slate-300 px-3 py-2 font-mono"
            placeholder="cth: QR-SPD-001-2026"
            value={qrToken}
            onChange={(e) => setQrToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && pinjam()}
          />
        </div>
        <button
          onClick={pinjam}
          disabled={loading}
          className="w-full rounded bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Memproses…" : "🚲 Pinjam Sepeda"}
        </button>
        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
      </div>

      {hasil && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="font-semibold text-emerald-800">
            Berhasil! Sepeda {hasil.rental.bike.kode} dipinjam.
          </h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Stasiun awal: {hasil.rental.stationAwal.nama}</li>
            <li>Mulai: {fmtWaktu(hasil.rental.mulaiAt)}</li>
            <li>Deposit ditahan: {rupiah(hasil.rental.depositHold)}</li>
            <li>Tarif: {rupiah(hasil.rental.tarifPerMenit)}/menit</li>
            <li>
              Saldo sekarang: <strong>{rupiah(hasil.saldoBaru)}</strong>
            </li>
          </ul>
          <a
            href="/aktif"
            className="mt-3 inline-block rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Lihat penyewaan aktif →
          </a>
        </div>
      )}
    </div>
  );
}
