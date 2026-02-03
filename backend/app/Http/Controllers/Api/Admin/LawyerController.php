<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LawyerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search', '');
        $search = is_string($search) ? trim($search) : '';

        $query = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'lawyer'))
            ->orderBy('full_name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        $lawyers = $query->get(['id', 'full_name', 'email']);

        return response()->json(['data' => $lawyers]);
    }
}