<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'pin_code',
        'role',
        'branch_id',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'cashier_id');
    }

    public function registerSessions()
    {
        return $this->hasMany(RegisterSession::class, 'cashier_id');
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'logged_by_user_id');
    }

    public function isMainBoss(): bool
    {
        return in_array($this->role, ['BOSS', 'MAIN_BOSS', 'OWNER']);
    }

    public function isSubBoss(): bool
    {
        return in_array($this->role, ['SUB_BOSS', 'MANAGER']);
    }

    public function isCashier(): bool
    {
        return in_array($this->role, ['CASHIER', 'STAFF_CASHIER']);
    }
}
