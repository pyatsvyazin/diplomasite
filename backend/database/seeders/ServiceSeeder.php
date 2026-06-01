<?php

namespace Database\Seeders;

use App\Enums\ServicePriceType;
use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    private const CATEGORY_INDIVIDUALS = 'Физические лица';

    public function run(): void
    {
        $rows = [
            ['name' => 'Семейное право', 'price_type' => ServicePriceType::From, 'price_from' => 3000, 'price_to' => null],
            ['name' => 'Гражданское право', 'price_type' => ServicePriceType::From, 'price_from' => 2500, 'price_to' => null],
            ['name' => 'Корпоративное право', 'price_type' => ServicePriceType::Range, 'price_from' => 10000, 'price_to' => 50000],
            ['name' => 'Трудовое право', 'price_type' => ServicePriceType::From, 'price_from' => 3000, 'price_to' => null],
            ['name' => 'Уголовное право', 'price_type' => ServicePriceType::Range, 'price_from' => 15000, 'price_to' => 100000],
            ['name' => 'Налоговое право', 'price_type' => ServicePriceType::Range, 'price_from' => 7000, 'price_to' => 40000],
            ['name' => 'Жилищное право', 'price_type' => ServicePriceType::From, 'price_from' => 2500, 'price_to' => null],
            ['name' => 'Земельное право', 'price_type' => ServicePriceType::Range, 'price_from' => 5000, 'price_to' => 30000],
            ['name' => 'Административное право', 'price_type' => ServicePriceType::From, 'price_from' => 3000, 'price_to' => null],
            ['name' => 'Интеллектуальная собственность', 'price_type' => ServicePriceType::Custom, 'price_from' => null, 'price_to' => null],
        ];

        foreach ($rows as $i => $row) {
            Service::query()->updateOrCreate(
                ['name' => $row['name'], 'category' => self::CATEGORY_INDIVIDUALS],
                [
                    'short_description' => null,
                    'full_description' => null,
                    'price_type' => $row['price_type'],
                    'price_from' => $row['price_from'],
                    'price_to' => $row['price_to'],
                    'priority' => $i,
                ]
            );
        }
    }
}
