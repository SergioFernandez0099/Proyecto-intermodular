<?php

namespace App\Http\Controllers;

use App\Http\Resources\BookResource;
use App\Models\Book;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class BookController extends Controller
{
    // Todos los libros excepto los del usuario autenticado
    public function index(Request $request)
{
    $books = Book::with(['genre', 'authors'])
        ->where('owner_id', '!=', $request->user()->id)
        ->whereHas('owner', fn($q) => $q->where('active', true))
        ->when($request->genre_id, fn($q) => $q->where('genre_id', $request->genre_id))
        ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"))
        ->withCount(['copies as available_copies_count' => function ($query) {
            $query->where('state', 'available');
        }])
        ->withCount(['copies as copies_count'])
        ->latest()
        ->get();

    return BookResource::collection($books);
}

    // Solo los libros del usuario autenticado
    public function mine(Request $request)
    {
        $books = Book::with(['genre', 'authors', 'copies'])
            ->where('owner_id', $request->user()->id)
            ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"))
            ->withCount(['copies as available_copies_count' => function ($query) {
                $query->where('state', 'available');
            }])
            ->withCount(['copies as copies_count'])
            ->get();

        return BookResource::collection($books);
    }

    // Route Model Binding: Laravel busca el libro y devuelve 404 automáticamente
    public function show(Book $book)
    {
        $this->authorize('view', $book);

        $book->loadCount([
            'copies as available_copies_count' => fn($q) => $q->where('state', 'available'),
            'copies as copies_count',
        ]);

        $book->load([
            'genre',
            'authors',
            'copies',
            'ratings' => fn($q) => $q->whereHas('user', fn($q) => $q->where('active', true))
                ->with('user'),
        ]);

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

        // Subimos la imagen ANTES de la transacción: si la BD falla, se borra.
        $coverPath = $request->hasFile('cover_image')
            ? $request->file('cover_image')->store('covers', 'public')
            : null;

        try {
            $book = DB::transaction(function () use ($data, $coverPath, $request) {
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
                    'cover_image' => $coverPath,
                    'owner_id' => $request->user()->id,
                ]);

                $book->authors()->sync($data['author_ids']);

                return $book;
            });
        } catch (\Throwable $e) {
            if ($coverPath) {
                Storage::disk('public')->delete($coverPath);
            }
            throw $e;
        }

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

        $book = DB::transaction(function () use ($data, $book) {
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

            return $book;
        });

        return new BookResource($book->load(['genre', 'authors']));
    }

    public function destroy(Request $request, Book $book)
    {
        $this->authorize('delete', $book);

        $coverPath = $book->cover_image;

        try {
            $book->delete();
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') {
                //409
                throw ValidationException::withMessages([
                    'book' => ['No se puede eliminar el libro porque tiene copias vinculadas a préstamos.'],
                ]);
            }

            throw new HttpException(500, 'Error al eliminar el libro.');
        }

        if ($coverPath) {
            Storage::disk('public')->delete($coverPath);
        }

        return response()->json(null, 204);
    }

    public function updateCover(Request $request, Book $book)
    {
        $this->authorize('update', $book);

        $request->validate([
            'cover_image' => 'required|image|mimes:jpeg,png,webp|max:2048',
        ]);

        $newPath = $request->file('cover_image')->store('covers', 'public');
        $oldPath = $book->cover_image;

        try {
            $book->update(['cover_image' => $newPath]);
        } catch (\Throwable $e) {
            Storage::disk('public')->delete($newPath);
            throw $e;
        }

        if ($oldPath) {
            Storage::disk('public')->delete($oldPath);
        }

        return new BookResource($book->load(['genre', 'authors']));
    }

    public function deleteCover(Book $book)
    {
        $this->authorize('update', $book);

        $coverPath = $book->cover_image;

        $book->update(['cover_image' => null]);

        if ($coverPath) {
            Storage::disk('public')->delete($coverPath);
        }

        return response()->json(null, 204);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $path = $request->file('file')->getRealPath();
        $handle = fopen($path, 'r');
        $header = fgetcsv($handle);

        $imported = [];
        $failed = [];
        $row = 1;

        while (($line = fgetcsv($handle)) !== false) {
            $row++;

            $data = array_combine($header, $line);

            // Resolver genre_name → genre_id
            $genreName = trim($data['genre_name'] ?? '');
            $genre = \App\Models\Genre::where('name', $genreName)->first();

            if (! $genre) {
                $failed[] = [
                    'row'    => $row,
                    'data'   => $data,
                    'errors' => ['genre_name' => ["El género '{$genreName}' no existe."]],
                ];
                continue;
            }

            // Resolver author_name(s) separados por | → author_ids
            $authorNames = collect(explode('|', $data['author_name'] ?? ''))
                ->map(fn($name) => trim($name))
                ->filter()
                ->values();

            $authorIds = [];
            $authorErrors = [];

            foreach ($authorNames as $name) {
                $author = \App\Models\Author::where('name', $name)->first();

                if ($author) {
                    $authorIds[] = $author->id;
                } else {
                    $authorErrors[] = "El autor '{$name}' no existe.";
                }
            }

            if (! empty($authorErrors)) {
                $failed[] = [
                    'row'    => $row,
                    'data'   => $data,
                    'errors' => ['author_name' => $authorErrors],
                ];
                continue;
            }

            // Validar el resto de los campos
            $validator = validator([
                'title'            => $data['title'] ?? null,
                'genre_id'         => $genre->id,
                'publication_year' => $data['publication_year'] ?? null,
                'author_ids'       => $authorIds,
            ], [
                'title'            => 'required|string|max:255',
                'genre_id'         => 'required|exists:genres,id',
                'publication_year' => 'nullable|integer|min:1000|max:2099',
                'author_ids'       => 'required|array|min:1',
                'author_ids.*'     => 'exists:authors,id',
            ]);

            if ($validator->fails()) {
                $failed[] = [
                    'row'    => $row,
                    'data'   => $data,
                    'errors' => $validator->errors(),
                ];
                continue;
            }

            $validated = $validator->validated();

            try {
                $bookId = DB::transaction(function () use ($validated, $request) {
                    $existe = Book::where('title', $validated['title'])
                        ->whereHas('authors', fn($q) => $q->whereIn('author_id', $validated['author_ids']))
                        ->exists();

                    if ($existe) {
                        throw ValidationException::withMessages([
                            'title' => ['Ya existe un libro con este título y autor.'],
                        ]);
                    }

                    $book = Book::create([
                        'title'            => $validated['title'],
                        'genre_id'         => $validated['genre_id'],
                        'publication_year' => $validated['publication_year'] ?? null,
                        'cover_image'      => null,
                        'owner_id'         => $request->user()->id,
                    ]);

                    $book->authors()->sync($validated['author_ids']);

                    return $book->id;
                });

                $imported[] = $bookId;

            } catch (ValidationException $e) {
                $failed[] = [
                    'row'    => $row,
                    'data'   => $data,
                    'errors' => $e->errors(),
                ];
            }
        }

        fclose($handle);

        return response()->json([
            'imported_count' => count($imported),
            'failed_count'   => count($failed),
            'imported_ids'   => $imported,
            'failed'         => $failed,
        ]);
    }
}
