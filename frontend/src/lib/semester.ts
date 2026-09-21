export interface SemesterOption {
  id: number;
  nama: string;
  jenis?: "Akhir" | "Sementara" | null;
  is_aktif?: boolean;
  tahun_ajaran?: { nama: string } | null;
}

/** Label dropdown/keterangan semester — wadah Sementara ditandai agar tidak tertukar dengan Akhir. */
export function labelSemester(s: SemesterOption): string {
  const jenis = s.jenis === "Sementara" ? " (Sementara)" : "";
  return `Semester ${s.nama}${jenis} ${s.tahun_ajaran?.nama ?? ""}`.trim();
}
