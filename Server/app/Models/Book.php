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
        'author_id',
        'cover_image',
        'publication_year'
    ];
    protected $appends = [
        'authors_list',
    ];
    protected $hidden = [
        'authors',
        'created_at',
        'updated_at',
    ];

    public function authors() {
        return $this->belongsToMany(Author::class);
    }

    public function genre() {
        return $this->belongsTo(Genre::class, 'genre_id', 'id');
    }

    public function copies() {
        return $this->hasMany(Copy::class);
      //  return $this->belongsToMany(User::class, "copies", "book_id", "user_id")->using(Copy::class);
    }

    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }

    public function getAuthorsListAttribute() {
        return $this->authors->pluck(['name'])->toArray();
    }

    public function getCopiesListAttribute() {
        return $this->copies->pluck(['name'])->toArray();
    }

}
