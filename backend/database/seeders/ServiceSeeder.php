<?php

namespace Database\Seeders;

use App\Enums\ServicePriceType;
use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    private const CATEGORY_INDIVIDUALS = 'Физические лица';

    private const CATEGORY_BUSINESS = 'Бизнес';

    public function run(): void
    {
        $individuals = [
            ['name' => 'Семейное право', 'short' => 'Развод, алименты, раздел имущества, брачные договоры.', 'price_type' => ServicePriceType::From, 'price_from' => 3000, 'price_to' => null],
            ['name' => 'Гражданское право', 'short' => 'Споры по договорам, взыскание долгов, защита прав потребителей.', 'price_type' => ServicePriceType::From, 'price_from' => 2500, 'price_to' => null],
            ['name' => 'Корпоративное право', 'short' => 'Для ИП и ООО: учредительные документы, сделки с долями.', 'price_type' => ServicePriceType::Range, 'price_from' => 10000, 'price_to' => 50000],
            ['name' => 'Трудовое право', 'short' => 'Увольнения, споры с работодателем, трудовые договоры.', 'price_type' => ServicePriceType::From, 'price_from' => 3000, 'price_to' => null],
            ['name' => 'Уголовное право', 'short' => 'Защита на стадии проверки и в суде первой инстанции.', 'price_type' => ServicePriceType::Range, 'price_from' => 15000, 'price_to' => 100000],
            ['name' => 'Налоговое право', 'short' => 'Споры с ФНС, консультации по режимам налогообложения.', 'price_type' => ServicePriceType::Range, 'price_from' => 7000, 'price_to' => 40000],
            ['name' => 'Жилищное право', 'short' => 'Споры с УК, выселение, приватизация, найм.', 'price_type' => ServicePriceType::From, 'price_from' => 2500, 'price_to' => null],
            ['name' => 'Земельное право', 'short' => 'Межевание, сервитуты, споры о границах участков.', 'price_type' => ServicePriceType::Range, 'price_from' => 5000, 'price_to' => 30000],
            ['name' => 'Административное право', 'short' => 'Обжалование постановлений, представительство в суде.', 'price_type' => ServicePriceType::From, 'price_from' => 3000, 'price_to' => null],
        ];

        $business = [
            ['name' => 'Регистрация и изменения в ЕГРЮЛ', 'short' => 'Создание ООО/АО, внесение изменений, ликвидация.', 'price_type' => ServicePriceType::From, 'price_from' => 12000, 'price_to' => null],
            ['name' => 'Договорная работа для бизнеса', 'short' => 'Поставка, подряд, оказание услуг, NDA, типовые пакеты.', 'price_type' => ServicePriceType::Range, 'price_from' => 8000, 'price_to' => 45000],
            ['name' => 'Трудовой комплаенс', 'short' => 'Кадровые документы, удалёнка, материальная ответственность.', 'price_type' => ServicePriceType::From, 'price_from' => 15000, 'price_to' => null],
            ['name' => 'Налоговое сопровождение', 'short' => 'Проверки, возражения на акты, сопровождение камеральных проверок.', 'price_type' => ServicePriceType::Range, 'price_from' => 20000, 'price_to' => 80000],
            ['name' => 'Due diligence контрагента', 'short' => 'Проверка контрагента перед крупной сделкой или инвестицией.', 'price_type' => ServicePriceType::Custom, 'price_from' => null, 'price_to' => null],
            ['name' => 'Корпоративные споры', 'short' => 'Выход участника, оспаривание решений, защита миноритариев.', 'price_type' => ServicePriceType::Range, 'price_from' => 30000, 'price_to' => 150000],
            ['name' => 'Претензионная работа', 'short' => 'Досудебное урегулирование, переговоры, медиация.', 'price_type' => ServicePriceType::From, 'price_from' => 5000, 'price_to' => null],
            ['name' => 'Защита персональных данных', 'short' => 'Политики, оферты, аудит сайта и CRM под 152-ФЗ.', 'price_type' => ServicePriceType::From, 'price_from' => 18000, 'price_to' => null],
            ['name' => 'Сопровождение сделок M&A', 'short' => 'Подготовка term sheet, SPA, сопровождение закрытия сделки.', 'price_type' => ServicePriceType::Custom, 'price_from' => null, 'price_to' => null],
        ];

        foreach ($individuals as $i => $row) {
            $this->upsert(self::CATEGORY_INDIVIDUALS, $row, $i);
        }

        foreach ($business as $i => $row) {
            $this->upsert(self::CATEGORY_BUSINESS, $row, $i);
        }

        $this->command?->info('ServiceSeeder: услуги для физлиц — '.count($individuals).', для бизнеса — '.count($business).'.');
    }

    private function upsert(string $category, array $row, int $priority): void
    {
        Service::query()->updateOrCreate(
            ['name' => $row['name'], 'category' => $category],
            [
                'short_description' => $row['short'],
                'full_description' => $row['short'].' Полное описание доступно после консультации с юристом агентства.',
                'price_type' => $row['price_type'],
                'price_from' => $row['price_from'],
                'price_to' => $row['price_to'],
                'priority' => $priority,
            ]
        );
    }
}
