<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HybridRoyaltyPayout extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'branch_id',
        'period_start',
        'period_end',
        'gross_product_sales',
        'base_rent_paid',
        'royalty_amount_paid',
        'total_payout_to_main_boss',
        'payment_status',
        'settled_at',
    ];

    protected $casts = [
        'gross_product_sales' => 'float',
        'base_rent_paid' => 'float',
        'royalty_amount_paid' => 'float',
        'total_payout_to_main_boss' => 'float',
        'period_start' => 'date',
        'period_end' => 'date',
        'settled_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
