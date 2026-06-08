<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin User',
                'email' => 'admin@seeksophie.com',
                'role' => UserRole::Admin,
            ],
            [
                'name' => 'Editor User',
                'email' => 'editor@seeksophie.com',
                'role' => UserRole::Editor,
            ],
            [
                'name' => 'Author User',
                'email' => 'author@seeksophie.com',
                'role' => UserRole::Author,
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => 'password',
                    'role' => $userData['role'],
                ]
            );
        }
    }
}
