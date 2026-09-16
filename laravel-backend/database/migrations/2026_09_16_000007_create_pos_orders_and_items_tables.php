<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('branch_id')->default('store_a');
            $table->string('receipt_no')->unique();
            $table->string('order_number')->nullable();
            $table->unsignedBigInteger('cashier_id')->nullable();
            $table->string('table_id')->nullable();
            $table->string('table_number')->nullable();
            $table->string('customer_name')->nullable();
            $table->string('order_type')->default('DINE_IN'); // DINE_IN, TAKEAWAY, DELIVERY
            $table->decimal('subtotal', 10, 2);
            $table->decimal('discount_amount', 10, 2)->default(0.00);
            $table->decimal('discount_percent', 5, 2)->default(0.00);
            $table->decimal('tax_amount', 10, 2)->default(0.00);
            $table->decimal('tax_rate', 5, 2)->default(10.00);
            $table->decimal('total_amount', 10, 2);
            $table->string('payment_method')->default('CASH'); // CASH, QR, CARD, CUSTOMER_ACCOUNT
            $table->decimal('cash_tendered', 10, 2)->default(0.00);
            $table->decimal('change_amount', 10, 2)->default(0.00);
            $table->string('status')->default('COMPLETED'); // COMPLETED, PARKED, CANCELLED
            $table->string('kitchen_status')->default('PENDING'); // PENDING, PREPARING, READY, SERVED
            $table->timestamps();

            $table->foreign('branch_id')->references('id')->on('branches')->cascadeOnDelete();
            $table->foreign('cashier_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('order_id');
            $table->string('product_id')->nullable();
            $table->string('product_name');
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('cost_price', 10, 2)->default(0.00); // Historical cost for COGS
            $table->decimal('total_price', 10, 2);
            $table->text('notes')->nullable();
            $table->string('course')->default('MAIN'); // STARTER, MAIN, DESSERT, BEVERAGE
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('products')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
