<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Request as RequestModel;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class PublicStaffController extends Controller
{
    private const PLACEHOLDER_AVATAR = '/images/avatars/placeholder_avatar.png';

    /**
     * Сотрудники с ролью «юрист» для главной страницы (без email, телефона).
     */
    public function index(): JsonResponse
    {
        $users = User::query()
            ->with('specialties')
            ->where('is_blocked', false)
            ->whereHas('roles', fn ($q) => $q->where('name', 'lawyer'))
            ->orderBy('full_name')
            ->get();

        $data = $users->map(function (User $user) {
            $closedCount = RequestModel::query()
                ->where('lawyer_id', $user->id)
                ->where('status', RequestModel::STATUS_CLOSED)
                ->count();

            $resolvedCount = RequestModel::query()
                ->where('lawyer_id', $user->id)
                ->whereIn('status', [RequestModel::STATUS_CLOSED, RequestModel::STATUS_REJECTED])
                ->count();

            $avgRating = Review::query()
                ->where('lawyer_id', $user->id)
                ->avg('rating');

            $ratingOutOf5 = $avgRating !== null ? round($avgRating / 2, 1) : null;

            $successRate = null;
            if ($resolvedCount > 0) {
                $successRate = (int) round(($closedCount / $resolvedCount) * 100);
            }

            $avatar = $user->avatar_path
                ? url(Storage::disk('public')->url($user->avatar_path))
                : url(self::PLACEHOLDER_AVATAR);

            return [
                'id'                 => $user->id,
                'full_name'          => $user->full_name,
                'avatar_path'        => $avatar,
                'rating'             => $ratingOutOf5,
                'closed_cases_count' => $closedCount,
                'success_rate'       => $successRate,
                'specialties'        => $user->specialties->map(fn ($sp) => [
                    'id'   => $sp->id,
                    'name' => $sp->name,
                ])->values()->all(),
            ];
        })->values();

        return response()->json(['data' => $data]);
    }
}
