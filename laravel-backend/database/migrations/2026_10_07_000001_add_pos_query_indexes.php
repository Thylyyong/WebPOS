<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['branch_id', 'status', 'created_at'], 'orders_branch_status_created_idx');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->index('order_id', 'order_items_order_id_idx');
            $table->index('product_id', 'order_items_product_id_idx');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->index(['branch_id', 'created_at'], 'expenses_branch_created_idx');
        });

        Schema::table('dining_tables', function (Blueprint $table) {
            $table->index('branch_id', 'dining_tables_branch_id_idx');
        });

        Schema::table('register_sessions', function (Blueprint $table) {
            $table->index(['branch_id', 'status', 'opened_at'], 'register_branch_status_opened_idx');
        });

        Schema::table('cash_movements', function (Blueprint $table) {
            $table->index('session_id', 'cash_movements_session_id_idx');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index('category_id', 'products_category_id_idx');
            $table->index('subcategory_id', 'products_subcategory_id_idx');
        });
    }

    public function down(): void
    {
        Schema::table('orders', fn (Blueprint $table) => $table->dropIndex('orders_branch_status_created_idx'));
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('order_items_order_id_idx');
            $table->dropIndex('order_items_product_id_idx');
        });
        Schema::table('expenses', fn (Blueprint $table) => $table->dropIndex('expenses_branch_created_idx'));
        Schema::table('dining_tables', fn (Blueprint $table) => $table->dropIndex('dining_tables_branch_id_idx'));
        Schema::table('register_sessions', fn (Blueprint $table) => $table->dropIndex('register_branch_status_opened_idx'));
        Schema::table('cash_movements', fn (Blueprint $table) => $table->dropIndex('cash_movements_session_id_idx'));
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_category_id_idx');
            $table->dropIndex('products_subcategory_id_idx');
        });
    }
};
