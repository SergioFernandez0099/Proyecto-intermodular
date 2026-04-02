<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            "cover_image" => $this->cover_image,
            "publication_year" => $this->publication_year,

            // whenLoaded evita error si la relación no fue cargada con with()
            'genre' => $this->whenLoaded('genre', fn() => [
                'id' => $this->genre->id,
                'name' => $this->genre->name,
            ]),

            'authors' => $this->whenLoaded('authors', fn() => $this->authors->map(fn($a) => [
                'id' => $a->id,
                'name' => $a->name,
            ])),

            // Campo calculado — true si al menos una copia está disponible
            'available' => $this->whenLoaded('copies', fn() => $this->copies->contains('state', 'available')
            ),

            'average_rating' => $this->whenLoaded('ratings', fn() => round($this->ratings->avg('rating'), 1)
            ),

            'ratings' => $this->whenLoaded('ratings', fn() => $this->ratings->map(fn($r) => [
                'id' => $r->id,
                'rating' => $r->rating,
                'comment' => $r->comment,
                'user' => [
                    'id' => $r->user->id,
                    'name' => $r->user->name,
                ],
            ])
            ),
        ];
    }
}
