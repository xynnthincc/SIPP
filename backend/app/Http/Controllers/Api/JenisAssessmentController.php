<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JenisAssessment;
use Illuminate\Http\Request;

class JenisAssessmentController extends Controller
{
    public function index(Request $request)
    {
        return JenisAssessment::when($request->mapel_plus_id, fn ($q, $id) => $q->where('mapel_plus_id', $id))->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'mapel_plus_id' => ['required', 'exists:mapel_plus,id'],
            'nama' => ['required', 'string', 'max:100'],
            'bobot' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        return JenisAssessment::create($data);
    }
}
