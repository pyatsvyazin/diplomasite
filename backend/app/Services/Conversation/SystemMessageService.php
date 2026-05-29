<?php

namespace App\Services\Conversation;

use App\Enums\Chat\MessageType;
use App\Models\Conversation;
use App\Models\Message;

class SystemMessageService
{
    public function create(Conversation $conversation, string $content): Message
    {
        return Message::query()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => null,
            'type' => MessageType::System,
            'content' => $content,
            'is_read' => true,
        ]);
    }
}
