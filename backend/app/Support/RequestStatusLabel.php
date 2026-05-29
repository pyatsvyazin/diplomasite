<?php

namespace App\Support;

use App\Models\Request as ClientRequest;

final class RequestStatusLabel
{
    public static function ru(string $status): string
    {
        return match ($status) {
            ClientRequest::STATUS_NEW => 'Новая',
            ClientRequest::STATUS_REVIEWING => 'На рассмотрении',
            ClientRequest::STATUS_IN_PROGRESS => 'В работе',
            ClientRequest::STATUS_CLOSED => 'Закрыта',
            ClientRequest::STATUS_REJECTED => 'Отклонена',
            default => $status,
        };
    }
}
