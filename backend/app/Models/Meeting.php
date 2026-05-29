<?php

namespace App\Models;

use App\Enums\Meeting\MeetingStatus;
use App\Enums\Meeting\MeetingType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Meeting extends Model
{
    protected $fillable = [
        'request_id',
        'conversation_id',
        'created_by',
        'responsible_lawyer_id',
        'title',
        'description',
        'meeting_type',
        'status',
        'start_at',
        'end_at',
        'location',
        'meeting_link',
        'cancellation_reason',
        'confirmed_by_client',
    ];

    protected $casts = [
        'meeting_type' => MeetingType::class,
        'status' => MeetingStatus::class,
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'confirmed_by_client' => 'boolean',
    ];

    protected $appends = [
        'formatted_date',
        'formatted_status',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(Request::class);
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function responsibleLawyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsible_lawyer_id');
    }

    public function getFormattedDateAttribute(): string
    {
        if (!$this->start_at) {
            return '';
        }

        return $this->start_at->timezone(config('app.timezone', 'UTC'))
            ->locale('ru')
            ->translatedFormat('d.m.Y H:i');
    }

    public function getFormattedStatusAttribute(): string
    {
        $status = $this->status instanceof MeetingStatus
            ? $this->status
            : MeetingStatus::tryFrom((string) ($this->attributes['status'] ?? ''));

        return $status?->labelRu() ?? (string) ($this->attributes['status'] ?? '');
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query
            ->whereIn('status', [MeetingStatus::Pending->value, MeetingStatus::Confirmed->value])
            ->where('start_at', '>=', now());
    }

    public function scopeOrderedByStart(Builder $query): Builder
    {
        return $query->orderBy('start_at');
    }

    public function scopeForMonth(Builder $query, int $year, int $month): Builder
    {
        $start = now()->setTimezone('UTC')->setDate($year, $month, 1)->startOfMonth();
        $end = (clone $start)->endOfMonth();

        return $query->where('start_at', '<=', $end)->where('end_at', '>=', $start);
    }
}
