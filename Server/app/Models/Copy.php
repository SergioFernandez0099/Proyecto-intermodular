<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\Pivot;

class Copy extends Pivot {
    /** @use HasFactory<\Database\Factories\CopyFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $table = 'copies';

    protected $fillable = [
        'id',
        'user_id',
        'book_id'
    ];

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function loans()
    {
        return $this->hasMany(Loan::class);
    }
}
