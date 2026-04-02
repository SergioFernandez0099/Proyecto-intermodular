<?php

namespace Database\Seeders;

use App\Models\Genre;
use Illuminate\Database\Seeder;

class GenreSeeder extends Seeder
{
    public function run(): void
    {
        // Géneros fijos reales en lugar de nombres aleatorios
        $genres = [
            'Ficción', 'No ficción', 'Ciencia ficción',
            'Fantasía', 'Terror', 'Romance', 'Historia', 'Biografía',
        ];

        foreach ($genres as $name) {
            Genre::create(['name' => $name]);
        }
    }
}
