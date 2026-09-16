<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('daily_reports', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('report_date');
            $table->decimal('total_revenue', 12, 2)->default(0.00);
            $table->integer('total_orders')->default(0);
            $table->decimal('cash_revenue', 12, 2)->default(0.00);
            $table->decimal('qr_revenue', 12, 2)->default(0.00);
            $table->string('top_selling_item')->nullable();
            $table->decimal('total_tax', 10, 2)->default(0.00);
            $table->timestamp('generated_at')->useCurrent();
            $table->timestamps();
        });

        Schema::create('receipt_logs', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('receipt_no');
            $table->string('order_id');
            $table->string('action'); // INITIAL_PRINT, REPRINT, PDF_EXPORT
            $table->timestamp('timestamp')->useCurrent();
            $table->boolean('is_success')->default(true);
            $table->text('error_message')->nullable();
            $table->string('receipt_file_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipt_logs');
        Schema::dropIfExists('daily_reports');
        Schema::dropIfExists('settings');
    }
};
