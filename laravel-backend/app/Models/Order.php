<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'branch_id',
        'receipt_no',
        'order_number',
        'cashier_id',
        'table_id',
        'table_number',
        'customer_name',
        'order_type',
        'subtotal',
        'discount_amount',
        'discount_percent',
        'tax_amount',
        'tax_rate',
        'total_amount',
        'payment_method',
        'cash_tendered',
        'change_amount',
        'status',
        'kitchen_status',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'discount_amount' => 'float',
        'discount_percent' => 'float',
        'tax_amount' => 'float',
        'tax_rate' => 'float',
        'total_amount' => 'float',
        'cash_tendered' => 'float',
        'change_amount' => 'float',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    public function diningTable()
    {
        return $this->belongsTo(DiningTable::class, 'table_id');
    }

    public function receiptLogs()
    {
        return $this->hasMany(ReceiptLog::class, 'order_id');
    }

    /**
     * Compute total Cost of Goods Sold (COGS) for this order
     */
    public function getCogsAttribute(): float
    {
        return (float) $this->items->sum(function ($item) {
            return $item->cost_price * $item->quantity;
        });
    }
}
