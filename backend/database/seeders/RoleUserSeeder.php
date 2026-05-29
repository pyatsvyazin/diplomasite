<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleUserSeeder extends Seeder
{
    public function run(): void
    {
        $clientId = Role::where('name', 'client')->value('id');
        $lawyerId = Role::where('name', 'lawyer')->value('id');
        $adminId = Role::where('name', 'admin')->value('id');

        if (!$clientId || !$lawyerId || !$adminId) {
            throw new \RuntimeException('Роли client, lawyer, admin должны быть созданы RoleSeeder до RoleUserSeeder.');
        }

        DB::table('role_user')->insert([
            ['user_id' => 1, 'role_id' => $adminId],
            ['user_id' => 2, 'role_id' => $clientId],
            ['user_id' => 3, 'role_id' => $clientId],
            ['user_id' => 4, 'role_id' => $clientId],
            ['user_id' => 5, 'role_id' => $clientId],
            ['user_id' => 6, 'role_id' => $clientId],
            ['user_id' => 7, 'role_id' => $lawyerId],
            ['user_id' => 8, 'role_id' => $lawyerId],
            ['user_id' => 9, 'role_id' => $lawyerId],
        ]);
    }
}
