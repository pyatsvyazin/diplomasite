<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
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
            'is_blocked' => 'sometimes|boolean',
            'role' => 'sometimes|string|in:client,lawyer,admin',
        ]);

        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Пользователь не найден.'], 404);
        }

        if (array_key_exists('is_blocked', $validated)) {
            $user->is_blocked = $validated['is_blocked'];
            $user->save();
        }

        if (array_key_exists('role', $validated)) {
            $roleId = Role::query()->where('name', $validated['role'])->value('id');
            if (! $roleId) {
                return response()->json(['message' => 'Роль не найдена.'], 422);
            }
            $user->roles()->sync([$roleId]);
        }

        $user->load('roles');
        $message = 'Пользователь обновлён.';
        if (array_key_exists('is_blocked', $validated)) {
            $message = $validated['is_blocked'] ? 'Пользователь заблокирован.' : 'Пользователь разблокирован.';
        }
        if (array_key_exists('role', $validated)) {
            $message = 'Роль пользователя обновлена.';
        }
        return response()->json(['user' => $user, 'message' => $message]);
    }

    /**
     * Создать пользователя (админ) с присвоением роли.
     */
    public function createUser(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $isAdmin = $currentUser->roles()->where('name', 'admin')->exists();
        if (!$isAdmin) {
            return response()->json([
                'message' => 'Только администратор может создавать пользователей.',
            ], 403);
        }

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:50',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:client,lawyer,admin',
        ]);

        $user = new User();
        $user->full_name = $validated['full_name'];
        $user->email = $validated['email'];
        $user->phone = $validated['phone'] ?? null;
        $user->password = \Illuminate\Support\Facades\Hash::make($validated['password']);
        $user->save();

        $roleId = Role::query()->where('name', $validated['role'])->value('id');
        if ($roleId) {
            $user->roles()->sync([$roleId]);
        }

        $user->load('roles');

        return response()->json(['user' => $user, 'message' => 'Пользователь создан.']);
    }
}
