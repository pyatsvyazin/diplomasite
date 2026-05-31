<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $onlyUnread = $request->boolean('unread');

        $q = Notification::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at');

        if ($onlyUnread) {
            $q->whereNull('read_at');
        }

        $limit = min(50, max(1, (int) $request->query('limit', 15)));
        $offset = max(0, (int) $request->query('offset', 0));

        $total = (clone $q)->count();
        $items = (clone $q)->offset($offset)->limit($limit)->get();
        $loaded = $offset + $items->count();

        $unreadCount = Notification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'data' => $items,
            'meta' => [
                'unread_count' => $unreadCount,
                'total' => $total,
                'offset' => $offset,
                'limit' => $limit,
                'has_more' => $loaded < $total,
            ],
        ]);
    }

    public function markRead(Request $request, Notification $notification): JsonResponse
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Доступ запрещён.'], 403);
        }

        if (!$notification->read_at) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json(['data' => $notification->fresh()]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        Notification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'ok']);
    }
}
