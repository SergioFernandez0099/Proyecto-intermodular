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
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'title' => $this->title,
            "cover_image" => $this->cover_image,
            "publication_year" => $this->publication_year,
            "genre" => $this->genre?->name,
            "authors_list" => $this->authors->pluck('name'),
        ];
    }
}
