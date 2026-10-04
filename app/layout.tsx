import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Sepeda Berbagi Kampus",
  description: "Sistem penyewaan sepeda berbasis stasiun di lingkungan kampus",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-900">
        <header className="bg-emerald-700 text-white">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-3">
            <a href="/" className="mr-4 text-lg font-bold">🚲 Sepeda Kampus</a>
            <a href="/" className="rounded px-3 py-1 hover:bg-emerald-600">Stasiun</a>
            <a href="/scan" className="rounded px-3 py-1 hover:bg-emerald-600">Scan QR</a>
            <a href="/aktif" className="rounded px-3 py-1 hover:bg-emerald-600">Aktif</a>
            <a href="/riwayat" className="rounded px-3 py-1 hover:bg-emerald-600">Riwayat</a>
            <a href="/admin" className="rounded px-3 py-1 hover:bg-emerald-600">Admin</a>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
