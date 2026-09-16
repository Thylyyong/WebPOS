<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('branch_id');
            $table->string('category'); // SALARIES, UTILITIES, SUPPLIES, OPERATING, OTHER
            $table->string('title');
            $table->decimal('amount', 10, 2);
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('logged_by_user_id')->nullable();
            $table->string('logged_by_user_name')->nullable();
            $table->timestamps();

            $table->foreign('branch_id')->references('id')->on('branches')->cascadeOnDelete();
            $table->foreign('logged_by_user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
