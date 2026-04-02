<?php

namespace App\Http\Controllers;

use App\Http\Resources\LoanResource;
use App\Models\Copy;
use App\Models\Loan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoanController extends Controller
{
    // Admin ve todos | User solo los suyos
    public function index()
    {
        $user = Auth::user();

        $loans = Loan::with(['copy.book', 'user'])
            ->when(! $user->isAdmin(), fn($q) => $q->where('user_id', $user->id))
            ->latest()
            ->paginate(15);

        return LoanResource::collection($loans);
    }

    public function show(Loan $loan)
    {
        // User solo puede ver sus propios préstamos
        if (! Auth::user()->isAdmin() && $loan->user_id !== Auth::id()) {
            abort(403);
        }

        return new LoanResource($loan->load(['copy.book', 'user']));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'copy_id'   => 'required|exists:copies,id',
            'loan_date' => 'required|date',
        ]);

        $copy = Copy::findOrFail($data['copy_id']);

        if ($copy->state !== 'available') {
            return response()->json(['message' => 'La copia no está disponible.'], 422);
        }

        $loan = Loan::create([
            'user_id'   => Auth::id(),
            'copy_id'   => $copy->id,
            'loan_date' => $data['loan_date'],
        ]);

        $copy->update(['state' => 'borrowed']);

        return new LoanResource($loan->load('copy.book'));
    }

    // PATCH /api/loans/{loan}/return
    public function return(Loan $loan)
    {
        if (! Auth::user()->isAdmin() && $loan->user_id !== Auth::id()) {
            abort(403);
        }

        if ($loan->return_date) {
            return response()->json(['message' => 'Este préstamo ya fue devuelto.'], 422);
        }

        $loan->update(['return_date' => now()->toDateString()]);
        $loan->copy->update(['state' => 'available']);

        return new LoanResource($loan->load('copy.book'));
    }
}
