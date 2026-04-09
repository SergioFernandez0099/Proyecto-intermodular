<?php

namespace App\Policies;

use App\Models\Rating;
use App\Models\User;

class RatingPolicy
{

    public function update(User $user, Rating $rating): bool
    {
        // Solo puede modificar sus propias valoraciones
        return $user->ownsRating($rating);
    }

    public function delete(User $user, Rating $rating): bool
    {
        return $user->isAdmin() || $user->ownsRating($rating);
    }
}
