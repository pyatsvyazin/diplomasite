<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleUserSeeder extends Seeder
{
    public function run(): void
    {
        $roles = Role::query()->pluck('id', 'name');

        foreach (['client', 'lawyer', 'admin'] as $name) {
            if (! isset($roles[$name])) {
                throw new \RuntimeException("Роль «{$name}» должна быть создана RoleSeeder до RoleUserSeeder.");
            }
        }

        $admin = User::query()->where('email', 'svyazin9@gmail.com')->first();
        if ($admin) {
            $this->attachRole($admin->id, $roles['admin']);
        }

        $clientEmails = [
            'client1@test.ru', 'client2@test.ru', 'client3@test.ru', 'client4@test.ru', 'client5@test.ru',
            'client6@test.ru', 'client7@test.ru', 'client8@test.ru',
        ];
        foreach ($clientEmails as $email) {
            $user = User::query()->where('email', $email)->first();
            if ($user) {
                $this->attachRole($user->id, $roles['client']);
            }
        }

        foreach (['lawyer1@test.ru', 'lawyer2@test.ru', 'lawyer3@test.ru'] as $email) {
            $user = User::query()->where('email', $email)->first();
            if ($user) {
                $this->attachRole($user->id, $roles['lawyer']);
            }
        }
    }

    private function attachRole(int $userId, int $roleId): void
    {
        $exists = DB::table('role_user')
            ->where('user_id', $userId)
            ->where('role_id', $roleId)
            ->exists();

        if (! $exists) {
            DB::table('role_user')->insert([
                'user_id' => $userId,
                'role_id' => $roleId,
            ]);
        }
    }
}
