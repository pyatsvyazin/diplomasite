<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Request as RequestModel;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ReviewController extends Controller
{
    /**
     * Список опубликованных отзывов для страницы отзывов (публичный).
     */
    public function index(): JsonResponse
    {
        $items = Review::query()
            ->where('status', Review::STATUS_PUBLISHED)
            ->with(['lawyer', 'client'])
            ->orderByDesc('created_at')
            ->get();

        $data = $items->map(function (Review $r) {
            return [
                'id'           => $r->id,
                'request_id'   => $r->request_id,
                'client_name'  => $r->is_anonymous ? null : ($r->client?->full_name ?? 'Клиент'),
                'is_anonymous' => $r->is_anonymous,
                'rating'       => $r->rating / 2, // в БД 1–10, отдаём 0.5–5
                'message'      => $r->message,
                'created_at'   => $r->created_at?->toIso8601String(),
                'lawyer'       => $r->lawyer ? [
                    'id'          => $r->lawyer->id,
                    'full_name'   => $r->lawyer->full_name,
                    'avatar_path' => $r->lawyer->avatar_path
                        ? url(Storage::disk('public')->url($r->lawyer->avatar_path))
                        : null,
                ] : null,
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Создать отзыв по заявке (только клиент, заявка закрыта, один раз).
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Необходима авторизация.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'request_id'   => 'required|integer|exists:requests,id',
            'rating'       => 'required|numeric|min:0.5|max:5',
            'message'      => 'required|string|max:5000',
            'is_anonymous' => 'boolean',
        ], [
            'request_id.required' => 'Укажите заявку.',
            'request_id.exists'    => 'Заявка не найдена.',
            'rating.required'     => 'Укажите оценку.',
            'message.required'    => 'Введите отзыв.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Ошибка валидации.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $req = RequestModel::with('review')->find($request->input('request_id'));
        if (!$req || $req->status !== RequestModel::STATUS_CLOSED) {
            return response()->json(['message' => 'Заявка не найдена или не закрыта.'], 422);
        }
        if ($req->client_id != $user->id) {
            return response()->json(['message' => 'Оставить отзыв может только клиент по этой заявке.'], 403);
        }
        if ($req->review) {
            return response()->json(['message' => 'Отзыв по этой заявке уже оставлен.'], 422);
        }

        $rating = (int) round($request->input('rating') * 2); // 0.5–5 -> 1–10
        $rating = max(1, min(10, $rating));

        $review = Review::create([
            'request_id'   => $req->id,
            'client_id'    => $user->id,
            'lawyer_id'    => $req->lawyer_id,
            'rating'       => $rating,
            'message'      => $request->input('message'),
            'is_anonymous' => (bool) $request->boolean('is_anonymous'),
            'status'       => Review::STATUS_PUBLISHED,
        ]);

        $review->load(['lawyer', 'client']);
        $payload = [
            'id'           => $review->id,
            'request_id'   => $review->request_id,
            'rating'       => $review->rating / 2,
            'message'      => $review->message,
            'is_anonymous' => $review->is_anonymous,
            'created_at'   => $review->created_at?->toIso8601String(),
            'lawyer'       => $review->lawyer ? ['id' => $review->lawyer->id, 'full_name' => $review->lawyer->full_name] : null,
        ];
        return response()->json(['data' => $payload], 201);
    }
}