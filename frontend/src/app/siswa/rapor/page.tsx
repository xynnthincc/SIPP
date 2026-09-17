"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  PageHeader, Card, Button, Badge, Skeleton, EmptyState,
  Table, TableHead, TableBody, Th, Td, TableRow,
} from "@/components/ui";

interface SemesterLite {
  id: number;
  nama: string;
  is_aktif: boolean;
  tahun_ajaran: { nama: string } | null;
}

interface SiswaSendiri {
  id: number;
  nama: string;
  nis: string;
}

export default function RaporSiswaPage() {
  const [siswa, setSiswa] = useState<SiswaSendiri | null>(null);
  const [semesters, setSemesters] = useState<SemesterLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<SiswaSendiri[]>("/siswa"),
      api.get<SemesterLite[]>("/semester"),
    ]).then(([siswaRes, semRes]) => {
      // Endpoint /siswa untuk role siswa otomatis mengembalikan dirinya sendiri
      setSiswa(siswaRes.data[0] ?? null);
      setSemesters(semRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const semesterTerbaru = useMemo(
    () => semesters.find((s) => s.is_aktif) ?? semesters[0] ?? null,
    [semesters]
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Rapor Saya"
        description="Rapor pesantren direal-time dari data nilai terbaru — pilih semester lalu cetak."
      />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : !siswa ? (
        <EmptyState
          title="Data siswa tidak ditemukan"
          description="Akun Anda belum terhubung dengan data siswa. Hubungi admin."
        />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHead>
              <Th className="w-12">No</Th>
              <Th>Semester</Th>
              <Th>Status</Th>
              <Th className="text-right">Aksi</Th>
            </TableHead>
            <TableBody>
              {semesters.map((s, i) => (
                <TableRow key={s.id}>
                  <Td className="text-slate-400">{i + 1}</Td>
                  <Td>
                    <span className="font-medium text-slate-800">
                      Semester {s.nama}
                    </span>
                    {s.tahun_ajaran?.nama && (
                      <span className="text-slate-400"> · {s.tahun_ajaran.nama}</span>
                    )}
                  </Td>
                  <Td>
                    {s.is_aktif ? (
                      <Badge variant="success">Berjalan</Badge>
                    ) : (
                      <Badge variant="default">Selesai</Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    <Link href={`/rapor-cetak?siswa_id=${siswa.id}&semester_id=${s.id}`}>
                      <Button size="sm" variant={s.id === semesterTerbaru?.id ? "primary" : "outline"}>
                        Lihat &amp; Cetak
                      </Button>
                    </Link>
                  </Td>
                </TableRow>
              ))}
              {semesters.length === 0 && (
                <TableRow>
                  <Td colSpan={4} className="text-center text-slate-400 py-8">
                    Belum ada semester yang tersedia.
                  </Td>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
