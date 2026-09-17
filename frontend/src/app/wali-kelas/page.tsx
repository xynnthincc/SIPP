"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, Card, Table, TableHead, TableBody, Th, Td, TableRow, Skeleton, EmptyState } from "@/components/ui";

interface Siswa {
  id: number;
  nis: string;
  nama: string;
}

export default function SiswaBinaanPage() {
  const { user } = useAuth();
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get("/kelas-rombel").then((res) => {
      const kelasId = res.data[0]?.id;
      if (kelasId) {
        api.get("/siswa", { params: { kelas_rombel_id: kelasId } }).then((r) => {
          setSiswas(r.data.data ?? r.data);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, [user]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Siswa Binaan" description="Daftar siswa di kelas yang Anda walikan." />

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : siswas.length === 0 ? (
        <EmptyState title="Tidak ada siswa" description="Kelas yang Anda walikan belum memiliki siswa." />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHead>
              <Th>NIS</Th>
              <Th>Nama</Th>
            </TableHead>
            <TableBody>
              {siswas.map((s) => (
                <TableRow key={s.id}>
                  <Td className="font-mono text-xs">{s.nis}</Td>
                  <Td className="font-medium">{s.nama}</Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
