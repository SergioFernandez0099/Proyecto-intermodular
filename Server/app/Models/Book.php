<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Author;
use App\Models\Genre;

class Book extends Model {
    /** @use HasFactory<\Database\Factories\BookFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'genre_id',
        'owner_id',
        'cover_image',
        'publication_year'
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'publication_year' => 'integer',
    ];

    public function authors() {
        return $this->belongsToMany(Author::class,'book_author');
    }

    public function genre() {
        return $this->belongsTo(Genre::class);
    }

    public function copies() {
        return $this->hasMany(Copy::class);
    }

    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }
}
