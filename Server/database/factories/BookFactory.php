<?php

namespace Database\Factories;

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
    public function definition(): array {
        return [
            'title' => $this->faker->sentence(3),
            'cover_image' => $this->faker->sentence(5),
            'publication_year' => $this->faker->numberBetween(1950, 2024),
            'genre_id' => fn () => Genre::inRandomOrder()->first()->id
        ];
    }

}
