"use client";

import { useAuth } from "@/lib/auth-context";

export default function SiswaHomePage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-lg font-semibold">Halo, {user?.name}</h1>
      <p className="mt-1 text-sm text-gray-500">
        Lihat rapor pesantren Anda di menu "Rapor Saya".
      </p>
    </div>
  );
}
