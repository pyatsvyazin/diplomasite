<?php

namespace Database\Seeders;

use App\Models\ActivityEvent;
use App\Models\Request as ClientRequest;
use App\Models\User;
use Illuminate\Database\Seeder;

class ActivityEventSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'admin'))
            ->first();

        if (!$admin) {
            $this->command?->warn('ActivityEventSeeder: админ не найден.');

            return;
        }

        $lawyer = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'lawyer'))
            ->orderBy('id')
            ->first();

        $request = ClientRequest::query()->orderBy('id')->first();

        $rows = [
            ['event_type' => 'user_registered', 'summary' => 'Зарегистрирован пользователь Петрова Анна Сергеевна', 'entity_type' => 'user', 'entity_id' => 3, 'days_ago' => 45],
            ['event_type' => 'post_created', 'summary' => 'Создана новость «Изменения в порядке подачи обращений в госорганы»', 'entity_type' => 'post', 'entity_id' => 1, 'days_ago' => 40],
            ['event_type' => 'request_status_changed', 'summary' => 'Заявка №1: статус изменён: Новая → На рассмотрении', 'entity_type' => 'request', 'entity_id' => 1, 'days_ago' => 38],
            ['event_type' => 'request_lawyer_assigned', 'summary' => 'Заявка №3: назначен юрист Смирнов Алексей Олегович', 'entity_type' => 'request', 'entity_id' => 3, 'days_ago' => 35],
            ['event_type' => 'request_status_changed', 'summary' => 'Заявка №3: статус изменён: На рассмотрении → В работе', 'entity_type' => 'request', 'entity_id' => 3, 'days_ago' => 34],
            ['event_type' => 'meeting_created', 'summary' => 'Консультация «Первичная консультация» назначена', 'entity_type' => 'meeting', 'entity_id' => 1, 'days_ago' => 30],
            ['event_type' => 'meeting_rescheduled', 'summary' => 'Консультация «Разбор документов» перенесена', 'entity_type' => 'meeting', 'entity_id' => 2, 'days_ago' => 28],
            ['event_type' => 'meeting_cancelled', 'summary' => 'Консультация «Консультация по договору» отменена', 'entity_type' => 'meeting', 'entity_id' => 5, 'days_ago' => 25],
            ['event_type' => 'meeting_completed', 'summary' => 'Консультация «Вводная консультация» завершена', 'entity_type' => 'meeting', 'entity_id' => 17, 'days_ago' => 22],
            ['event_type' => 'request_status_changed', 'summary' => 'Заявка №5: статус изменён: В работе → Закрыта', 'entity_type' => 'request', 'entity_id' => 5, 'days_ago' => 20],
            ['event_type' => 'post_updated', 'summary' => 'Изменена новость «Обновлены шаблоны договоров для малого бизнеса»', 'entity_type' => 'post', 'entity_id' => 3, 'days_ago' => 18],
            ['event_type' => 'user_role_changed', 'summary' => 'Пользователю Козлов Дмитрий Николаевич изменена роль: клиент → юрист', 'entity_type' => 'user', 'entity_id' => 5, 'days_ago' => 16],
            ['event_type' => 'user_blocked', 'summary' => 'Заблокирован пользователь Гость (демо)', 'entity_type' => 'user', 'entity_id' => 4, 'days_ago' => 14],
            ['event_type' => 'user_unblocked', 'summary' => 'Разблокирован пользователь Гость (демо)', 'entity_type' => 'user', 'entity_id' => 4, 'days_ago' => 13],
            ['event_type' => 'staff_updated', 'summary' => 'Обновлены данные сотрудника Кузнецова Мария Андреевна: телефон, email', 'entity_type' => 'user', 'entity_id' => 8, 'days_ago' => 12],
            ['event_type' => 'request_lawyer_unassigned', 'summary' => 'Заявка №8: юрист снят', 'entity_type' => 'request', 'entity_id' => 8, 'days_ago' => 10],
            ['event_type' => 'request_status_changed', 'summary' => 'Заявка №12: статус изменён: Новая → Отклонена', 'entity_type' => 'request', 'entity_id' => 12, 'days_ago' => 9],
            ['event_type' => 'post_status_changed', 'summary' => 'Статус поста изменён: черновик → опубликовано', 'entity_type' => 'post', 'entity_id' => 10, 'days_ago' => 7],
            ['event_type' => 'post_deleted', 'summary' => 'Удалён черновик «Устаревший анонс»', 'entity_type' => 'post', 'entity_id' => 99, 'days_ago' => 6],
            ['event_type' => 'meeting_created', 'summary' => 'Консультация «Созвон с юристом» назначена', 'entity_type' => 'meeting', 'entity_id' => 12, 'days_ago' => 4],
            ['event_type' => 'request_status_changed', 'summary' => 'Заявка №2: статус изменён: На рассмотрении → В работе', 'entity_type' => 'request', 'entity_id' => 2, 'days_ago' => 3],
            ['event_type' => 'post_created', 'summary' => 'Создана статья «Как подготовиться к судебному заседанию»', 'entity_type' => 'post', 'entity_id' => 15, 'days_ago' => 2],
            ['event_type' => 'request_status_changed', 'summary' => 'Заявка №1: статус изменён: Новая → Закрыта', 'entity_type' => 'request', 'entity_id' => 1, 'days_ago' => 1],
            ['event_type' => 'meeting_completed', 'summary' => 'Консультация «Онлайн-бриф» завершена', 'entity_type' => 'meeting', 'entity_id' => 8, 'days_ago' => 0],
        ];

        foreach ($rows as $row) {
            $at = now()->subDays($row['days_ago'])->subHours(random_int(0, 8));

            ActivityEvent::query()->create([
                'event_type' => $row['event_type'],
                'actor_id' => $admin->id,
                'actor_name' => $admin->full_name,
                'entity_type' => $row['entity_type'],
                'entity_id' => $row['entity_id'],
                'summary' => $row['summary'],
                'meta' => null,
                'created_at' => $at,
            ]);
        }

        if ($lawyer && $request) {
            ActivityEvent::query()->create([
                'event_type' => 'request_lawyer_assigned',
                'actor_id' => $lawyer->id,
                'actor_name' => $lawyer->full_name,
                'entity_type' => 'request',
                'entity_id' => $request->id,
                'summary' => "Заявка №{$request->id}: назначен юрист {$lawyer->full_name}",
                'created_at' => now()->subHours(2),
            ]);
        }

        $this->command?->info('ActivityEventSeeder: события для ленты аналитики созданы.');
    }
}
