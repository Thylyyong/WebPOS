<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('category_id');
            $table->string('subcategory_id')->nullable();
            $table->string('sku')->nullable()->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->decimal('cost', 10, 2)->default(0.00); // Cost for COGS
            $table->string('barcode')->nullable()->index();
            $table->string('image_path')->nullable();
            $table->integer('in_stock')->default(1);
            $table->integer('stock_quantity')->default(100);
            $table->decimal('tax_rate', 5, 2)->default(10.00);
            $table->string('color_hex')->nullable()->default('#10B981');
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->foreign('category_id')->references('id')->on('categories')->cascadeOnDelete();
            $table->foreign('subcategory_id')->references('id')->on('subcategories')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
