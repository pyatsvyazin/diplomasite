<?php

namespace App\Enums\Meeting;

enum MeetingType: string
{
    case Offline = 'offline';
    case Online = 'online';
}
