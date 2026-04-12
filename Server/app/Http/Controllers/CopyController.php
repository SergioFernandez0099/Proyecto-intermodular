<?php

namespace App\Http\Controllers;

use App\Http\Resources\CopyResource;
use App\Models\Book;
use App\Models\Copy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CopyController extends Controller
{

    public function byBook(Book $book)
    {
        $this->authorize('view', [Copy::class, $book]);

        return CopyResource::collection($book->copies);
    }

    public function storeByBook(Request $request, Book $book)
    {
        $this->authorize('create', [Copy::class, $book]);

        // Máximo 50
        $request->validate([
            'quantity' => 'sometimes|integer|min:1|max:50',
        ]);

        $quantity = $request->input('quantity', 1);

        $copies = DB::transaction(function () use ($book, $quantity) {
            $copies = [];
            for ($i = 0; $i < $quantity; $i++) {
                $copy = Copy::create([
                    'book_id' => $book->id,
                    'code' => self::generateCode($book->id),
                    'state' => 'available',
                ]);
                $copies[] = $copy->load('book');
            }
            return $copies;
        });

        return CopyResource::collection(collect($copies));
    }

    public function update(Request $request, Book $book, Copy $copy)
    {
        $this->authorize('update', $copy);

        $data = $request->validate([
            'state' => 'required|in:available,borrowed',
        ]);

        $copy->update($data);

        return new CopyResource($copy->load('book'));
    }

    public function destroy(Book $book, Copy $copy)
    {
        $this->authorize('delete', $copy);

        if ($copy->state === 'borrowed') {
            throw ValidationException::withMessages([
                'copy' => ['No se puede eliminar una copia que está prestada.'],
            ]);
        }

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
