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

    public function mine(Request $request)
    {
        $copies = Copy::with(['book', 'owner'])
           ->where('owner_id', $request->user()->id)->get();
        return CopyResource::collection($copies);
    }

    public function storeByBook(Request $request, Book $book)
    {
        $this->authorize('storeCopy', $book);

        // Máximo 50
        $request->validate([
            'quantity' => 'sometimes|integer|min:1|max:50',
        ]);

        $quantity = $request->input('quantity', 1);

        $copies = DB::transaction(function () use ($book, $quantity, $request) {
            $copies = [];
            for ($i = 0; $i < $quantity; $i++) {
                $copy = Copy::create([
                    'book_id' => $book->id,
                    'code' => self::generateCode($book->id),
                    'state' => 'available',
                    'owner_id' => $request->user()->id,
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

    public function status(Book $book)
    {
        $this->authorize('status', [Copy::class, $book]);

        $copies = Copy::where('book_id', $book->id)
            ->with([
                'loans' => fn($q) => $q->whereNull('return_date')
                    ->with('user')
                    ->latest()
            ])
            ->get();

        $data = $copies->map(function ($copy) {
            $activeLoan = $copy->loans->first();

            return [
                'id'          => $copy->id,
                'code'        => $copy->code,
                'state'       => $copy->state,
                'active_loan' => $activeLoan ? [
                    'id'        => $activeLoan->id,
                    'created_at' => $activeLoan->created_at,
                    'user'      => [
                        'id'   => $activeLoan->user->id,
                        'name' => $activeLoan->user->name,
                    ],
                ] : null,
            ];
        });

        return response()->json(['data' => $data]);
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
