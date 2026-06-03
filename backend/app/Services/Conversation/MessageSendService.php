<?php

namespace App\Services\Conversation;

use App\Enums\Chat\MessageType;
use App\Models\Attachment;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MessageSendService
{
    private const ALLOWED_IMAGE = ['image/jpeg', 'image/png'];

    private const MIME_EXTENSIONS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'application/pdf' => 'pdf',
        'application/msword' => 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
    ];

    private const ALLOWED_FILE = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    private function extensionForMime(string $mime): string
    {
        return self::MIME_EXTENSIONS[$mime] ?? 'bin';
    }
    
    public function send(
        Conversation $conversation,
        User $sender,
        string $type,
        ?string $content,
        ?UploadedFile $file,
        ?int $replyToMessageId = null,
    ): Message
    {
        return DB::transaction(function () use ($conversation, $sender, $type, $content, $file, $replyToMessageId) {
            $messageType = MessageType::from($type);

            if ($messageType === MessageType::Text) {
                return Message::query()->create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $sender->id,
                    'reply_to_message_id' => $replyToMessageId,
                    'type' => MessageType::Text,
                    'content' => trim((string) $content),
                    'is_read' => false,
                ]);
            }

            $mime = $file->getMimeType() ?: '';
            if ($messageType === MessageType::Image) {
                if (!in_array($mime, self::ALLOWED_IMAGE, true)) {
                    throw ValidationException::withMessages(['file' => ['Допустимы только JPG и PNG.']]);
                }
            } else {
                if (!in_array($mime, self::ALLOWED_FILE, true)) {
                    throw ValidationException::withMessages(['file' => ['Допустимы только PDF, DOC и DOCX.']]);
                }
            }

            $ext = $this->extensionForMime($mime);
            $safeName = Str::uuid()->toString().'.'.$ext;
            $relativePath = 'chat/'.$safeName;
            $file->storeAs('chat', $safeName, 'public');

            $message = Message::query()->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $sender->id,
                'reply_to_message_id' => $replyToMessageId,
                'type' => $messageType,
                'content' => $content ? trim($content) : null,
                'is_read' => false,
            ]);

            Attachment::query()->create([
                'message_id' => $message->id,
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $relativePath,
                'mime_type' => $mime,
                'file_size' => $file->getSize(),
            ]);

            return $message->fresh(['attachments']);
        });
    }
}
