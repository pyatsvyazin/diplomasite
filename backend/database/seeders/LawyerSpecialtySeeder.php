<?php

namespace Database\Seeders;

use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Seeder;

class LawyerSpecialtySeeder extends Seeder
{
    public function run(): void
    {
        $byName = Specialty::query()->pluck('id', 'name');

        $lawyers = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'lawyer'))
            ->orderBy('id')
            ->get();

        if ($lawyers->isEmpty()) {
            return;
        }

        $assignments = [
            ['Семейное право', 'Гражданское право'],
            ['Корпоративное право', 'Трудовое право', 'Налоговое право'],
            ['Уголовное право', 'Административное право', 'Жилищное право'],
        ];

        foreach ($lawyers->values() as $i => $lawyer) {
            $names = $assignments[$i % count($assignments)];
            $ids = [];
            foreach ($names as $n) {
                if ($byName->has($n)) {
                    $ids[] = $byName[$n];
                }
            }
            if ($ids !== []) {
                $lawyer->specialties()->sync($ids);
            }
        }
    }
}
