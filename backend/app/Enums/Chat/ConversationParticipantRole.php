<?php

namespace App\Enums\Chat;

enum ConversationParticipantRole: string
{
    case Client = 'client';
    case ResponsibleLawyer = 'responsible_lawyer';
    case Lawyer = 'lawyer';
}
