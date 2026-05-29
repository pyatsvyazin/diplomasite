<?php

namespace Database\Seeders;

use App\Models\Specialty;
use Illuminate\Database\Seeder;

class SpecialtySeeder extends Seeder
{
    public function run(): void
    {
        $names = [
            'Семейное право',
            'Гражданское право',
            'Корпоративное право',
            'Трудовое право',
            'Уголовное право',
            'Налоговое право',
            'Жилищное право',
            'Земельное право',
            'Административное право',
            'Интеллектуальная собственность',
        ];

        foreach ($names as $name) {
            Specialty::firstOrCreate(['name' => $name]);
        }
    }
}
