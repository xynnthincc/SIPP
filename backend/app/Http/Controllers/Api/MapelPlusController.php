<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MapelPlus;
use Illuminate\Http\Request;

class MapelPlusController extends Controller
{
    public function index()
    {
        return MapelPlus::withCount('jenisAssessments')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'kode' => ['required', 'string', 'unique:mapel_plus,kode'],
            'nama' => ['required', 'string', 'max:100'],
            'deskripsi' => ['nullable', 'string'],
            'punya_progres_hafalan' => ['boolean'],
        ]);

        return MapelPlus::create($data);
    }

    public function update(Request $request, MapelPlus $mapelPlus)
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:100'],
            'deskripsi' => ['nullable', 'string'],
            'punya_progres_hafalan' => ['boolean'],
        ]);

        $mapelPlus->update($data);

        return $mapelPlus;
    }
}
