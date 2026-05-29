<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Request as RequestModel;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StaffController extends Controller
{
    private const PLACEHOLDER_AVATAR = '/images/avatars/placeholder_avatar.png';

    public function index(): JsonResponse
    {
        $users = User::query()
            ->with(['roles', 'specialties'])
            ->whereHas('roles', fn ($q) => $q->whereIn('name', ['lawyer', 'admin']))
            ->orderBy('full_name')
            ->get();

        $staff = $users->map(function (User $user) {
            $roles = $user->roles->pluck('name')->toArray();
            $isLawyer = in_array('lawyer', $roles, true);

            $item = [
                'id'          => $user->id,
                'full_name'   => $user->full_name,
                'email'       => $user->email,
                'phone'       => $user->phone,
                'roles'       => $roles,
                'avatar_path' => $user->avatar_path
                    ? url(Storage::disk('public')->url($user->avatar_path))
                    : self::PLACEHOLDER_AVATAR,
                'can_edit'    => $isLawyer,
            ];

            if ($isLawyer) {
                $item['specialties'] = $user->specialties->map(fn ($sp) => [
                    'id'   => $sp->id,
                    'name' => $sp->name,
                ])->values()->all();
                $item['closed_cases_count'] = RequestModel::query()
                    ->where('lawyer_id', $user->id)
                    ->where('status', RequestModel::STATUS_CLOSED)
                    ->count();
                $avgRating = Review::query()
                    ->where('lawyer_id', $user->id)
                    ->avg('rating');
                $item['rating'] = $avgRating !== null ? round($avgRating / 2, 1) : null;
            } else {
                $item['specialties'] = [];
                $item['closed_cases_count'] = 0;
                $item['rating'] = null;
            }

            return $item;
        });

        return response()->json(['data' => $staff]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::query()->with('roles')->find($id);
        if (!$user) {
            return response()->json(['message' => 'Пользователь не найден.'], 404);
        }
        if (!$user->roles->contains('name', 'lawyer')) {
            return response()->json(['message' => 'Редактирование данных этого сотрудника запрещено.'], 403);
        }

        $data = $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'email'     => 'sometimes|email|unique:users,email,' . $id,
            'phone'     => 'nullable|string|max:50',
        ], [
            'full_name.max' => 'ФИО слишком длинное.',
            'email.email'   => 'Некорректный email.',
            'email.unique'  => 'Такой email уже занят.',
            'phone.max'     => 'Телефон слишком длинный.',
        ]);

        if ($request->hasFile('avatar')) {
            $request->validate(['avatar' => 'image|max:2048'], ['avatar.image' => 'Файл должен быть изображением.', 'avatar.max' => 'Размер файла не более 2 МБ.']);
            $path = $request->file('avatar')->store('avatars', 'public');
            if ($user->avatar_path) {
                Storage::disk('public')->delete($user->avatar_path);
            }
            $user->avatar_path = $path;
        }

        $user->fill($data);
        $user->save();
        $user->load(['roles', 'specialties']);

        $closedCount = RequestModel::query()
            ->where('lawyer_id', $user->id)
            ->where('status', RequestModel::STATUS_CLOSED)
            ->count();
        $avgRating = Review::query()->where('lawyer_id', $user->id)->avg('rating');

        $avatarPath = $user->avatar_path
            ? url(Storage::disk('public')->url($user->avatar_path))
            : self::PLACEHOLDER_AVATAR;

        $specialties = $user->specialties->map(fn ($sp) => [
            'id'   => $sp->id,
            'name' => $sp->name,
        ])->values()->all();

        return response()->json([
            'data' => [
                'id'                 => $user->id,
                'full_name'          => $user->full_name,
                'email'              => $user->email,
                'phone'              => $user->phone,
                'roles'              => $user->roles->pluck('name')->toArray(),
                'avatar_path'        => $avatarPath,
                'can_edit'           => true,
                'specialties'        => $specialties,
                'closed_cases_count' => $closedCount,
                'rating'             => $avgRating !== null ? round($avgRating / 2, 1) : null,
            ],
        ]);
    }

    /**
     * Синхронизация специальностей юриста (только для пользователей с ролью lawyer).
     */
    public function updateSpecialties(Request $request, int $id): JsonResponse
    {
        $user = User::query()->with('roles')->find($id);
        if (!$user) {
            return response()->json(['message' => 'Пользователь не найден.'], 404);
        }
        if (!$user->roles->contains('name', 'lawyer')) {
            return response()->json(['message' => 'Специальности задаются только для юристов.'], 403);
        }

        $validated = $request->validate([
            'specialty_ids'   => 'required|array',
            'specialty_ids.*' => 'integer|exists:specialties,id',
        ], [
            'specialty_ids.required' => 'Передайте список специальностей.',
        ]);

        $user->specialties()->sync($validated['specialty_ids']);
        $user->load('specialties');

        $closedCount = RequestModel::query()
            ->where('lawyer_id', $user->id)
            ->where('status', RequestModel::STATUS_CLOSED)
            ->count();
        $avgRating = Review::query()->where('lawyer_id', $user->id)->avg('rating');
        $avatarPath = $user->avatar_path
            ? url(Storage::disk('public')->url($user->avatar_path))
            : self::PLACEHOLDER_AVATAR;

        return response()->json([
            'data' => [
                'id'                 => $user->id,
                'full_name'          => $user->full_name,
                'email'              => $user->email,
                'phone'              => $user->phone,
                'roles'              => $user->roles->pluck('name')->toArray(),
                'avatar_path'        => $avatarPath,
                'can_edit'           => true,
                'specialties'        => $user->specialties->map(fn ($sp) => ['id' => $sp->id, 'name' => $sp->name])->values()->all(),
                'closed_cases_count' => $closedCount,
                'rating'             => $avgRating !== null ? round($avgRating / 2, 1) : null,
            ],
        ]);
    }
}