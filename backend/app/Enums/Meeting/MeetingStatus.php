<?php

namespace App\Enums\Meeting;

enum MeetingStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Cancelled = 'cancelled';
    case Completed = 'completed';

    public function labelRu(): string
    {
        return match ($this) {
            self::Pending => 'Ожидает подтверждения',
            self::Confirmed => 'Подтверждена',
            self::Cancelled => 'Отменена',
            self::Completed => 'Завершена',
        };
    }
}
