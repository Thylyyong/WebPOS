<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->unique()->after('name');
            $table->string('pin_code')->default('1234')->after('password');
            $table->string('role')->default('STAFF_CASHIER')->after('pin_code'); // 'MAIN_BOSS', 'SUB_BOSS', 'STAFF_CASHIER', 'CHEF'
            $table->string('branch_id')->nullable()->after('role');
            $table->boolean('is_active')->default(true)->after('branch_id');
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn(['username', 'pin_code', 'role', 'branch_id', 'is_active']);
        });
    }
};
