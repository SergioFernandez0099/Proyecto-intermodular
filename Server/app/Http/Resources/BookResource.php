<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
        
        'available_copies_count' => (int) ($this->available_copies_count ?? 0),

        'genre' => $this->whenLoaded('genre', fn() => [
            'id' => $this->genre->id,
            'name' => $this->genre->name,
        ]),

        'authors' => $this->whenLoaded('authors', fn() => $this->authors->map(fn($a) => [
            'id' => $a->id,
            'name' => $a->name,
        ])),
        
        'is_available' => $this->available_copies_count > 0,
    ];
}
}
