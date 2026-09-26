// Terminologi pesantren (mengikuti alur e-rapor lama):
// - "Kelas" = jenjang diniyah: Qitsmu Awwal, Qitsmu Tsani, Qitsmu Tsalis (+ rombel, mis. "Qitsmu Awwal A")
// - "Tingkat" = jenjang formal: 7, 8, 9
// Data mentah tetap menyimpan tingkat 7/8/9 dan nama rombel "7A" dsb.

/** Nama kelas (jenjang diniyah) untuk tiap tingkat. */
export const KELAS_LABEL: Record<number, string> = {
  7: "Qitsmu Awwal",
  8: "Qitsmu Tsani",
  9: "Qitsmu Tsalis",
};

/** Tingkat formal ditampilkan apa adanya: 7 / 8 / 9. */
export function labelTingkat(tingkat: number | string | null | undefined): string {
  const t = Number(tingkat);
  return Number.isFinite(t) ? String(t) : "-";
}

/** "7A" → "Qitsmu Awwal A", "8" → "Qitsmu Tsani"; nama tak dikenal dibiarkan apa adanya */
export function labelKelas(nama: string | null | undefined): string | null {
  if (!nama) return null;
  const m = nama.match(/^(\d)\s*(.*)$/);
  if (m) {
    const jenjang = KELAS_LABEL[Number(m[1])];
    if (jenjang) {
      const rombel = m[2].trim();
      return rombel ? `${jenjang} ${rombel}` : jenjang;
    }
  }
  return nama;
}
