<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoanResource extends JsonResource
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
            'loan_date' => $this->loan_date,
            'return_date' => $this->return_date,
            'updated_at' => $this->updated_at,
            'copy' => $this->whenLoaded('copy', fn() => [
                'id' => $this->copy->id,
                'owner' => $this->copy->owner_id,
                'code' => $this->copy->code,
                'book' => $this->copy->book ? [
                    'id' => $this->copy->book->id,
                    'title' => $this->copy->book->title,
                    'cover_image' => $this->copy->book->cover_image,
                    'genre'   => $this->copy->book->genre ? [
                        'id'   => $this->copy->book->genre->id,
                        'name' => $this->copy->book->genre->name,
                    ] : null,
                    'authors' => $this->copy->book->authors->map(fn($a) => [
                        'id'   => $a->id,
                        'name' => $a->name,
                    ]),
                ] : null,
            ]),
            'user' => [
                'id'   => $this->user->id,
                'name' => $this->user->name,
            ]
        ];
    }
}
