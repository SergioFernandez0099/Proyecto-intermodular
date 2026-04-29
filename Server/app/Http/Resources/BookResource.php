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
            'cover_image' => $this->cover_image
                ? \Storage::disk('public')->url($this->cover_image)
                : null,
            "publication_year" => $this->publication_year,

            'genre' => $this->whenLoaded('genre', fn() => [
                'id' => $this->genre->id,
                'name' => $this->genre->name,
            ]),

            'authors' => $this->whenLoaded('authors', fn() => $this->authors->map(fn($a) => [
                'id' => $a->id,
                'name' => $a->name,
            ])),

            'available_copies_count' => (int)($this->available_copies_count ?? 0),
            'copies_count' => (int)($this->copies_count ?? 0),
            'is_available' => $this->available_copies_count > 0,

            'ratings_count' => $this->whenLoaded('ratings', fn() => $this->ratings->count()),
            'average_rating' => $this->whenLoaded('ratings', fn() => round($this->ratings->avg('rating'), 1)
            ),
            'ratings' => $this->whenLoaded('ratings', fn() => $this->ratings->map(fn($r) => [
                'id' => $r->id,
                'rating' => $r->rating,
                'comment' => $r->comment,
                'created_at' => $r->created_at,
                // Campo calculado — true si la fecha de update es diferente de la de created
                'edited' => $r->created_at->ne($r->updated_at),
                'user' => [
                    'id' => $r->user->id,
                    'name' => $r->user->name,
                ],
            ])
            ),
        ];
    }
}
