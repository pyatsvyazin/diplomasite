<?php

namespace Database\Seeders;

use App\Enums\Meeting\MeetingStatus;
use App\Enums\Meeting\MeetingType;
use App\Models\Meeting;
use App\Models\Request as ClientRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class MeetingSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'admin'))
            ->value('id');

        $requests = ClientRequest::query()
            ->whereNotNull('lawyer_id')
            ->with('conversation')
            ->whereHas('conversation')
            ->orderBy('id')
            ->get();

        if ($requests->isEmpty()) {
            $this->command?->warn('MeetingSeeder: нет заявок с юристом и чатом.');

            return;
        }

        $templates = $this->meetingTemplates();
        $created = 0;

        foreach ($templates as $i => $tpl) {
            $request = $requests[$i % $requests->count()];
            $conversation = $request->conversation;
            if (!$conversation) {
                continue;
            }

            $start = $this->resolveStartAt($tpl);
            $end = (clone $start)->addMinutes($tpl['duration'] ?? 60);

            $meeting = Meeting::query()->updateOrCreate(
                [
                    'request_id' => $request->id,
                    'title' => $tpl['title'],
                ],
                [
                    'conversation_id' => $conversation->id,
                    'created_by' => $adminId ?? $request->lawyer_id,
                    'responsible_lawyer_id' => $request->lawyer_id,
                    'description' => $tpl['description'] ?? null,
                    'meeting_type' => $tpl['online'] ? MeetingType::Online : MeetingType::Offline,
                    'status' => $tpl['status'],
                    'start_at' => $start,
                    'end_at' => $end,
                    'location' => $tpl['online'] ? null : ($tpl['location'] ?? 'Офис, ул. Примерная, 10'),
                    'meeting_link' => $tpl['online'] ? ($tpl['link'] ?? 'https://meet.example/room-demo') : null,
                    'cancellation_reason' => $tpl['status'] === MeetingStatus::Cancelled
                        ? ($tpl['cancel_reason'] ?? 'Перенос по инициативе клиента')
                        : null,
                    'confirmed_by_client' => in_array($tpl['status'], [
                        MeetingStatus::Confirmed,
                        MeetingStatus::Completed,
                    ], true),
                ]
            );

            $meeting->forceFill([
                'created_at' => $start->copy()->subDays(2),
                'updated_at' => $start->copy()->subHours(1),
            ])->saveQuietly();

            $created++;
        }

        $this->command?->info("MeetingSeeder: консультаций — {$created}.");
    }

    private function resolveStartAt(array $tpl): Carbon
    {
        if (isset($tpl['day_of_month'])) {
            $day = min($tpl['day_of_month'], now()->daysInMonth);

            return now()->startOfMonth()->addDays($day - 1)->setTime(
                $tpl['hour'] ?? 11,
                $tpl['minute'] ?? 0,
            );
        }

        if (isset($tpl['days_from_now'])) {
            return now()->addDays($tpl['days_from_now'])->setTime($tpl['hour'] ?? 14, $tpl['minute'] ?? 30);
        }

        if (isset($tpl['days_ago'])) {
            return now()->subDays($tpl['days_ago'])->setTime($tpl['hour'] ?? 10, $tpl['minute'] ?? 0);
        }

        return now()->addDays(3)->setTime(12, 0);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function meetingTemplates(): array
    {
        return [
            // Текущий месяц — календарь аналитики
            ['title' => 'Первичная консультация', 'status' => MeetingStatus::Confirmed, 'day_of_month' => 3, 'hour' => 10, 'online' => true],
            ['title' => 'Разбор документов по делу', 'status' => MeetingStatus::Pending, 'day_of_month' => 5, 'hour' => 14, 'online' => false, 'location' => 'Кабинет 204'],
            ['title' => 'Согласование позиции перед судом', 'status' => MeetingStatus::Confirmed, 'day_of_month' => 7, 'hour' => 11, 'online' => true],
            ['title' => 'Встреча с клиентом (очно)', 'status' => MeetingStatus::Completed, 'day_of_month' => 2, 'hour' => 15, 'online' => false],
            ['title' => 'Консультация по договору', 'status' => MeetingStatus::Cancelled, 'day_of_month' => 9, 'hour' => 16, 'online' => true, 'cancel_reason' => 'Клиент перенёс на другую дату'],
            ['title' => 'Повторная консультация', 'status' => MeetingStatus::Confirmed, 'day_of_month' => 12, 'hour' => 9, 'online' => true],
            ['title' => 'Подписание соглашения', 'status' => MeetingStatus::Pending, 'day_of_month' => 14, 'hour' => 13, 'online' => false],
            ['title' => 'Онлайн-бриф по претензии', 'status' => MeetingStatus::Completed, 'day_of_month' => 6, 'hour' => 17, 'online' => true],
            ['title' => 'Статус по заявке', 'status' => MeetingStatus::Confirmed, 'day_of_month' => 18, 'hour' => 10, 'online' => true],
            ['title' => 'Заключительная встреча', 'status' => MeetingStatus::Completed, 'day_of_month' => 20, 'hour' => 12, 'online' => false],
            ['title' => 'Консультация по наследству', 'status' => MeetingStatus::Pending, 'day_of_month' => 22, 'hour' => 11, 'online' => true],
            ['title' => 'Созвон с юристом', 'status' => MeetingStatus::Confirmed, 'day_of_month' => 25, 'hour' => 15, 'online' => true],
            // Просроченные (ожидает + время в прошлом)
            ['title' => 'Консультация (просрочена)', 'status' => MeetingStatus::Pending, 'days_ago' => 4, 'hour' => 9, 'online' => true],
            ['title' => 'Очный приём (просрочен)', 'status' => MeetingStatus::Pending, 'days_ago' => 2, 'hour' => 14, 'online' => false],
            ['title' => 'Созвон — не подтверждён', 'status' => MeetingStatus::Pending, 'days_ago' => 1, 'hour' => 16, 'online' => true],
            // Будущие подтверждённые
            ['title' => 'Консультация на следующей неделе', 'status' => MeetingStatus::Confirmed, 'days_from_now' => 5, 'hour' => 11, 'online' => true],
            ['title' => 'Встреча в офисе', 'status' => MeetingStatus::Confirmed, 'days_from_now' => 8, 'hour' => 14, 'online' => false],
            // Прошлые завершённые / отменённые
            ['title' => 'Вводная консультация', 'status' => MeetingStatus::Completed, 'days_ago' => 12, 'hour' => 10, 'online' => true],
            ['title' => 'Разбор исковых требований', 'status' => MeetingStatus::Completed, 'days_ago' => 18, 'hour' => 13, 'online' => false],
            ['title' => 'Консультация отменена', 'status' => MeetingStatus::Cancelled, 'days_ago' => 8, 'hour' => 11, 'online' => true, 'cancel_reason' => 'Неактуально после соглашения сторон'],
            ['title' => 'Онлайн-встреча (завершена)', 'status' => MeetingStatus::Completed, 'days_ago' => 25, 'hour' => 15, 'online' => true],
            ['title' => 'Представление интересов', 'status' => MeetingStatus::Completed, 'days_ago' => 35, 'hour' => 10, 'online' => false],
            ['title' => 'Согласование медиативного соглашения', 'status' => MeetingStatus::Cancelled, 'days_ago' => 20, 'hour' => 12, 'online' => true],
            ['title' => 'Консультация по трудовому спору', 'status' => MeetingStatus::Completed, 'days_ago' => 42, 'hour' => 9, 'online' => true],
            ['title' => 'Финальный созвон', 'status' => MeetingStatus::Confirmed, 'days_from_now' => 12, 'hour' => 16, 'online' => true],
        ];
    }
}
