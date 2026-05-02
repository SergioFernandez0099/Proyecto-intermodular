<?php

namespace App\Policies;

use App\Models\Loan;
use App\Models\User;

class LoanPolicy
{

    public function before(User $user): ?bool
    {
        // Admin tiene control total
        if ($user->isAdmin()) return true;
        return null; // null = continua
    }

    public function view(User $user, Loan $loan): bool
    {
        return $user->isInvolvedInLoan($loan);
    }

    public function return(User $user, Loan $loan): bool
    {
        return $user->ownsLoan($loan); 
    }
}
