<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashMovement extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'session_id',
        'type', // CASH_IN, CASH_OUT
        'amount',
        'reason',
        'authorized_by_id',
        'authorized_by_name',
    ];

    protected $casts = [
        'amount' => 'float',
    ];

    public function session()
    {
        return $this->belongsTo(RegisterSession::class, 'session_id');
    }

    public function authorizedBy()
    {
        return $this->belongsTo(User::class, 'authorized_by_id');
    }
}
