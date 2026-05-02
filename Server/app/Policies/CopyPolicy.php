<?php

namespace App\Policies;

use App\Models\Book;
use App\Models\Copy;
use App\Models\User;

class CopyPolicy
{

    public function before(User $user): ?bool
    {
        // Admin tiene control total
        if ($user->isAdmin()) return true;
        return null; // null = continua
    }

    public function view(User $user, Book $book): bool
    {
        return true;
    }

    public function create(User $user, Book $book): bool
    {
        return true;
    }

    public function status(User $user, Book $book): bool
    {
        return true;
    }

    public function update(User $user, Copy $copy): bool
    {
        return $user->ownsCopy($copy);
    }

    public function delete(User $user, Copy $copy): bool
    {
        return $user->ownsCopy($copy);
    }
}
