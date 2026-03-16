<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Genre;
use App\Models\Author;
use App\Models\Book;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder {
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void {
        User::factory()->count(10)->create();
        Genre::factory()->count(8)->create();
        $authors = Author::factory()->count(8)->create();
        Book::factory()->count(20)->afterCreating(function (Book $book) use ($authors) {
            $book->authors()->attach($authors->random(rand(1, 3)));
        })->create();
    }
}
