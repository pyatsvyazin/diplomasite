<?php

namespace App\Http\Controllers\Api;

use App\Enums\Chat\MessageType;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Request as ClientRequestModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $types = [MessageType::Text->value, MessageType::Image->value, MessageType::File->value];

        $items = Conversation::query()
            ->whereHas('participantRecords', fn ($q) => $q->where('user_id', $user->id))
            ->with([
                'request:id,status,subject,client_id,lawyer_id',
                'lastMessage.sender:id,full_name',
                'lastMessage.replyTo:id,type,content,sender_id',
                'lastMessage.replyTo.sender:id,full_name',
            ])
            ->withCount([
                'messages as unread_count' => function ($q) use ($user, $types) {
                    $q->where('sender_id', '!=', $user->id)
                        ->whereNotNull('sender_id')
                        ->where('is_read', false)
                        ->whereIn('type', $types);
                },
            ])
            ->orderByDesc('updated_at')
            ->get();

        return response()->json(['data' => $items]);
    }

    public function show(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $conversation->load([
            'request:id,status,subject,client_id,lawyer_id',
            'participantRecords.user:id,full_name,email',
            'lastMessage.sender:id,full_name',
            'lastMessage.replyTo:id,type,content,sender_id',
            'lastMessage.replyTo.sender:id,full_name',
        ]);

        return response()->json([
            'data' => $conversation,
            'meta' => [
                'can_send_messages' => $request->user()->can('sendMessage', $conversation),
            ],
        ]);
    }

    /**
     * Чат по ID заявки (удобный вход с экрана заявки).
     */
    public function showForRequest(Request $httpRequest, ClientRequestModel $request): JsonResponse
    {
        $conversation = $request->conversation;
        if (!$conversation) {
            return response()->json(['message' => 'Чат для этой заявки не найден.'], 404);
        }

        $this->authorize('view', $conversation);

        return $this->show($httpRequest, $conversation);
    }

    public function markRead(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('markRead', $conversation);

        $user = $request->user();
        $types = [MessageType::Text->value, MessageType::Image->value, MessageType::File->value];

        Message::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $user->id)
            ->whereNotNull('sender_id')
            ->where('is_read', false)
            ->whereIn('type', $types)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Отмечено как прочитанное.']);
    }
}
