<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Models\Conversation;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ConversationAttachmentController extends Controller
{
    public function download(Conversation $conversation, Attachment $attachment): StreamedResponse
    {
        $this->authorize('download', $attachment);

        $message = $attachment->message;
        if (!$message || $message->conversation_id !== $conversation->id) {
            abort(404);
        }

        $disk = Storage::disk('public');
        if (!$disk->exists($attachment->file_path)) {
            abort(404);
        }

        return $disk->response($attachment->file_path, $attachment->file_name, [
            'Content-Type' => $attachment->mime_type,
        ]);
    }
}
