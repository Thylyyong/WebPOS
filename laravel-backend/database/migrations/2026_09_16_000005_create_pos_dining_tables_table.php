<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dining_tables', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('branch_id')->default('store_a');
            $table->string('table_number');
            $table->string('name');
            $table->string('zone')->default('Main Hall');
            $table->integer('capacity')->default(4);
            $table->string('status')->default('AVAILABLE'); // AVAILABLE, OCCUPIED, BILLED, RESERVED
            $table->string('type')->default('STANDARD'); // STANDARD, VIP_ROOM, OUTDOOR, BAR
            $table->string('current_order_id')->nullable();
            $table->string('customer_name')->nullable();
            $table->decimal('order_total', 10, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('branch_id')->references('id')->on('branches')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dining_tables');
    }
};
