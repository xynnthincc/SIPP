<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PredikatRange;
use Illuminate\Http\Request;

class PredikatRangeController extends Controller
{
    public function index()
    {
        return PredikatRange::orderByDesc('nilai_min')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:50'],
            'nilai_min' => ['required', 'numeric', 'min:0', 'max:100'],
            'nilai_max' => ['required', 'numeric', 'min:0', 'max:100', 'gte:nilai_min'],
        ], ['nilai_max.gte' => 'Nilai maksimal harus lebih besar atau sama dengan nilai minimal.']);

        return PredikatRange::create($data);
    }

    public function update(Request $request, PredikatRange $predikatRange)
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:50'],
            'nilai_min' => ['required', 'numeric', 'min:0', 'max:100'],
            'nilai_max' => ['required', 'numeric', 'min:0', 'max:100', 'gte:nilai_min'],
        ], ['nilai_max.gte' => 'Nilai maksimal harus lebih besar atau sama dengan nilai minimal.']);

        $predikatRange->update($data);

        return $predikatRange;
    }

    public function destroy(PredikatRange $predikatRange)
    {
        $predikatRange->delete();

        return response()->noContent();
    }
}
