<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersTableSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $verified = $now;

        $row = fn (array $u) => array_merge([
            'email_verified_at' => $verified,
            'avatar_path' => null,
            'is_blocked' => false,
            'two_factor_enabled' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ], $u);

        DB::table('users')->insert([
            $row([
                'full_name' => 'Администратор',
                'email' => 'svyazin9@gmail.com',
                'phone' => '79990000100',
                'password' => Hash::make('password'),
            ]),
            $row([
                'full_name' => 'Иванов Иван Иванович',
                'email' => 'client1@test.ru',
                'phone' => '79990000001',
                'password' => Hash::make('password'),
            ]),
            $row([
                'full_name' => 'Петрова Анна Сергеевна',
                'email' => 'client2@test.ru',
                'phone' => '79990000002',
                'password' => Hash::make('password'),
            ]),
            $row([
                'full_name' => 'Сидорова Ольга Викторовна',
                'email' => 'client3@test.ru',
                'phone' => '79990000003',
                'password' => Hash::make('password'),
            ]),
            $row([
                'full_name' => 'Козлов Дмитрий Николаевич',
                'email' => 'client4@test.ru',
                'phone' => '79990000004',
                'password' => Hash::make('password'),
            ]),
            $row([
                'full_name' => 'Новикова Елена Александровна',
                'email' => 'client5@test.ru',
                'phone' => '79990000005',
                'password' => Hash::make('password'),
            ]),
            $row([
                'full_name' => 'Смирнов Алексей Олегович',
                'email' => 'lawyer1@test.ru',
                'phone' => '79990000010',
                'password' => Hash::make('password'),
            ]),
            $row([
                'full_name' => 'Кузнецова Мария Андреевна',
                'email' => 'lawyer2@test.ru',
                'phone' => '79990000011',
                'password' => Hash::make('password'),
            ]),
            $row([
                'full_name' => 'Юристов Пётр Иванович',
                'email' => 'lawyer3@test.ru',
                'phone' => '79990000012',
                'password' => Hash::make('password'),
            ]),
        ]);
    }
}
