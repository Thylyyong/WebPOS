<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('register_sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('branch_id');
            $table->string('branch_name');
            $table->unsignedBigInteger('cashier_id')->nullable();
            $table->string('cashier_name');
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->decimal('opening_cash', 10, 2)->default(0.00);
            $table->text('opening_notes')->nullable();
            $table->decimal('closing_cash_counted', 10, 2)->default(0.00);
            $table->decimal('closing_card_counted', 10, 2)->default(0.00);
            $table->decimal('closing_customer_account_counted', 10, 2)->default(0.00);
            $table->decimal('expected_cash', 10, 2)->default(0.00);
            $table->decimal('cash_difference', 10, 2)->default(0.00);
            $table->text('closing_notes')->nullable();
            $table->string('status')->default('OPEN'); // OPEN, CLOSED
            $table->integer('total_orders')->default(0);
            $table->decimal('total_cash_sales', 10, 2)->default(0.00);
            $table->decimal('total_card_sales', 10, 2)->default(0.00);
            $table->decimal('total_qr_sales', 10, 2)->default(0.00);
            $table->decimal('total_cash_in', 10, 2)->default(0.00);
            $table->decimal('total_cash_out', 10, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('branch_id')->references('id')->on('branches')->cascadeOnDelete();
            $table->foreign('cashier_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('cash_movements', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('session_id');
            $table->string('type'); // CASH_IN, CASH_OUT
            $table->decimal('amount', 10, 2);
            $table->string('reason');
            $table->unsignedBigInteger('authorized_by_id')->nullable();
            $table->string('authorized_by_name')->nullable();
            $table->timestamps();

            $table->foreign('session_id')->references('id')->on('register_sessions')->cascadeOnDelete();
            $table->foreign('authorized_by_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_movements');
        Schema::dropIfExists('register_sessions');
    }
};
