<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'lastname',
        'email',
        'password',
        'role',
        "active"
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'created_at',
        'updated_at',
        'email_verified_at'
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'active' => 'boolean'
        ];
    }

    protected $attributes = [
        'role' => 'user',
        'active' => true,
    ];

    public function books()
    {
        return $this->hasMany(Book::class, 'owner_id');
    }

    public function loans()
    {
        return $this->hasMany(Loan::class);
    }

    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    // Métodos de autorización
    public function ownsBook(Book $book): bool
    {
        return $this->id === $book->owner_id;
    }

    public function ownsLoan(Loan $loan): bool
    {
        return $this->id === $loan->user_id;
    }

    public function ownsRating(Rating $rating): bool
    {
        return $this->id === $rating->user_id;
    }

    public function ownsCopy(Copy $copy): bool
    {
        return $this->ownsBook($copy->book);
    }

    public function setRememberToken($value): void
    {
        // API stateful con cookies, no necesitamos remember me
    }
}
