<?php

namespace Database\Seeders;

use App\Models\Request;
use App\Models\Review;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $messages = [
            'Грамотное сопровождение дела, всё объяснили доступным языком. Рекомендую.',
            'Обратилась по жилищному вопросу — помогли быстро, без лишней бюрократии. Спасибо!',
            'Профессиональный подход и внимательность к деталям. Итог положительный.',
            'Долго выбирала юриста, не пожалела. На связи были практически всегда.',
            'Чётко по срокам и по договору. Цена соответствует качеству.',
            'Помогли в сложной ситуации с наследством. Очень благодарна за поддержку.',
            'Консультация была содержательной, дальше сотрудничали по делу — всё устроило.',
            'Юрист вёл переговоры грамотно, удалось договориться без суда.',
            'Отзывчивый специалист, документы подготовили в срок. Рекомендую коллегам.',
            'Ранее не доверяла юристам, здесь изменила мнение. Прозрачно и по делу.',
            'Хорошая работа по корпоративному блоку для нашего ИП. Продолжим сотрудничество.',
            'Помогли с трудовым спором — восстановили на работе и компенсацию получили.',
        ];

        $anonymousFlags = [false, false, true, false, false, true, false, false, false, true, false, false];
        $ratings = [8, 10, 7, 9, 10, 8, 6, 9, 10, 8, 9, 7];

        $closedRequests = Request::query()
            ->where('status', Request::STATUS_CLOSED)
            ->whereNotNull('client_id')
            ->whereNotNull('lawyer_id')
            ->doesntHave('review')
            ->orderBy('id')
            ->get();

        if ($closedRequests->isEmpty()) {
            $this->command?->warn('ReviewSeeder: нет закрытых заявок без отзыва.');
            return;
        }

        foreach ($closedRequests as $i => $request) {
            $review = Review::query()->updateOrCreate(
                ['request_id' => $request->id],
                [
                    'client_id' => $request->client_id,
                    'lawyer_id' => $request->lawyer_id,
                    'rating' => $ratings[$i % count($ratings)],
                    'message' => $messages[$i % count($messages)],
                    'is_anonymous' => $anonymousFlags[$i % count($anonymousFlags)],
                    'status' => Review::STATUS_PUBLISHED,
                ]
            );

            $at = $request->updated_at ?: now()->subDays(5);
            $review->forceFill(['created_at' => $at, 'updated_at' => $at])->saveQuietly();
        }
    }
}
