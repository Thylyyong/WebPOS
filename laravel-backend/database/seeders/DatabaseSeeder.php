<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Subcategory;
use App\Models\Product;
use App\Models\DiningTable;
use App\Models\User;
use App\Models\Setting;
use App\Models\HybridSettlementConfig;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Expense;
use App\Models\RegisterSession;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Clean Main Store Branch
        Branch::query()->delete();
        $branch = Branch::create([
            'id' => 'store_main',
            'branch_name' => 'OmniPOS Main Store',
            'branch_code' => 'MAIN-01',
            'address' => '100 Innovation Blvd, Downtown Central',
            'phone' => '+1 (555) 019-2834',
            'is_active' => true,
        ]);

        // 2. Seed EXACTLY 2 Users: Boss & Cashier
        $users = [
            [
                'name' => 'Boss',
                'username' => 'boss',
                'email' => 'boss@omnipos.com',
                'password' => Hash::make('secret9999'),
                'pin_code' => '9999',
                'role' => 'BOSS',
                'branch_id' => 'store_main',
                'is_active' => true,
            ],
            [
                'name' => 'Cashier',
                'username' => 'cashier',
                'email' => 'cashier@omnipos.com',
                'password' => Hash::make('secret1234'),
                'pin_code' => '1234',
                'role' => 'CASHIER',
                'branch_id' => 'store_main',
                'is_active' => true,
            ],
        ];

        // Delete any existing other users so only Boss and Cashier remain
        User::query()->delete();
        foreach ($users as $u) {
            User::create($u);
        }

        $bossUser = User::where('username', 'boss')->first();
        $cashierUser = User::where('username', 'cashier')->first();

        // 3. Seed Clean Categories
        Category::query()->delete();
        $catCoffee = Category::create([
            'id' => 'cat_coffee',
            'name' => 'Coffee & Drinks',
            'icon' => '☕',
            'color_hex' => '#D97706',
            'display_order' => 1,
        ]);

        $catFood = Category::create([
            'id' => 'cat_food',
            'name' => 'Gourmet Food',
            'icon' => '🍔',
            'color_hex' => '#EF4444',
            'display_order' => 2,
        ]);

        $catBakery = Category::create([
            'id' => 'cat_bakery',
            'name' => 'Bakery & Dessert',
            'icon' => '🍰',
            'color_hex' => '#10B981',
            'display_order' => 3,
        ]);

        // 4. Seed Clean Products with Price, Cost (for COGS), and Barcode
        Product::query()->delete();
        $products = [
            // Coffee & Drinks
            [
                'id' => 'prod_espresso',
                'category_id' => $catCoffee->id,
                'name' => 'Artisan Espresso',
                'sku' => 'COF-001',
                'barcode' => '200001',
                'price' => 3.50,
                'cost' => 0.85,
                'stock_quantity' => 150,
                'is_available' => true,
            ],
            [
                'id' => 'prod_latte',
                'category_id' => $catCoffee->id,
                'name' => 'Caramel Vanilla Latte',
                'sku' => 'COF-002',
                'barcode' => '200002',
                'price' => 4.95,
                'cost' => 1.20,
                'stock_quantity' => 120,
                'is_available' => true,
            ],
            [
                'id' => 'prod_matcha',
                'category_id' => $catCoffee->id,
                'name' => 'Ceremonial Uji Matcha',
                'sku' => 'COF-003',
                'barcode' => '200003',
                'price' => 5.50,
                'cost' => 1.60,
                'stock_quantity' => 90,
                'is_available' => true,
            ],
            [
                'id' => 'prod_iced_tea',
                'category_id' => $catCoffee->id,
                'name' => 'Passion Peach Iced Tea',
                'sku' => 'COF-004',
                'barcode' => '200004',
                'price' => 4.25,
                'cost' => 0.90,
                'stock_quantity' => 100,
                'is_available' => true,
            ],

            // Gourmet Food
            [
                'id' => 'prod_wagyu_burger',
                'category_id' => $catFood->id,
                'name' => 'Truffle Wagyu Burger Deluxe',
                'sku' => 'FOOD-001',
                'barcode' => '200005',
                'price' => 16.50,
                'cost' => 5.80,
                'stock_quantity' => 50,
                'is_available' => true,
            ],
            [
                'id' => 'prod_crispy_chicken',
                'category_id' => $catFood->id,
                'name' => 'Korean Crispy Chicken Burger',
                'sku' => 'FOOD-002',
                'barcode' => '200006',
                'price' => 13.95,
                'cost' => 4.20,
                'stock_quantity' => 60,
                'is_available' => true,
            ],
            [
                'id' => 'prod_truffle_fries',
                'category_id' => $catFood->id,
                'name' => 'Parmesan Truffle Fries',
                'sku' => 'FOOD-003',
                'barcode' => '200007',
                'price' => 7.50,
                'cost' => 1.90,
                'stock_quantity' => 80,
                'is_available' => true,
            ],
            [
                'id' => 'prod_pasta_carbonara',
                'category_id' => $catFood->id,
                'name' => 'Classic Carbonara Pasta',
                'sku' => 'FOOD-004',
                'barcode' => '200008',
                'price' => 14.50,
                'cost' => 4.50,
                'stock_quantity' => 45,
                'is_available' => true,
            ],

            // Bakery & Dessert
            [
                'id' => 'prod_croissant',
                'category_id' => $catBakery->id,
                'name' => 'Butter Almond Croissant',
                'sku' => 'BAKE-001',
                'barcode' => '200009',
                'price' => 4.20,
                'cost' => 1.10,
                'stock_quantity' => 40,
                'is_available' => true,
            ],
            [
                'id' => 'prod_cheesecake',
                'category_id' => $catBakery->id,
                'name' => 'Burnt Basque Cheesecake',
                'sku' => 'BAKE-002',
                'barcode' => '200010',
                'price' => 6.95,
                'cost' => 2.10,
                'stock_quantity' => 35,
                'is_available' => true,
            ],
            [
                'id' => 'prod_tiramisu',
                'category_id' => $catBakery->id,
                'name' => 'Venetian Tiramisu Cup',
                'sku' => 'BAKE-003',
                'barcode' => '200011',
                'price' => 6.50,
                'cost' => 1.95,
                'stock_quantity' => 30,
                'is_available' => true,
            ],
            [
                'id' => 'prod_brownie',
                'category_id' => $catBakery->id,
                'name' => 'Double Dark Chocolate Brownie',
                'sku' => 'BAKE-004',
                'barcode' => '200012',
                'price' => 4.50,
                'cost' => 1.30,
                'stock_quantity' => 50,
                'is_available' => true,
            ],
        ];

        foreach ($products as $p) {
            Product::create($p);
        }

        // 5. Seed Clean Dining Tables (8 tables across 2 zones)
        DiningTable::query()->delete();
        $tables = [
            ['id' => 'tbl_01', 'branch_id' => 'store_main', 'table_number' => 'Table 1', 'zone' => 'Main Dining', 'capacity' => 2, 'status' => 'AVAILABLE'],
            ['id' => 'tbl_02', 'branch_id' => 'store_main', 'table_number' => 'Table 2', 'zone' => 'Main Dining', 'capacity' => 4, 'status' => 'AVAILABLE'],
            ['id' => 'tbl_03', 'branch_id' => 'store_main', 'table_number' => 'Table 3', 'zone' => 'Main Dining', 'capacity' => 4, 'status' => 'OCCUPIED', 'customer_name' => 'VIP Table', 'order_total' => 24.50],
            ['id' => 'tbl_04', 'branch_id' => 'store_main', 'table_number' => 'Table 4', 'zone' => 'Main Dining', 'capacity' => 6, 'status' => 'AVAILABLE'],
            ['id' => 'tbl_05', 'branch_id' => 'store_main', 'table_number' => 'Terrace 1', 'zone' => 'Terrace Garden', 'capacity' => 2, 'status' => 'AVAILABLE'],
            ['id' => 'tbl_06', 'branch_id' => 'store_main', 'table_number' => 'Terrace 2', 'zone' => 'Terrace Garden', 'capacity' => 4, 'status' => 'AVAILABLE'],
            ['id' => 'tbl_07', 'branch_id' => 'store_main', 'table_number' => 'Terrace 3', 'zone' => 'Terrace Garden', 'capacity' => 4, 'status' => 'AVAILABLE'],
            ['id' => 'tbl_08', 'branch_id' => 'store_main', 'table_number' => 'VIP Lounge', 'zone' => 'VIP Lounge', 'capacity' => 8, 'status' => 'AVAILABLE'],
        ];

        foreach ($tables as $t) {
            $t['name'] = $t['table_number'];
            DiningTable::create($t);
        }

        // 6. Seed Clean Active Register Session for Cashier
        RegisterSession::query()->delete();
        $session = RegisterSession::create([
            'id' => 'reg_sess_active_01',
            'branch_id' => 'store_main',
            'branch_name' => 'OmniPOS Main Store',
            'cashier_id' => $cashierUser->id,
            'cashier_name' => $cashierUser->name,
            'opened_at' => Carbon::now()->subHours(3),
            'opening_cash' => 300.00,
            'opening_notes' => 'Morning shift drawer initialized',
            'closing_cash_counted' => 0.00,
            'closing_card_counted' => 0.00,
            'expected_cash' => 348.50,
            'cash_difference' => 0.00,
            'status' => 'OPEN',
            'total_orders' => 2,
            'total_cash_sales' => 48.50,
            'total_card_sales' => 32.00,
            'total_qr_sales' => 0.00,
            'total_cash_in' => 0.00,
            'total_cash_out' => 0.00,
        ]);

        // 7. Seed Clean Operational Expenses
        Expense::query()->delete();
        Expense::create([
            'id' => 'exp_01',
            'branch_id' => 'store_main',
            'logged_by_user_id' => $bossUser->id,
            'title' => 'Fresh Milk & Coffee Beans Restock',
            'category' => 'Supplies',
            'amount' => 45.00,
            'notes' => 'Weekly dairy and roast delivery',
            'created_at' => Carbon::now()->subHours(5),
        ]);

        Expense::create([
            'id' => 'exp_02',
            'branch_id' => 'store_main',
            'logged_by_user_id' => $bossUser->id,
            'title' => 'Ice Bags & Beverage Cups',
            'category' => 'Supplies',
            'amount' => 20.00,
            'notes' => 'Store front supplies',
            'created_at' => Carbon::now()->subHours(2),
        ]);

        // 8. Seed Store Settings
        $defaultSettings = [
            'store_name' => 'OmniPOS Bistro',
            'store_address' => '100 Innovation Blvd, Downtown Central',
            'store_phone' => '+1 (555) 019-2834',
            'store_email' => 'contact@omnipos.com',
            'currency_symbol' => '$',
            'default_tax_rate' => '10',
            'receipt_header' => 'Welcome to OmniPOS Bistro! Enjoy your meal.',
            'receipt_footer' => 'Thank you for dining with us! See you again soon.',
        ];

        foreach ($defaultSettings as $k => $v) {
            Setting::updateOrCreate(['key' => $k], ['value' => (string)$v]);
        }

        // 9. Seed Hybrid Settlement Config
        HybridSettlementConfig::updateOrCreate(
            ['branch_id' => 'store_main'],
            [
                'id' => 'set_cfg_main',
                'base_rent_amount' => 500.00,
                'royalty_percent' => 3.00,
            ]
        );
    }
}
