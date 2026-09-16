<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hybrid_settlement_configs', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('branch_id')->unique();
            $table->decimal('base_rent_amount', 10, 2)->default(500.00); // Fixed Low Base Rent ($)
            $table->decimal('royalty_percent', 5, 2)->default(3.00);      // Low % of Product Sales
            $table->string('settlement_cycle')->default('MONTHLY');       // DAILY, WEEKLY, MONTHLY
            $table->timestamps();

            $table->foreign('branch_id')->references('id')->on('branches')->cascadeOnDelete();
        });

        Schema::create('hybrid_royalty_payouts', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('branch_id');
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('gross_product_sales', 12, 2)->default(0.00);
            $table->decimal('base_rent_paid', 10, 2)->default(500.00);
            $table->decimal('royalty_amount_paid', 10, 2)->default(0.00);
            $table->decimal('total_payout_to_main_boss', 12, 2)->default(0.00);
            $table->string('payment_status')->default('SETTLED'); // PENDING, SETTLED
            $table->timestamp('settled_at')->nullable();
            $table->timestamps();

            $table->foreign('branch_id')->references('id')->on('branches')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hybrid_royalty_payouts');
        Schema::dropIfExists('hybrid_settlement_configs');
    }
};
