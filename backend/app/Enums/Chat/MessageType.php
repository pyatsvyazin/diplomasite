<?php

namespace App\Enums\Chat;

enum MessageType: string
{
    case Text = 'text';
    case Image = 'image';
    case File = 'file';
    case System = 'system';
}
