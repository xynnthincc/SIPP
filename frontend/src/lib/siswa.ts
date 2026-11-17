import { api } from "./api";

/**
 * Ambil SEMUA siswa lintas halaman.
 * Backend `/siswa` memakai paginate(20) — mengambil `data` saja hanya
 * mengembalikan 20 siswa pertama sehingga siswa di halaman berikut
 * "hilang" dari daftar (pernah terjadi: 2 siswa 7C tak muncul di wali kelas).
 */
export async function fetchSemuaSiswa<T extends { id: number }>(
  params: Record<string, string | number | undefined> = {}
): Promise<T[]> {
  const semua: T[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const res = await api.get("/siswa", { params: { ...params, page } });
    const body = res.data;
    const daftar: T[] = Array.isArray(body) ? body : (body.data ?? []);
    semua.push(...daftar);
    lastPage = typeof body?.last_page === "number" ? body.last_page : 1;
    page += 1;
  } while (page <= lastPage);
  return semua;
}
