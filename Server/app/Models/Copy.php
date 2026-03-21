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
    public $incrementing = true;

    protected $fillable = [
        'id',
        'user_id',
        'book_id'
    ];
}
