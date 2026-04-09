<?php

namespace App\Http\Controllers;

use App\Http\Resources\RatingResource;
use App\Models\Book;
use App\Models\Rating;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RatingController extends Controller
{
    public function byBook(Book $book)
    {
        return RatingResource::collection(
            $book->ratings->load('user')
        );
    }

    public function store(Request $request, Book $book)
    {
        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        // Un usuario solo puede valorar un libro una vez (unique en BD)
        $rating = Rating::updateOrCreate(
            ['user_id' => Auth::id(), 'book_id' => $book->id],
            $data
        );

        return new RatingResource($rating->load('user'));
    }

    public function update(Request $request, Book $book, Rating $rating)
    {
        $this->authorize('update', $rating);

        $data = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $rating->update($data);

        return new RatingResource($rating->load('user'));
    }

    public function destroy(Book $book, Rating $rating)
    {
        $this->authorize('delete', $rating);

        $rating->delete();

        return response()->json(null, 204);
    }
}
