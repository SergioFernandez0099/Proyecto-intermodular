<?php

namespace Database\Seeders;

use App\Models\Author;
use App\Models\Book;
use App\Models\User;
use Illuminate\Database\Seeder;

class BookSeeder extends Seeder
{
    public function run(): void
    {
        $authors = Author::all();
        $adminId = User::where('role', 'admin')->first()->id;

        Book::factory()->count(20)->create([
            'owner_id' => $adminId,
        ])->each(function (Book $book) use ($authors) {
            // Cada libro tiene entre 1 y 3 autores
            $book->authors()->attach(
                $authors->random(rand(1, 3))->pluck('id')
            );
        });
    }
}
