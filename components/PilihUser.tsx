"use client";
import { useEffect, useState } from "react";
import { rupiah } from "@/lib/format";

interface User {
  id: number;
  nama: string;
  saldo: number;
}

export default function PilihUser({
  value,
  onChange,
}: {
  value: number | "";
  onChange: (id: number | "") => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);
  const aktif = users.find((u) => u.id === value);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="font-medium">Pengguna:</label>
      <select
        className="rounded border border-slate-300 bg-white px-3 py-2"
        value={value}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : parseInt(e.target.value, 10))
        }
      >
        <option value="">— pilih —</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nama} (saldo {rupiah(u.saldo)})
          </option>
        ))}
      </select>
      {aktif && (
        <span className="text-sm text-slate-600">
          Saldo: <strong>{rupiah(aktif.saldo)}</strong>
        </span>
      )}
    </div>
  );
}
