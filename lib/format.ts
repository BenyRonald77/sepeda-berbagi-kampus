export const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");

export const fmtWaktu = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const menitBerjalan = (mulaiIso: string, sampai: Date = new Date()) =>
  Math.max(0, Math.ceil((sampai.getTime() - new Date(mulaiIso).getTime()) / 60000));

/** Jarak haversine dalam meter antara dua koordinat. */
export function jarakMeter(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const fmtJarak = (m: number) =>
  m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
