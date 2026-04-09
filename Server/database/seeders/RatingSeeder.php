<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Database\Seeder;

class RatingSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('role', 'user')->get();
        $books = Book::all();

        // Cada usuario valora entre 3 y 6 libros aleatorios
        foreach ($users as $user) {
            $booksToRate = $books->random(rand(3, 6));

            foreach ($booksToRate as $book) {
                Rating::create([
                    'user_id' => $user->id,
                    'book_id' => $book->id,
                    'rating' => rand(1, 5),
                    'comment' => fake()->optional(0.7)->sentence(), // 70% tienen comentario
                ]);
            }
        }
    }
}
