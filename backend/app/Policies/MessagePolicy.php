<?php

namespace App\Policies;

use App\Enums\Chat\MessageType;
use App\Models\Message;
use App\Models\User;

class MessagePolicy
{
    public function update(User $user, Message $message): bool
    {
        if ($message->sender_id !== $user->id) {
            return false;
        }

        if ($message->type !== MessageType::Text) {
            return false;
        }

        $conversation = $message->conversation;

        return $conversation ? $user->can('sendMessage', $conversation) : false;
    }

    public function delete(User $user, Message $message): bool
    {
        if ($message->sender_id !== $user->id) {
            return false;
        }

        $conversation = $message->conversation;

        return $conversation ? $user->can('view', $conversation) : false;
    }
}
