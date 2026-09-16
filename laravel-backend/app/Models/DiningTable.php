<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiningTable extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'branch_id',
        'table_number',
        'name',
        'zone',
        'capacity',
        'status',
        'type',
        'current_order_id',
        'customer_name',
        'order_total',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'order_total' => 'float',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function currentOrder()
    {
        return $this->belongsTo(Order::class, 'current_order_id');
    }
}
