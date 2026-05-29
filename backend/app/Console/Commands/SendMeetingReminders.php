<?php

namespace App\Console\Commands;

use App\Enums\Meeting\MeetingStatus;
use App\Enums\NotificationType;
use App\Models\Meeting;
use App\Services\Notification\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendMeetingReminders extends Command
{
    protected $signature = 'meetings:send-reminders';

    protected $description = 'Напоминания о консультациях (за 3 дня и в день встречи)';

    public function handle(NotificationService $notifications): int
    {
        $now = now()->utc();
        $inThreeDays = $now->copy()->addDays(3);
        $dayStart = $now->copy()->startOfDay();
        $dayEnd = $now->copy()->endOfDay();

        $active = Meeting::query()
            ->whereIn('status', [MeetingStatus::Pending->value, MeetingStatus::Confirmed->value])
            ->with(['request.client', 'responsibleLawyer']);

        foreach ((clone $active)->whereBetween('start_at', [
            $inThreeDays->copy()->startOfDay(),
            $inThreeDays->copy()->endOfDay(),
        ])->get() as $meeting) {
            $notifications->notifyMeetingReminder(
                $meeting,
                NotificationType::MeetingReminder3Days,
                'Напоминание о консультации',
                'Через 3 дня: '.$meeting->title.' ('.$meeting->formatted_date.')',
            );
        }

        foreach ((clone $active)->whereBetween('start_at', [$dayStart, $dayEnd])->get() as $meeting) {
            $notifications->notifyMeetingReminder(
                $meeting,
                NotificationType::MeetingReminderDay,
                'Консультация сегодня',
                'Сегодня в '.$meeting->start_at->timezone(config('app.timezone'))->format('H:i').': '.$meeting->title,
            );
        }

        $this->info('Done.');

        return self::SUCCESS;
    }
}
