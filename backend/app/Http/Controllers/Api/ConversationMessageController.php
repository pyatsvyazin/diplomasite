<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Conversation\StoreMessageRequest;
use App\Http\Requests\Conversation\UpdateMessageRequest;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\Conversation\MessageSendService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ConversationMessageController extends Controller
{
    public function __construct(
        private MessageSendService $messageSend,
    ) {
    }

    public function index(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $messages = Message::query()
            ->where('conversation_id', $conversation->id)
            ->with(['sender:id,full_name,avatar_path', 'attachments', 'replyTo.sender:id,full_name,avatar_path', 'replyTo.attachments'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate((int) $request->query('per_page', 30));

        return response()->json($messages);
    }

    public function store(StoreMessageRequest $request, Conversation $conversation): JsonResponse
    {
        $message = $this->messageSend->send(
            $conversation,
            $request->user(),
            $request->input('type'),
            $request->input('content'),
            $request->file('file'),
            $request->integer('reply_to_message_id') ?: null,
        );

        $message->load(['sender:id,full_name,avatar_path', 'attachments', 'replyTo.sender:id,full_name,avatar_path', 'replyTo.attachments']);

        return response()->json(['data' => $message], 201);
    }

    public function update(UpdateMessageRequest $request, Conversation $conversation, Message $message): JsonResponse
    {
        $message = $this->resolveConversationMessage($conversation, $message);
        $this->authorize('update', $message);

        $message->content = trim((string) $request->input('content'));
        $message->save();
        $message->load(['sender:id,full_name,avatar_path', 'attachments', 'replyTo.sender:id,full_name,avatar_path', 'replyTo.attachments']);

        return response()->json(['data' => $message]);
    }

    public function destroy(Request $request, Conversation $conversation, Message $message): JsonResponse
    {
        $message = $this->resolveConversationMessage($conversation, $message);
        $this->authorize('delete', $message);

        $attachments = $message->attachments()->get();
        foreach ($attachments as $attachment) {
            if (!empty($attachment->file_path)) {
                Storage::disk('public')->delete($attachment->file_path);
            }
        }
        $message->attachments()->delete();
        $message->delete();

        return response()->json(['message' => 'Сообщение удалено.']);
    }

    private function resolveConversationMessage(Conversation $conversation, Message $message): Message
    {
        abort_unless((int) $message->conversation_id === (int) $conversation->id, 404);

        return $message;
    }
}
