<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyReport extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'report_date',
        'total_revenue',
        'total_orders',
        'cash_revenue',
        'qr_revenue',
        'top_selling_item',
        'total_tax',
        'generated_at',
    ];

    protected $casts = [
        'total_revenue' => 'float',
        'total_orders' => 'integer',
        'cash_revenue' => 'float',
        'qr_revenue' => 'float',
        'total_tax' => 'float',
        'generated_at' => 'datetime',
    ];
}
