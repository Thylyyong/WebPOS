<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RegisterSession extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'branch_id',
        'branch_name',
        'cashier_id',
        'cashier_name',
        'opened_at',
        'closed_at',
        'opening_cash',
        'opening_notes',
        'closing_cash_counted',
        'closing_card_counted',
        'closing_customer_account_counted',
        'expected_cash',
        'cash_difference',
        'closing_notes',
        'status',
        'total_orders',
        'total_cash_sales',
        'total_card_sales',
        'total_qr_sales',
        'total_cash_in',
        'total_cash_out',
    ];

    protected $casts = [
        'opening_cash' => 'float',
        'closing_cash_counted' => 'float',
        'closing_card_counted' => 'float',
        'closing_customer_account_counted' => 'float',
        'expected_cash' => 'float',
        'cash_difference' => 'float',
        'total_orders' => 'integer',
        'total_cash_sales' => 'float',
        'total_card_sales' => 'float',
        'total_qr_sales' => 'float',
        'total_cash_in' => 'float',
        'total_cash_out' => 'float',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function cashMovements()
    {
        return $this->hasMany(CashMovement::class, 'session_id');
    }
}
