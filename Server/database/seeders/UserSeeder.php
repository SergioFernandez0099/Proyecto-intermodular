<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin fijo siempre disponible para pruebas
        User::create([
            'name' => 'Admin',
            'lastname' => 'Principal',
            'email' => 'admin@admin.com',
            'password' => 'password123',
            'role' => 'admin',
            'active' => true,
        ]);

        User::factory()->count(8)->create();           // usuarios normales
        User::factory()->count(1)->inactive()->create(); // un usuario inactivo para probar

    }
}
