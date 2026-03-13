<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Список пользователей (поиск, фильтр по роли, сортировка).
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::query()->with('roles');

        $search = $request->input('search');
        if ($search && is_string($search)) {
            $term = '%' . trim($search) . '%';
            $termLower = mb_strtolower($term);
            $query->where(function ($q) use ($termLower) {
                $q->whereRaw('LOWER(full_name) LIKE ?', [$termLower])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$termLower])
                    ->orWhereRaw('LOWER(COALESCE(phone, \'\')) LIKE ?', [$termLower]);
            });
        }

        $role = $request->input('role');
        if ($role && in_array($role, ['client', 'lawyer', 'admin'], true)) {
            $query->whereHas('roles', fn ($q) => $q->where('name', $role));
        }

        $sortBy = $request->input('sort_by', 'created_at');
        if (!in_array($sortBy, ['full_name', 'created_at'], true)) {
            $sortBy = 'created_at';
        }
        $sortOrder = $request->input('sort_order', 'desc');
        if (!in_array($sortOrder, ['asc', 'desc'], true)) {
            $sortOrder = 'desc';
        }
        $query->orderBy($sortBy, $sortOrder);

        $users = $query->get();

        return response()->json(['users' => $users]);
    }

    /**
     * Блокировка/разблокировка пользователя. Только для роли admin.
     */
    public function updateUser(Request $request, int $id): JsonResponse
    {
        $currentUser = $request->user();
        $isAdmin = $currentUser->roles()->where('name', 'admin')->exists();
        if (!$isAdmin) {
            return response()->json([
                'message' => 'Только администратор может блокировать пользователей.',
            ], 403);
        }

        $validated = $request->validate([
            'is_blocked' => 'required|boolean',
        ]);

        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Пользователь не найден.'], 404);
        }

        $user->is_blocked = $validated['is_blocked'];
        $user->save();

        $user->load('roles');
        return response()->json(['user' => $user, 'message' => $validated['is_blocked'] ? 'Пользователь заблокирован.' : 'Пользователь разблокирован.']);
    }
}
