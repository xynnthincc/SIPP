<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NilaiPraktik;
use App\Models\PraktikItem;
use Illuminate\Http\Request;

class PraktikItemController extends Controller
{
    /** Daftar item praktik & hafalan (dibaca admin/wali/guru untuk input nilai). */
    public function index()
    {
        return PraktikItem::withCount('nilaiPraktiks')->orderBy('urutan')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'kode' => ['required', 'string', 'unique:praktik_items,kode'],
            'nama_id' => ['required', 'string', 'max:100'],
            'nama_ar' => ['nullable', 'string', 'max:100'],
            'urutan' => ['required', 'integer', 'min:0'],
        ]);

        return PraktikItem::create($data);
    }

    public function update(Request $request, PraktikItem $praktikItem)
    {
        $data = $request->validate([
            'kode' => ['sometimes', 'string', 'unique:praktik_items,kode,'.$praktikItem->id],
            'nama_id' => ['sometimes', 'string', 'max:100'],
            'nama_ar' => ['nullable', 'string', 'max:100'],
            'urutan' => ['sometimes', 'integer', 'min:0'],
        ]);

        $praktikItem->update($data);

        return $praktikItem;
    }

    /** Hapus item; diblokir jika sudah ada nilai tersimpan atau diampu guru. */
    public function destroy(PraktikItem $praktikItem)
    {
        if (NilaiPraktik::where('praktik_item_id', $praktikItem->id)->exists()) {
            abort(422, 'Item ini masih memiliki data nilai siswa. Tidak bisa dihapus.');
        }

        if ($praktikItem->gurus()->exists()) {
            abort(422, 'Item ini masih diampu oleh guru. Hapus penugasannya terlebih dahulu.');
        }

        $praktikItem->delete();

        return response()->noContent();
    }
}
