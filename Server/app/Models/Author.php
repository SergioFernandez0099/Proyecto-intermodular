<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Author extends Model
{
    /** @use HasFactory<\Database\Factories\AuthorFactory> */
    use HasFactory;

    // Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name'
    ];

    protected $appends = [
        'books_list'
    ];

    protected $hidden = [
        'books',
        'created_at',
        'updated_at'
    ];

    public function books()
    {
        return $this->belongsToMany(Book::class, 'book_author');
    }

    public function getBooksListAttribute()
    {
        return $this->books->pluck(['title'])->toArray();
    }
}
