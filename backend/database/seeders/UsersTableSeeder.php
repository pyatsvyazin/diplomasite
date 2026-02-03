<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersTableSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->insert([
            // ===== Клиенты =====
            [
                'full_name' => 'Иванов Иван Иванович',
                'email' => 'client1@test.ru',
                'phone' => '+79990000001',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'full_name' => 'Петрова Анна Сергеевна',
                'email' => 'client2@test.ru',
                'phone' => '+79990000002',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // ===== Юристы =====
            [
                'full_name' => 'Смирнов Алексей Олегович',
                'email' => 'lawyer1@test.ru',
                'phone' => '+79990000010',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'full_name' => 'Кузнецова Мария Андреевна',
                'email' => 'lawyer2@test.ru',
                'phone' => '+79990000011',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
