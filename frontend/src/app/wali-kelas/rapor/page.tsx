"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function WaliKelasRaporPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === "admin") {
      router.replace("/admin/rapor");
    } else {
      router.replace("/wali-kelas");
    }
  }, [user, router]);

  return null;
}
