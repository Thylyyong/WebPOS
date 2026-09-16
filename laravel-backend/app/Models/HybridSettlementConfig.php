<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HybridSettlementConfig extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'branch_id',
        'base_rent_amount',
        'royalty_percent',
        'settlement_cycle',
    ];

    protected $casts = [
        'base_rent_amount' => 'float',
        'royalty_percent' => 'float',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
