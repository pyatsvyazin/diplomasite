<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleUserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('role_user')->insert([
            // ===== Админ (user_id 1) =====
            ['user_id' => 1, 'role_id' => 3], // admin

            // ===== Клиенты (user_id 2–6) =====
            ['user_id' => 2, 'role_id' => 1], // client
            ['user_id' => 3, 'role_id' => 1],
            ['user_id' => 4, 'role_id' => 1],
            ['user_id' => 5, 'role_id' => 1],
            ['user_id' => 6, 'role_id' => 1],

            // ===== Юристы (user_id 7–9) =====
            ['user_id' => 7, 'role_id' => 2], // lawyer
            ['user_id' => 8, 'role_id' => 2],
            ['user_id' => 9, 'role_id' => 2],
        ]);
    }
}
