<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    public $incrementing = false;
    protected $primaryKey = 'key';
    protected $keyType = 'string';

    protected $fillable = [
        'key',
        'value',
    ];

    public static function getVal(string $key, ?string $default = null): ?string
    {
        $item = static::find($key);
        return $item ? $item->value : $default;
    }

    public static function setVal(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
