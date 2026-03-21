<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Genre;
use App\Models\Author;
use App\Models\Book;
use App\Models\Copy;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder {
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void {
        Genre::factory()->count(8)->create();
        $authors = Author::factory()->count(8)->create();
        Book::factory()->count(20)->afterCreating(function (Book $book) use ($authors) {
            $book->authors()->attach($authors->random(rand(1, 3)));
        })->create();
        //User::factory()->count(10)->hasAttached(Copy::factory()->count(1))->create();
        User::factory()->count(10)->create();
        Copy::factory()->count(20)->create();
    }
}
