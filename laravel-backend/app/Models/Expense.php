<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'branch_id',
        'category', // SALARIES, UTILITIES, SUPPLIES, OPERATING, OTHER
        'title',
        'amount',
        'notes',
        'logged_by_user_id',
        'logged_by_user_name',
    ];

    protected $casts = [
        'amount' => 'float',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function loggedByUser()
    {
        return $this->belongsTo(User::class, 'logged_by_user_id');
    }
}
