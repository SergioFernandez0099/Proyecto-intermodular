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
        $users = User::where('role', 'user')->get(); // ← solo usuarios normales

        Book::factory()->count(20)->create()->each(function (Book $book) use ($authors, $users) {
            $book->update(['owner_id' => $users->random()->id]);

            $book->authors()->attach(
                $authors->random(rand(1, 3))->pluck('id')
            );
        });
    }
}
