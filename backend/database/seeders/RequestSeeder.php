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

        $clientCount = max(1, $clients->count());
        $lawyerCount = max(1, $lawyers->count());

        $rows = $this->rows();

        Request::withoutEvents(function () use ($rows, $clients, $lawyers, $clientCount, $lawyerCount) {
            foreach ($rows as $i => $row) {
                $client = ($row['guest'] ?? false)
                    ? null
                    : $clients[$i % $clientCount];

                $lawyer = ($row['assign_lawyer'] ?? false) && $lawyers->isNotEmpty()
                    ? $lawyers[$i % $lawyerCount]
                    : null;

                $request = Request::query()->updateOrCreate(
                    ['subject' => $row['subject']],
                    [
                        'message' => $row['message'],
                        'client_id' => $client?->id,
                        'lawyer_id' => $lawyer?->id,
                        'name' => $client?->full_name ?? ($row['guest_name'] ?? 'Гость'),
                        'email' => $client?->email ?? ($row['guest_email'] ?? 'guest.demo@example.com'),
                        'phone' => $client?->phone ?? ($row['guest_phone'] ?? '79990000999'),
                        'status' => $row['status'],
                    ]
                );

                $at = now()->subDays($row['days_ago']);
                $request->forceFill(['created_at' => $at, 'updated_at' => $at])->saveQuietly();
            }
        });

        $this->command?->info('RequestSeeder: заявок — '.count($rows).'.');
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function rows(): array
    {
        $s = Request::STATUS_NEW;
        $r = Request::STATUS_REVIEWING;
        $p = Request::STATUS_IN_PROGRESS;
        $c = Request::STATUS_CLOSED;
        $x = Request::STATUS_REJECTED;

        return [
            ['subject' => 'Консультация по наследству', 'message' => 'После смерти родственника нужно понять порядок вступления в наследство и сроки для подачи заявления нотариусу.', 'status' => $s, 'assign_lawyer' => false, 'days_ago' => 1],
            ['subject' => 'Взыскание долга по расписке', 'message' => 'Должник не возвращает сумму по расписке, требуется досудебная претензия и оценка перспектив иска.', 'status' => $s, 'assign_lawyer' => false, 'days_ago' => 2],
            ['subject' => 'Проверка договора поставки', 'message' => 'Перед подписанием нужно проверить договор поставки и выделить рисковые пункты по ответственности.', 'status' => $s, 'assign_lawyer' => false, 'days_ago' => 0],
            ['subject' => 'Спор с управляющей компанией', 'message' => 'УК не реагирует на обращения по протечке, нужна претензия и консультация по дальнейшим шагам.', 'status' => $s, 'assign_lawyer' => false, 'days_ago' => 3],
            ['subject' => 'Регистрация ИП (онлайн-заявка)', 'message' => 'Хочу открыть ИП, нужна помощь с выбором ОКВЭД и списком документов.', 'status' => $s, 'guest' => true, 'guest_name' => 'Орлов Сергей', 'guest_email' => 'guest.orlov@demo.ru', 'guest_phone' => '79991110001', 'days_ago' => 1],
            ['subject' => 'Вопрос по алиментам', 'message' => 'Нужна консультация по размеру алиментов и порядку взыскания задолженности.', 'status' => $s, 'assign_lawyer' => false, 'days_ago' => 4],
            ['subject' => 'Оспаривание штрафа ГИБДД', 'message' => 'Штраф выписан с ошибками в протоколе, интересует досудебное обжалование.', 'status' => $s, 'assign_lawyer' => false, 'days_ago' => 5],
            ['subject' => 'Защита прав потребителя', 'message' => 'Магазин отказал в возврате бракованного товара, нужна претензия и расчёт неустойки.', 'status' => $s, 'assign_lawyer' => false, 'days_ago' => 2],

            ['subject' => 'Спор с работодателем', 'message' => 'Работодатель задерживает зарплату и не оплачивает переработки, нужна правовая оценка.', 'status' => $r, 'assign_lawyer' => false, 'days_ago' => 4],
            ['subject' => 'Проверка договора аренды', 'message' => 'Собственник предлагает договор аренды помещения под офис — прошу проверить условия.', 'status' => $r, 'assign_lawyer' => false, 'days_ago' => 6],
            ['subject' => 'Снижение кадастровой стоимости', 'message' => 'Хотим подать заявление о пересмотре кадастровой стоимости коммерческого объекта.', 'status' => $r, 'assign_lawyer' => true, 'days_ago' => 7],
            ['subject' => 'Претензия к застройщику', 'message' => 'Нарушены сроки передачи квартиры по ДДУ, нужна претензия и расчёт неустойки.', 'status' => $r, 'assign_lawyer' => false, 'days_ago' => 8],
            ['subject' => 'Корпоративный спор учредителей', 'message' => 'Конфликт между учредителями ООО по выходу участника и оценке доли.', 'status' => $r, 'guest' => true, 'guest_name' => 'ООО «Вектор»', 'guest_email' => 'legal@vector-demo.ru', 'days_ago' => 5],
            ['subject' => 'Трудовой договор удалённо', 'message' => 'Нужно адаптировать трудовой договор под удалённую работу сотрудников.', 'status' => $r, 'assign_lawyer' => false, 'days_ago' => 9],

            ['subject' => 'Сопровождение сделки купли-продажи квартиры', 'message' => 'Покупка квартиры на вторичке — нужен чек-лист документов и сопровождение сделки.', 'status' => $p, 'assign_lawyer' => true, 'days_ago' => 10],
            ['subject' => 'Составление искового заявления', 'message' => 'Готовим иск по взысканию задолженности по договору подряда, нужен проект иска.', 'status' => $p, 'assign_lawyer' => true, 'days_ago' => 12],
            ['subject' => 'Проверка договора аренды (бизнес)', 'message' => 'Аренда торгового помещения, прошу проверить индексацию и условия расторжения.', 'status' => $p, 'assign_lawyer' => true, 'days_ago' => 14],
            ['subject' => 'Раздел совместно нажитого имущества', 'message' => 'После развода нужно разделить квартиру и автомобиль, интересует медиация или иск.', 'status' => $p, 'assign_lawyer' => true, 'days_ago' => 16],
            ['subject' => 'Защита по административному делу', 'message' => 'Привлекли по ст. 12.9 КоАП, нужна позиция и представительство.', 'status' => $p, 'assign_lawyer' => true, 'days_ago' => 18],
            ['subject' => 'Оформление брачного договора', 'message' => 'Планируем брак, хотим закрепить режим имущества брачным договором.', 'status' => $p, 'assign_lawyer' => true, 'days_ago' => 11],
            ['subject' => 'Спор с контрагентом по НДС', 'message' => 'Контрагент оспаривает выставленные счета-фактуры, нужна правовая позиция.', 'status' => $p, 'assign_lawyer' => true, 'days_ago' => 20],
            ['subject' => 'Взыскание неустойки по договору', 'message' => 'Подрядчик нарушил сроки, прошу подготовить претензию и расчёт неустойки.', 'status' => $p, 'assign_lawyer' => true, 'days_ago' => 22],
            ['subject' => 'Реструктуризация долгов ИП', 'message' => 'ИП не справляется с обязательствами, интересуют варианты реструктуризации.', 'status' => $p, 'assign_lawyer' => true, 'days_ago' => 15],
            ['subject' => 'Проверка оферты на сайте', 'message' => 'Интернет-магазин — нужно привести оферту и политику ПДн в порядок.', 'status' => $p, 'guest' => true, 'guest_name' => 'ИП Соколова', 'guest_email' => 'shop-sokolova@demo.ru', 'days_ago' => 13],

            ['subject' => 'Оформление брачного договора (закрыто)', 'message' => 'Подготовили и согласовали брачный договор, стороны подписали у нотариуса.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 25],
            ['subject' => 'Оспаривание штрафа ГИБДД (закрыто)', 'message' => 'Подали жалобу в ГИБДД, постановление отменено.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 28],
            ['subject' => 'Регистрация ИП (закрыто)', 'message' => 'ИП зарегистрировано, передан мемориальный пакет документов.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 32],
            ['subject' => 'Защита прав потребителя (закрыто)', 'message' => 'По претензии продавец вернул деньги и компенсировал расходы.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 35],
            ['subject' => 'Сопровождение сделки купли-продажи (закрыто)', 'message' => 'Сделка в Росреестре зарегистрирована, расчёты завершены.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 40],
            ['subject' => 'Раздел имущества супругов (закрыто)', 'message' => 'Подписано мировое соглашение, исполнено через нотариуса.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 45],
            ['subject' => 'Взыскание долга по расписке (закрыто)', 'message' => 'Долг взыскан во внесудебном порядке после претензии.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 50],
            ['subject' => 'Претензия к застройщику (закрыто)', 'message' => 'Застройщик выплатил неустойку, акт подписан.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 55],
            ['subject' => 'Трудовой спор (закрыто)', 'message' => 'Восстановлены выплаты по больничным, спор урегулирован.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 60],
            ['subject' => 'Оспаривание страховой выплаты (закрыто)', 'message' => 'Страховая выплатила сумму после досудебной претензии.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 65],
            ['subject' => 'Корпоративный договор (закрыто)', 'message' => 'Согласован договор между учредителями, внесены изменения в ЕГРЮЛ.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 70],
            ['subject' => 'Наследство (закрыто)', 'message' => 'Клиент вступил в наследство, передан полный пакет документов.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 75],
            ['subject' => 'Административное дело (закрыто)', 'message' => 'Дело прекращено, материалы возвращены.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 80],
            ['subject' => 'Договор франшизы (закрыто)', 'message' => 'Проверен договор коммерческой концессии, замечания учтены.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 85],

            ['subject' => 'Спор с управляющей компанией (отклонена)', 'message' => 'Обращение не подпадает под профиль агентства — рекомендована другая специализация.', 'status' => $x, 'assign_lawyer' => false, 'days_ago' => 11],
            ['subject' => 'Банкротство физлица', 'message' => 'Запрос вне зоны обслуживания по договору абонентского обслуживания.', 'status' => $x, 'assign_lawyer' => false, 'days_ago' => 15],
            ['subject' => 'Уголовное дело (отклонена)', 'message' => 'Уголовная практика ведётся партнёрами, направлен контакт.', 'status' => $x, 'assign_lawyer' => false, 'days_ago' => 19],
            ['subject' => 'Международный арбитраж', 'message' => 'Спор с иностранным элементом — перенаправление к профильным юристам.', 'status' => $x, 'guest' => true, 'guest_name' => 'Anderson Ltd', 'guest_email' => 'contact@anderson-demo.com', 'days_ago' => 21],
            ['subject' => 'Спор по качеству услуг (отклонена)', 'message' => 'Недостаточно документов для оценки, клиент не предоставил договор.', 'status' => $x, 'assign_lawyer' => false, 'days_ago' => 24],

            // Дополнительно для графика «заявки по месяцам»
            ['subject' => 'Консультация по налогам ИП', 'message' => 'Вопрос по УСН и вычетам при смене режима.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 95],
            ['subject' => 'Договор подряда на ремонт', 'message' => 'Проверка сметы и условий приёмки работ.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 100],
            ['subject' => 'Выселение арендатора', 'message' => 'Неустойка и расторжение договора аренды жилого помещения.', 'status' => $p, 'assign_lawyer' => true, 'days_ago' => 88],
            ['subject' => 'Лицензионный договор ПО', 'message' => 'Согласование лицензии на использование CRM.', 'status' => $r, 'assign_lawyer' => true, 'days_ago' => 92],
            ['subject' => 'Заявление в трудовую инспекцию', 'message' => 'Подготовка обращения о невыплате зарплаты.', 'status' => $p, 'assign_lawyer' => true, 'days_ago' => 78],
            ['subject' => 'Медиация по соседскому спору', 'message' => 'Шум и нарушение санитарных норм — медиативное соглашение.', 'status' => $c, 'assign_lawyer' => true, 'days_ago' => 105],
        ];
    }
}
