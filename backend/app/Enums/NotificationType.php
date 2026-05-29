<?php

namespace App\Enums;

enum NotificationType: string
{
    case RequestStatusChanged = 'request_status_changed';
    case MeetingCreated = 'meeting_created';
    case MeetingConfirmed = 'meeting_confirmed';
    case MeetingCancelled = 'meeting_cancelled';
    case MeetingRescheduled = 'meeting_rescheduled';
    case MeetingCompleted = 'meeting_completed';
    case MeetingReminder3Days = 'meeting_reminder_3d';
    case MeetingReminderDay = 'meeting_reminder_day';
}
