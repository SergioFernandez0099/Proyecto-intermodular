<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Http\Resources\BookResource;
use Illuminate\Http\Request;

class BookController extends Controller
{
    public function index(Request $request)
    {
        $books = Book::with(['genre', 'authors', 'copies', 'ratings'])
            ->when($request->genre_id,  fn($q) => $q->where('genre_id', $request->genre_id))
            ->when($request->search,    fn($q) => $q->where('title', 'like', "%{$request->search}%"))
            ->paginate(15);

        return BookResource::collection($books);
    }

    // Route Model Binding: Laravel busca el libro y devuelve 404 automáticamente
    public function show(Book $book)
    {
        $book->load(['genre', 'authors', 'copies', 'ratings.user']);

        return new BookResource($book);
    }

    public function store(Request $request)
    {
        // Si falla la validación → 422 con los errores
        $data = $request->validate([
            'title'            => 'required|string|max:255',
            'genre_id'         => 'required|exists:genres,id',
            'publication_year' => 'nullable|integer|min:1000|max:2099',
            'cover_image'      => 'nullable|url',
            'author_ids'       => 'required|array|min:1',
            'author_ids.*'     => 'exists:authors,id',
        ]);

        $book = Book::create([
            ...$data,
            'owner_id' => $request->user()->id,
        ]);

        $book->authors()->sync($data['author_ids']);

        return (new BookResource($book->load(['genre', 'authors'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Book $book)
    {
        $data = $request->validate([
            'title'            => 'sometimes|string|max:255',
            'genre_id'         => 'sometimes|exists:genres,id',
            'publication_year' => 'nullable|integer|min:1000|max:2099',
            'cover_image'      => 'nullable|url',
            'author_ids'       => 'sometimes|array|min:1',
            'author_ids.*'     => 'exists:authors,id',
        ]);

        $book->update($data);

        if (isset($data['author_ids'])) {
            $book->authors()->sync($data['author_ids']);
        }

        return new BookResource($book->load(['genre', 'authors']));
    }

    public function destroy(Book $book)
    {
        $book->delete();

        return response()->json(null, 204);
    }
}
