<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'category_id',
        'subcategory_id',
        'sku',
        'name',
        'description',
        'price',
        'cost',
        'barcode',
        'image_path',
        'in_stock',
        'stock_quantity',
        'tax_rate',
        'color_hex',
        'is_available',
    ];

    protected $casts = [
        'price' => 'float',
        'cost' => 'float',
        'in_stock' => 'integer',
        'stock_quantity' => 'integer',
        'tax_rate' => 'float',
        'is_available' => 'boolean',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        if (empty($this->image_path)) {
            return null;
        }

        if (str_starts_with($this->image_path, 'http://') || str_starts_with($this->image_path, 'https://') || str_starts_with($this->image_path, 'data:image/')) {
            return $this->image_path;
        }

        $cleanPath = ltrim($this->image_path, '/');
        return url($cleanPath);
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function subcategory()
    {
        return $this->belongsTo(Subcategory::class, 'subcategory_id');
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'product_id');
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }
}
