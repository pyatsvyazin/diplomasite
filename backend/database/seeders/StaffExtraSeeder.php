<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Дополнительные юристы для демо (главная «Наши сотрудники», админка).
 * Идемпотентно: повторный запуск не дублирует пользователей (email уникален).
 */
class StaffExtraSeeder extends Seeder
{
    public function run(): void
    {
        $lawyerRoleId = Role::where('name', 'lawyer')->value('id');
        if (!$lawyerRoleId) {
            $this->command?->warn('Роль lawyer не найдена — пропуск StaffExtraSeeder.');

            return;
        }

        $now = now();

        $rows = [
            ['full_name' => 'Волков Андрей Сергеевич', 'email' => 'staff.vol.andrey@test.ru', 'phone' => '79990000020'],
            ['full_name' => 'Михайлова Татьяна Владимировна', 'email' => 'staff.mikh.tatyana@test.ru', 'phone' => '79990000021'],
            ['full_name' => 'Лебедев Константин Олегович', 'email' => 'staff.lebed.konst@test.ru', 'phone' => '79990000022'],
            ['full_name' => 'Фёдорова Ирина Николаевна', 'email' => 'staff.fedor.irina@test.ru', 'phone' => '79990000023'],
            ['full_name' => 'Громов Денис Викторович', 'email' => 'staff.gromov.den@test.ru', 'phone' => '79990000024'],
            ['full_name' => 'Соколова Екатерина Павловна', 'email' => 'staff.sokol.kate@test.ru', 'phone' => '79990000025'],
            ['full_name' => 'Белов Артём Сергеевич', 'email' => 'staff.belov.artem@test.ru', 'phone' => '79990000026'],
            ['full_name' => 'Тарасова Наталья Игоревна', 'email' => 'staff.taras.nat@test.ru', 'phone' => '79990000027'],
            ['full_name' => 'Егоров Павел Дмитриевич', 'email' => 'staff.egor.pavel@test.ru', 'phone' => '79990000028'],
            ['full_name' => 'Романова Олеся Андреевна', 'email' => 'staff.roman.olesya@test.ru', 'phone' => '79990000029'],
        ];

        $byName = Specialty::query()->pluck('id', 'name');

        $specialtySets = [
            ['Семейное право', 'Гражданское право'],
            ['Корпоративное право', 'Трудовое право', 'Налоговое право'],
            ['Уголовное право', 'Административное право', 'Жилищное право'],
            ['Земельное право', 'Гражданское право', 'Интеллектуальная собственность'],
            ['Трудовое право', 'Налоговое право'],
            ['Семейное право', 'Жилищное право'],
            ['Корпоративное право', 'Интеллектуальная собственность'],
            ['Уголовное право', 'Гражданское право'],
            ['Административное право', 'Земельное право'],
            ['Налоговое право', 'Трудовое право', 'Семейное право'],
        ];

        foreach ($rows as $i => $row) {
            $user = User::firstOrCreate(
                ['email' => $row['email']],
                [
                    'full_name' => $row['full_name'],
                    'phone' => $row['phone'],
                    'password' => 'password',
                    'email_verified_at' => $now,
                    'avatar_path' => null,
                    'is_blocked' => false,
                    'two_factor_enabled' => false,
                ]
            );

            $user->roles()->syncWithoutDetaching([$lawyerRoleId]);

            $names = $specialtySets[$i % count($specialtySets)];
            $ids = [];
            foreach ($names as $name) {
                if ($byName->has($name)) {
                    $ids[] = (int) $byName[$name];
                }
            }
            if ($ids !== []) {
                $user->specialties()->sync($ids);
            }
        }
    }
}
