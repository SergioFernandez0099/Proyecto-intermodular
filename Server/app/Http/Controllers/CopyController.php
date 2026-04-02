<?php

namespace App\Http\Controllers;

use App\Http\Resources\CopyResource;
use App\Models\Book;
use App\Models\Copy;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CopyController extends Controller
{
    public function index()
    {
        return CopyResource::collection(
            Copy::with('book')->paginate(15)
        );
    }

    public function byBook(Book $book)
    {
        return CopyResource::collection(
            $book->copies()->paginate(15)
        );
    }

    public function show(Copy $copy)
    {
        return new CopyResource($copy->load('book'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'book_id' => 'required|exists:books,id',
            'state'   => 'sometimes|in:available,borrowed',
        ]);

        $data['code'] = self::generateCode($data['book_id']);

        $copy = Copy::create($data);

        return new CopyResource($copy->load('book'));
    }

    // Cualquier usuario autenticado puede añadir copias a sus propios libros
    public function storeByBook(Request $request, Book $book)
    {
        // Verifica que el libro pertenece al usuario autenticado
        // Los admins pueden añadir copias a cualquier libro
        if (! $request->user()->isAdmin() && $book->owner_id !== $request->user()->id) {
            throw new AuthorizationException();
        }

        $data = $request->validate([
            'state' => 'sometimes|in:available,borrowed',
        ]);

        $data['code'] = self::generateCode($data['book_id']);

        $copy = $book->copies()->create($data);

        return new CopyResource($copy->load('book'));
    }

    // revisar que el code no se pueda modificar
    public function update(Request $request, Copy $copy)
    {
        $data = $request->validate([
            'state' => 'sometimes|in:available,borrowed',
        ]);

        $copy->update($data);

        return new CopyResource($copy->load('book'));
    }

    public function destroy(Copy $copy)
    {
        $copy->delete();

        return response()->json(null, 204);
    }

    // Generador de código único
    private static function generateCode(int $bookId): string
    {
        do {
            $code = sprintf(
                'COPY-%d-%d-%s',
                $bookId,
                now()->timestamp,
                strtoupper(Str::random(4))
            );
            // Repite si por casualidad el código ya existe
        } while (Copy::where('code', $code)->exists());

        return $code;
    }
}
