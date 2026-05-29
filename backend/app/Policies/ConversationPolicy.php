<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\Request as ClientRequest;
use App\Models\User;

class ConversationPolicy
{
    public function view(User $user, Conversation $conversation): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $this->isParticipant($user, $conversation);
    }

    public function sendMessage(User $user, Conversation $conversation): bool
    {
        if (!$this->isParticipant($user, $conversation)) {
            return false;
        }

        $request = $conversation->request;
        if (!$request) {
            return false;
        }

        return !in_array($request->status, [ClientRequest::STATUS_CLOSED, ClientRequest::STATUS_REJECTED], true);
    }

    public function markRead(User $user, Conversation $conversation): bool
    {
        return $this->isParticipant($user, $conversation);
    }

    private function isAdmin(User $user): bool
    {
        return $user->roles()->where('name', 'admin')->exists();
    }

    private function isParticipant(User $user, Conversation $conversation): bool
    {
        return $conversation->participantRecords()
            ->where('user_id', $user->id)
            ->exists();
    }
}
