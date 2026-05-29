<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Specialty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SpecialtyController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Specialty::query()->orderBy('name')->get(['id', 'name', 'created_at', 'updated_at']);
        return response()->json(['data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:specialties,name',
        ], [
            'name.required' => 'Укажите название специальности.',
            'name.unique' => 'Такая специальность уже есть.',
        ]);

        $s = Specialty::create(['name' => trim($validated['name'])]);
        return response()->json(['data' => $s], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $s = Specialty::find($id);
        if (!$s) {
            return response()->json(['message' => 'Специальность не найдена.'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:specialties,name,' . $id,
        ], [
            'name.required' => 'Укажите название специальности.',
            'name.unique' => 'Такая специальность уже есть.',
        ]);

        $s->name = trim($validated['name']);
        $s->save();

        return response()->json(['data' => $s]);
    }

    public function destroy(int $id): JsonResponse
    {
        $s = Specialty::find($id);
        if (!$s) {
            return response()->json(['message' => 'Специальность не найдена.'], 404);
        }
        $s->delete();
        return response()->json(['message' => 'Специальность удалена.']);
    }
}
