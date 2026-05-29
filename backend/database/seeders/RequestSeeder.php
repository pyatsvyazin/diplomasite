<?php

namespace Database\Seeders;

use App\Models\Request;
use App\Models\User;
use Illuminate\Database\Seeder;

class RequestSeeder extends Seeder
{
    public function run(): void
    {
        $clients = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'client'))
            ->orderBy('id')
            ->get();

        $lawyers = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'lawyer'))
            ->orderBy('id')
            ->get();

        if ($clients->isEmpty()) {
            $this->command?->warn('RequestSeeder: клиенты не найдены, заявки не созданы.');
            return;
        }

        $rows = [
            [
                'subject' => 'Консультация по наследству',
                'message' => 'Нужно разобраться с порядком вступления в наследство и сроками подачи документов.',
                'status' => Request::STATUS_NEW,
                'assign_lawyer' => false,
                'days_ago' => 2,
            ],
            [
                'subject' => 'Спор с работодателем',
                'message' => 'Работодатель задерживает выплату и не оформляет переработки. Нужна правовая оценка.',
                'status' => Request::STATUS_REVIEWING,
                'assign_lawyer' => false,
                'days_ago' => 4,
            ],
            [
                'subject' => 'Проверка договора аренды',
                'message' => 'Перед подписанием хочу проверить договор аренды помещения для бизнеса.',
                'status' => Request::STATUS_IN_PROGRESS,
                'assign_lawyer' => true,
                'days_ago' => 6,
            ],
            [
                'subject' => 'Защита прав потребителя',
                'message' => 'Магазин отказал в возврате товара с дефектом, требуется подготовка претензии.',
                'status' => Request::STATUS_IN_PROGRESS,
                'assign_lawyer' => true,
                'days_ago' => 9,
            ],
            [
                'subject' => 'Оформление брачного договора',
                'message' => 'Нужна консультация и подготовка брачного договора с учетом имущества сторон.',
                'status' => Request::STATUS_CLOSED,
                'assign_lawyer' => true,
                'days_ago' => 14,
            ],
            [
                'subject' => 'Оспаривание штрафа ГИБДД',
                'message' => 'Хочу оспорить штраф, так как нарушение зафиксировано с ошибками в материалах.',
                'status' => Request::STATUS_CLOSED,
                'assign_lawyer' => true,
                'days_ago' => 18,
            ],
            [
                'subject' => 'Регистрация ИП',
                'message' => 'Нужна помощь с выбором ОКВЭД и подготовкой пакета документов для регистрации.',
                'status' => Request::STATUS_CLOSED,
                'assign_lawyer' => true,
                'days_ago' => 23,
            ],
            [
                'subject' => 'Спор с управляющей компанией',
                'message' => 'УК не реагирует на обращения, требуется юридическое сопровождение и претензия.',
                'status' => Request::STATUS_REJECTED,
                'assign_lawyer' => false,
                'days_ago' => 11,
            ],
            [
                'subject' => 'Взыскание долга по расписке',
                'message' => 'Должник не возвращает средства по расписке, нужно подготовить досудебную претензию.',
                'status' => Request::STATUS_NEW,
                'assign_lawyer' => false,
                'days_ago' => 1,
            ],
            [
                'subject' => 'Проверка договора поставки',
                'message' => 'Просьба проверить договор поставки перед подписанием и выделить рисковые пункты.',
                'status' => Request::STATUS_REVIEWING,
                'assign_lawyer' => false,
                'days_ago' => 3,
            ],
            [
                'subject' => 'Сопровождение сделки купли-продажи квартиры',
                'message' => 'Нужно сопровождение сделки и проверка юридической чистоты объекта.',
                'status' => Request::STATUS_IN_PROGRESS,
                'assign_lawyer' => true,
                'days_ago' => 5,
            ],
            [
                'subject' => 'Составление искового заявления',
                'message' => 'Требуется подготовить иск по гражданскому спору и сформировать пакет приложений.',
                'status' => Request::STATUS_IN_PROGRESS,
                'assign_lawyer' => true,
                'days_ago' => 7,
            ],
            [
                'subject' => 'Раздел совместно нажитого имущества',
                'message' => 'Нужна консультация и подготовка позиции по разделу имущества после развода.',
                'status' => Request::STATUS_CLOSED,
                'assign_lawyer' => true,
                'days_ago' => 16,
            ],
            [
                'subject' => 'Защита по административному делу',
                'message' => 'Необходима помощь по административному протоколу и представительство в суде.',
                'status' => Request::STATUS_CLOSED,
                'assign_lawyer' => true,
                'days_ago' => 20,
            ],
            [
                'subject' => 'Оформление претензии к застройщику',
                'message' => 'Нужно подготовить претензию из-за нарушения сроков передачи квартиры.',
                'status' => Request::STATUS_CLOSED,
                'assign_lawyer' => true,
                'days_ago' => 24,
            ],
            [
                'subject' => 'Снижение кадастровой стоимости',
                'message' => 'Хотим снизить кадастровую стоимость объекта для пересмотра налоговой базы.',
                'status' => Request::STATUS_CLOSED,
                'assign_lawyer' => true,
                'days_ago' => 27,
            ],
            [
                'subject' => 'Спор по качеству оказанных услуг',
                'message' => 'Исполнитель нарушил условия договора, требуется правовая оценка и дальнейшие шаги.',
                'status' => Request::STATUS_CLOSED,
                'assign_lawyer' => true,
                'days_ago' => 30,
            ],
            [
                'subject' => 'Оспаривание отказа в страховой выплате',
                'message' => 'Страховая отказала в выплате, нужно проверить основания и подготовить позицию.',
                'status' => Request::STATUS_REJECTED,
                'assign_lawyer' => false,
                'days_ago' => 12,
            ],
        ];

        $clientCount = $clients->count();
        $lawyerCount = max(1, $lawyers->count());

        foreach ($rows as $i => $row) {
            $client = $clients[$i % $clientCount];
            $lawyer = ($row['assign_lawyer'] && $lawyers->isNotEmpty())
                ? $lawyers[$i % $lawyerCount]
                : null;

            $request = Request::query()->updateOrCreate(
                [
                    'subject' => $row['subject'],
                    'message' => $row['message'],
                ],
                [
                    'client_id' => $client->id,
                    'lawyer_id' => $lawyer?->id,
                    'name' => $client->full_name,
                    'email' => $client->email,
                    'phone' => $client->phone,
                    'status' => $row['status'],
                ]
            );

            $at = now()->subDays($row['days_ago']);
            $request->forceFill(['created_at' => $at, 'updated_at' => $at])->saveQuietly();
        }
    }
}
