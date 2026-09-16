<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'order_id',
        'product_id',
        'product_name',
        'quantity',
        'unit_price',
        'cost_price',
        'total_price',
        'notes',
        'course',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'float',
        'cost_price' => 'float',
        'total_price' => 'float',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
