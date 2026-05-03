<?php

namespace App\Http\Controllers;

use App\Http\Resources\LoanResource;
use App\Models\Copy;
use App\Models\Loan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoanController extends Controller
{
    // Admin ve todos | User solo los suyos (como prestatario o como dueño de la copia)
    public function index()
    {
        $user = Auth::user();

        $relations = $user->isAdmin()
            ? ['copy.book.genre', 'copy.book.authors', 'user']
            : ['copy.book.genre', 'copy.book.authors'];

        $loans = Loan::with($relations)
            ->when(!$user->isAdmin(), function($query) use ($user) {
                $query->where(function($q) use ($user) {
                    $q->where('user_id', $user->id) // Préstamos donde el usuario es prestatario
                      ->orWhereHas('copy', fn($copyQ) => $copyQ->where('owner_id', $user->id)); // Préstamos de copias que el usuario posee
                });
            })
            ->latest()
            ->get();

        return LoanResource::collection($loans);
    }

    public function show(Loan $loan)
    {
        $loan->load('copy'); // Cargar relación antes de authorize
        $this->authorize('view', $loan);

        $relations = auth()->user()->isAdmin()
            ? ['copy.book.genre', 'copy.book.authors', 'user']
            : ['copy.book.genre', 'copy.book.authors'];

        return new LoanResource($loan->load($relations));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'book_id' => 'required|exists:books,id',
        ]);

        return DB::transaction(function () use ($data) {
            // lockForUpdate() evita que otra petición simultánea agarre la misma copia
            $copy = Copy::with('book')
                ->where('book_id', $data['book_id'])
                ->where('state', 'available')
                ->lockForUpdate()
                ->first();

            if (!$copy) {
                throw ValidationException::withMessages([
                    'loan' => ['No hay copias disponibles para este libro.'],
                ]);
            }

            if ($copy->book->owner_id === Auth::id()) {
                throw ValidationException::withMessages([
                    'loan' => ['No puedes tomar prestado un libro tuyo.'],
                ]);
            }

            $copy->update(['state' => 'borrowed']);

            $loan = Loan::create([
                'user_id' => Auth::id(),
                'copy_id' => $copy->id,
                'loan_date' => now(),
            ]);

            return new LoanResource($loan->load(['copy.book.genre', 'copy.book.authors']));
        });
    }

    public function return(Loan $loan)
    {
        $loan->load('copy'); // Cargar relación antes de authorize
        $this->authorize('return', $loan);

        return DB::transaction(function () use ($loan) {
            $loan = Loan::where('id', $loan->id)->lockForUpdate()->first();

            if ($loan->return_date) {
                throw ValidationException::withMessages([
                    'loan' => ['Este préstamo ya fue devuelto.'],
                ]);
            }

            $loan->update(['return_date' => now()]);
            $loan->copy()->update(['state' => 'available']);

            return new LoanResource($loan->load(['copy.book.genre', 'copy.book.authors']));
        });
    }
}
