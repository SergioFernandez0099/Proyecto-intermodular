<?php

namespace App\Http\Controllers;

use App\Http\Resources\BookResource;
use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class BookController extends Controller
{
    // Todos los libros excepto los del usuario autenticado
    public function index(Request $request)
    {
        $books = Book::with(['genre', 'authors', 'copies'])
            ->where('owner_id', '!=', $request->user()->id)
            ->when($request->genre_id, fn($q) => $q->where('genre_id', $request->genre_id))
            ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"))
            ->get();

        return BookResource::collection($books);
    }

    // Solo los libros del usuario autenticado
    public function mine(Request $request)
    {
        $books = Book::with(['genre', 'authors', 'copies'])
            ->where('owner_id', $request->user()->id)
            ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"))
            ->get();

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
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'genre_id' => 'required|exists:genres,id',
            'publication_year' => 'nullable|integer|min:1000|max:2099',
            'cover_image' => 'nullable|image|mimes:jpeg,png,webp|max:2048',
            'author_ids' => 'required|array|min:1',
            'author_ids.*' => 'exists:authors,id',
        ]);

        // Validación duplicado título + autor
        $existe = Book::where('title', $data['title'])
            ->whereHas('authors', fn($q) => $q->whereIn('author_id', $data['author_ids']))
            ->exists();

        if ($existe) {
            throw ValidationException::withMessages([
                'book' => ['Ya existe un libro con este título y autor.'],
            ]);
        }

        $book = Book::create([
            ...$data,
            'cover_image' => $request->hasFile('cover_image')
                ? $request->file('cover_image')->store('covers', 'public')
                : null,
            'owner_id' => $request->user()->id,
        ]);

        $book->authors()->sync($data['author_ids']);

        return (new BookResource($book->load(['genre', 'authors'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Book $book)
    {
        $this->authorize('update', $book);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'genre_id' => 'sometimes|exists:genres,id',
            'publication_year' => 'nullable|integer|min:1000|max:2099',
            'author_ids' => 'sometimes|array|min:1',
            'author_ids.*' => 'exists:authors,id',
        ]);

        // Solo se valida si viene el título o algún autor
        if (isset($data['title']) || isset($data['author_ids'])) {
            $titulo = $data['title'] ?? $book->title;
            $autoresIds = $data['author_ids'] ?? $book->authors->pluck('id')->toArray();

            $existe = Book::where('title', $titulo)
                ->where('id', '!=', $book->id)
                ->whereHas('authors', fn($q) => $q->whereIn('author_id', $autoresIds))
                ->exists();

            if ($existe) {
                throw ValidationException::withMessages([
                    'book' => ['Ya existe un libro con este título y autor.'],
                ]);
            }
        }

        $book->update($data);

        if (isset($data['author_ids'])) {
            $book->authors()->sync($data['author_ids']);
        }

        return new BookResource($book->load(['genre', 'authors']));
    }

    public function destroy(Request $request, Book $book)
    {
        $this->authorize('delete', $book);

        $this->deleteOldCover($book); // Borra la imagen del disco

        $book->delete();

        return response()->json(null, 204);
    }

    public function updateCover(Request $request, Book $book)
    {
        $this->authorize('update', $book);

        $request->validate([
            'cover_image' => 'required|image|mimes:jpeg,png,webp|max:2048',
        ]);

        $this->deleteOldCover($book);

        $path = $request->file('cover_image')->store('covers', 'public');

        $book->update(['cover_image' => $path]);

        return new BookResource($book->load(['genre', 'authors']));
    }

    public function deleteCover(Book $book)
    {
        $this->authorize('update', $book);

        $this->deleteOldCover($book);

        $book->update(['cover_image' => null]);

        return response()->json(null, 204);
    }

    private function deleteOldCover(Book $book): void
    {
        if ($book->cover_image) {
            Storage::disk('public')->delete($book->cover_image);
        }
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $path = $request->file('file')->getRealPath();
        $handle = fopen($path, 'r');
        $header = fgetcsv($handle); // lee la primera fila como cabecera

        $imported = [];
        $failed = [];
        $row = 1; // fila 1 es la cabecera, empezamos en 2

        while (($line = fgetcsv($handle)) !== false) {
            $row++;

            // Mapea la fila con la cabecera → array asociativo
            $data = array_combine($header, $line);

            // Parsea author_ids separados por |
            $authorIds = collect(explode('|', $data['author_ids'] ?? ''))
                ->map(fn($id) => trim($id))
                ->filter()
                ->values()
                ->all();

            // Valida la fila individualmente
            $validator = validator([
                'title' => $data['title'] ?? null,
                'genre_id' => $data['genre_id'] ?? null,
                'publication_year' => $data['publication_year'] ?? null,
                'author_ids' => $authorIds,
            ], [
                'title' => 'required|string|max:255',
                'genre_id' => 'required|exists:genres,id',
                'publication_year' => 'nullable|integer|min:1000|max:2099',
                'author_ids' => 'required|array|min:1',
                'author_ids.*' => 'exists:authors,id',
            ]);

            if ($validator->fails()) {
                $failed[] = [
                    'row' => $row,
                    'data' => $data,
                    'errors' => $validator->errors(),
                ];
                continue;
            }

            $validated = $validator->validated();

            // Validación duplicado título + autor
            $existe = Book::where('title', $validated['title'])
                ->whereHas('authors', fn($q) => $q->whereIn('author_id', $validated['author_ids']))
                ->exists();

            if ($existe) {
                $failed[] = [
                    'row' => $row,
                    'data' => $data,
                    'errors' => ['title' => ['Ya existe un libro con este título y autor.']],
                ];
                continue;
            }

            $book = Book::create([
                'title' => $validated['title'],
                'genre_id' => $validated['genre_id'],
                'publication_year' => $validated['publication_year'] ?? null,
                'cover_image' => null,
                'owner_id' => $request->user()->id,
            ]);

            $book->authors()->sync($validated['author_ids']);

            $imported[] = $book->id;
        }

        fclose($handle);

        return response()->json([
            'imported_count' => count($imported),
            'failed_count' => count($failed),
            'imported_ids' => $imported,
            'failed' => $failed,
        ]);
    }
}
