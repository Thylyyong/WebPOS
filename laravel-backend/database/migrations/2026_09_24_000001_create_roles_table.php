<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->string('id')->primary(); // e.g. 'role_admin', 'role_boss', 'role_cashier'
            $table->string('name');           // e.g. 'Administrator', 'Boss / Owner', 'Cashier'
            $table->string('code')->unique(); // e.g. 'ADMIN', 'BOSS', 'CASHIER', 'MANAGER', 'CHEF', 'WAITER'
            $table->text('description')->nullable();
            $table->json('permissions')->nullable();
            $table->boolean('is_system')->default(false);
            $table->timestamps();
        });

        // Seed default system roles
        $defaultRoles = [
            [
                'id' => 'role_boss',
                'name' => 'Boss / Owner',
                'code' => 'BOSS',
                'description' => 'Full store management, P&L financials, inventory, settings, and staff control',
                'permissions' => json_encode(['pos', 'tables', 'register', 'accounting', 'settlement', 'settings', 'manage_products', 'manage_roles']),
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 'role_admin',
                'name' => 'Administrator',
                'code' => 'ADMIN',
                'description' => 'System administrator with complete store oversight and role provisioning',
                'permissions' => json_encode(['pos', 'tables', 'register', 'accounting', 'settlement', 'settings', 'manage_products', 'manage_roles']),
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 'role_manager',
                'name' => 'Store Manager',
                'code' => 'MANAGER',
                'description' => 'Shift oversight, register session control, inventory adjustments, and reports',
                'permissions' => json_encode(['pos', 'tables', 'register', 'accounting', 'manage_products']),
                'is_system' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 'role_cashier',
                'name' => 'Frontline Cashier',
                'code' => 'CASHIER',
                'description' => 'POS checkout terminal, table billing, and cash drawer register transactions',
                'permissions' => json_encode(['pos', 'tables', 'register']),
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 'role_chef',
                'name' => 'Kitchen Chef',
                'code' => 'CHEF',
                'description' => 'Kitchen order display, order statuses, and table orders view',
                'permissions' => json_encode(['orders', 'tables']),
                'is_system' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 'role_waiter',
                'name' => 'Floor Waiter',
                'code' => 'WAITER',
                'description' => 'Dining floor table ordering, transfers, and split check requests',
                'permissions' => json_encode(['pos', 'tables']),
                'is_system' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('roles')->insert($defaultRoles);
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
