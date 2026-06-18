<?php

namespace App\Models;

use App\Enums\Chat\MessageType;
use App\Events\MessageCreated;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    protected static function booted(): void
    {
        static::created(function (Message $message): void {
            $message->conversation?->touch();
            if (config('broadcasting.default') === 'null') {
                return;
            }

            $messageId = $message->id;
            dispatch(function () use ($messageId): void {
                try {
                    $fresh = self::query()->find($messageId);
                    if (!$fresh) {
                        return;
                    }
                    broadcast(new MessageCreated($fresh));
                } catch (\Throwable $e) {
                    report($e);
                }
            })->afterResponse();
        });
    }

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'reply_to_message_id',
        'type',
        'content',
        'is_read',
    ];

    protected $casts = [
        'type' => MessageType::class,
        'is_read' => 'boolean',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reply_to_message_id');
    }
}
