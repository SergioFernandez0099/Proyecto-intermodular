<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Genre;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Book>
 */
class BookFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title'            => fake()->sentence(3),
            'genre_id'         => Genre::inRandomOrder()->first()->id,
            'owner_id'         => User::inRandomOrder()->first()->id,
            'publication_year' => fake()->year(),
            'cover_image'      => null,
        ];
    }

}
