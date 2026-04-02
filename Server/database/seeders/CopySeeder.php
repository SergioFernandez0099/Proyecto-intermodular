<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Copy;
use Illuminate\Database\Seeder;

class CopySeeder extends Seeder
{
    public function run(): void
    {
        $books = Book::all();

        // Cada libro tiene entre 1 y 3 copias
        foreach ($books as $book) {
            Copy::factory()->count(rand(1, 3))->create([
                'book_id' => $book->id,
            ]);
        }
    }
}
