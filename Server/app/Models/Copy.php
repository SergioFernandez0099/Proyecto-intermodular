<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Copy extends Model
{
    /** @use HasFactory<\Database\Factories\CopyFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $table = 'copies';

    protected $fillable = [
        'book_id',
        'owner_id',
        'code',
        'state'
    ];

    protected $hidden = [
        'created_at',
        'updated_at'
    ];

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function loans()
    {
        return $this->hasMany(Loan::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class);
    }
}
