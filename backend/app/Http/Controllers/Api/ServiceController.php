<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;

class ServiceController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Service::query()
            ->orderBy('priority')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $items]);
    }

    public function show(int $id): JsonResponse
    {
        $service = Service::query()->findOrFail($id);

        return response()->json(['data' => $service]);
    }
}
