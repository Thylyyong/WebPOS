<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'branch_name',
        'branch_code',
        'address',
        'phone',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'branch_id');
    }

    public function diningTables()
    {
        return $this->hasMany(DiningTable::class, 'branch_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'branch_id');
    }

    public function registerSessions()
    {
        return $this->hasMany(RegisterSession::class, 'branch_id');
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'branch_id');
    }

    public function hybridConfig()
    {
        return $this->hasOne(HybridSettlementConfig::class, 'branch_id');
    }

    public function hybridPayouts()
    {
        return $this->hasMany(HybridRoyaltyPayout::class, 'branch_id');
    }
}
