<?php

namespace App\Models;

use App\Enums\Chat\ConversationParticipantRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationParticipant extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'role',
    ];

    protected $casts = [
        'role' => ConversationParticipantRole::class,
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (ConversationParticipant $model): void {
            if ($model->created_at === null) {
                $model->created_at = now();
            }
        });
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
