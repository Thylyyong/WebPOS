<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceiptLog extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'receipt_no',
        'order_id',
        'action', // INITIAL_PRINT, REPRINT, PDF_EXPORT
        'timestamp',
        'is_success',
        'error_message',
        'receipt_file_path',
    ];

    protected $casts = [
        'is_success' => 'boolean',
        'timestamp' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
