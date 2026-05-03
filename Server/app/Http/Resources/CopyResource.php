<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CopyResource extends JsonResource
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
            'code' => $this->code,
            'state' => $this->state,
            'owner_id' => $this->owner_id,
            'book' => $this->whenLoaded('book', fn() => [
                'id' => $this->book->id,
                'title' => $this->book->title,
            ]),
        ];
    }
}
