"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui";

export default function RedirectCetakBiodata() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <RedirectHandler />
    </Suspense>
  );
}

function RedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || searchParams.get("siswa_id");

  useEffect(() => {
    router.replace(id ? `/biodata-cetak?id=${id}` : "/biodata-cetak");
  }, [id, router]);

  return <Skeleton className="h-64 w-full" />;
}
