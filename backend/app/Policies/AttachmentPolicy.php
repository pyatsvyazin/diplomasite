<?php

namespace App\Policies;

use App\Models\Attachment;
use App\Models\User;

class AttachmentPolicy
{
    public function download(User $user, Attachment $attachment): bool
    {
        if ($user->roles()->where('name', 'admin')->exists()) {
            return true;
        }

        $message = $attachment->message;
        if (!$message) {
            return false;
        }

        $conversation = $message->conversation;
        if (!$conversation) {
            return false;
        }

        return $conversation->participantRecords()
            ->where('user_id', $user->id)
            ->exists();
    }
}
