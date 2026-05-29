<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);
        $this->call(UsersTableSeeder::class);
        $this->call(RoleUserSeeder::class);
        $this->call(SpecialtySeeder::class);
        $this->call(LawyerSpecialtySeeder::class);
        $this->call(RequestSeeder::class);
        $this->call(ServiceSeeder::class);
        $this->call(ReviewSeeder::class);
        $this->call(ConversationSeeder::class);
        $this->call(PostSeeder::class);
        $this->call(StaffExtraSeeder::class);
    }
}
