<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleUserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('role_user')->insert([
            // ===== Клиенты =====
            [
                'user_id' => 4,
                'role_id' => 1, // client
            ],
            [
                'user_id' => 5,
                'role_id' => 1, // client
            ],

            // ===== Юристы =====
            [
                'user_id' => 6,
                'role_id' => 2, // lawyer
            ],
            [
                'user_id' => 7,
                'role_id' => 2, // lawyer
            ],
        ]);
    }
}
