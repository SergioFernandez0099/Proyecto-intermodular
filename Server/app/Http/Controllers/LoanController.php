<?php

namespace App\Http\Controllers;

use App\Http\Resources\LoanResource;
use App\Models\Copy;
use App\Models\Loan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoanController extends Controller
{
    // Admin ve todos | User solo los suyos
    public function index()
    {
        $user = Auth::user();

        $loans = Loan::with(['copy.book', 'user'])
            ->when(!$user->isAdmin(), fn($q) => $q->where('user_id', $user->id))
            ->latest()
            ->get();

        return LoanResource::collection($loans);
    }

    public function show(Loan $loan)
    {
        $this->authorize('view', $loan);

        return new LoanResource($loan->load(['copy.book', 'user']));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'copy_id' => 'required|exists:copies,id',
        ]);

        $copy = Copy::findOrFail($data['copy_id']);

        if ($copy->state !== 'available') {
            throw ValidationException::withMessages([
                'loan' => ['La copia no está disponible.'],
            ]);
        }

        $loan = Loan::create([
            'user_id' => Auth::id(),
            'copy_id' => $copy->id,
            'loan_date' => now(),
        ]);

        $copy->update(['state' => 'borrowed']);

        return new LoanResource($loan->load('copy.book'));
    }

    public function return(Loan $loan)
    {
        $this->authorize('return', $loan);

        if ($loan->return_date) {
            throw ValidationException::withMessages([
                'loan' => ['Este préstamo ya fue devuelto.'],
            ]);
        }

        $loan->update(['return_date' => now()->toDateString()]);
        $loan->copy->update(['state' => 'available']);

        return new LoanResource($loan->load('copy.book'));
    }
}
