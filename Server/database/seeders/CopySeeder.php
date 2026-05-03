<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Copy;
use App\Models\User;
use Illuminate\Database\Seeder;

class CopySeeder extends Seeder
{
    public function run(): void
    {
        $books = Book::all();
        $users = User::where('role', 'user')->get(); // ← solo usuarios normales
        $copies = Copy::all();

        // Cada libro tiene entre 1 y 3 copias
        foreach ($books as $book) {
            Copy::factory()->count(rand(1, 3))->create([
                'book_id' => $book->id,
            ]);
        }

        foreach ($copies as $copy) {
            $copy->update(['owner_id' => $users->random()->id]);
        }
    }
}
