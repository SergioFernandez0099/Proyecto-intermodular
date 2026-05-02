<?php

namespace App\Policies;

use App\Models\Book;
use App\Models\User;

class BookPolicy
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

    public function update(User $user, Book $book): bool
    {
        //return $user->ownsBook($book);
        return true;
    }

    public function delete(User $user, Book $book): bool
    {
        //return $user->ownsBook($book);
        return false;
    }

    public function storeCopy(User $user, Book $book): bool
    {
        //return $user->ownsBook($book);
        return true;
    }
}
