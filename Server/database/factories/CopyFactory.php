<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Book;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Copy>
 */
class CopyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $bookId = Book::inRandomOrder()->first()->id;

        return [
            'book_id' => Book::inRandomOrder()->first()->id,
            'code'    => sprintf('COPY-%d-%d-%s', $bookId, now()->timestamp, strtoupper(Str::random(4))),
            'state'   => 'available',
        ];
    }
}
