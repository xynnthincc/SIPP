// Nama jenjang kelas ala pesantren — dipakai untuk menampilkan tingkat/nama kelas
// di seluruh dashboard (data mentah tetap menyimpan tingkat 7/8/9 dan nama "7A" dsb.)
export const TINGKAT_LABEL: Record<number, string> = {
  7: "Tamhidi",
  8: "Qitsmu Awwal",
  9: "Qitsmu Tsani",
};

export function labelTingkat(tingkat: number | string | null | undefined): string {
  const t = Number(tingkat);
  if (Number.isFinite(t) && TINGKAT_LABEL[t]) return TINGKAT_LABEL[t];
  return `Tingkat ${tingkat ?? "-"}`;
}

/** "7A" → "Tamhidi A", "8" → "Qitsmu Awwal"; nama tak dikenal dibiarkan apa adanya */
export function labelKelas(nama: string | null | undefined): string | null {
  if (!nama) return null;
  const m = nama.match(/^(\d)\s*(.*)$/);
  if (m) {
    const jenjang = TINGKAT_LABEL[Number(m[1])];
    if (jenjang) {
      const rombel = m[2].trim();
      return rombel ? `${jenjang} ${rombel}` : jenjang;
    }
  }
  return nama;
}
