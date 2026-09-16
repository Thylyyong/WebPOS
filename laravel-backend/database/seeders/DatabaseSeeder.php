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
        // 1. Seed Branches
        $branches = [
            [
                'id' => 'enterprise',
                'branch_name' => 'OmniPOS Master HQ',
                'branch_code' => 'ENT-HQ',
                'address' => '100 Wall Street, Executive Suite',
                'phone' => '+1 (555) 000-0001',
                'is_active' => true,
            ],
            [
                'id' => 'store_a',
                'branch_name' => 'Store A - Downtown',
                'branch_code' => 'STR-A',
                'address' => '123 Boulevard St, Suite 100, Downtown',
                'phone' => '+1 (555) 019-2834',
                'is_active' => true,
            ],
            [
                'id' => 'store_b',
                'branch_name' => 'Store B - Uptown',
                'branch_code' => 'STR-B',
                'address' => '456 Grand Ave, Suite 200, Uptown',
                'phone' => '+1 (555) 028-4912',
                'is_active' => true,
            ],
        ];

        foreach ($branches as $b) {
            Branch::updateOrCreate(['id' => $b['id']], $b);
        }

        // 2. Seed Users & Roles & Access PINs
        $users = [
            [
                'name' => 'Owner (Main Boss)',
                'username' => 'main_boss',
                'email' => 'boss@omnipos.com',
                'password' => Hash::make('secret9999'),
                'pin_code' => '9999',
                'role' => 'MAIN_BOSS',
                'branch_id' => 'enterprise',
                'is_active' => true,
            ],
            [
                'name' => 'Sub Boss 1 (Downtown)',
                'username' => 'manager_store_a',
                'email' => 'manager.a@omnipos.com',
                'password' => Hash::make('secret1111'),
                'pin_code' => '1111',
                'role' => 'SUB_BOSS',
                'branch_id' => 'store_a',
                'is_active' => true,
            ],
            [
                'name' => 'Sub Boss 2 (Uptown)',
                'username' => 'manager_store_b',
                'email' => 'manager.b@omnipos.com',
                'password' => Hash::make('secret2222'),
                'pin_code' => '2222',
                'role' => 'SUB_BOSS',
                'branch_id' => 'store_b',
                'is_active' => true,
            ],
            [
                'name' => 'Staff Cashier 01',
                'username' => 'cashier_01',
                'email' => 'cashier1@omnipos.com',
                'password' => Hash::make('secret1234'),
                'pin_code' => '1234',
                'role' => 'STAFF_CASHIER',
                'branch_id' => 'store_a',
                'is_active' => true,
            ],
            [
                'name' => 'Kitchen Head Chef',
                'username' => 'chef_01',
                'email' => 'chef@omnipos.com',
                'password' => Hash::make('secret5555'),
                'pin_code' => '5555',
                'role' => 'CHEF',
                'branch_id' => 'store_a',
                'is_active' => true,
            ],
        ];

        foreach ($users as $u) {
            User::updateOrCreate(['username' => $u['username']], $u);
        }

        // 3. Categories
        $categories = [
            [
                'id' => 'cat_coffee',
                'name' => 'Coffee & Tea',
                'icon' => 'local_cafe',
                'color_hex' => '#0D9488',
                'display_order' => 1,
            ],
            [
                'id' => 'cat_burgers',
                'name' => 'Burgers & Sandwiches',
                'icon' => 'lunch_dining',
                'color_hex' => '#10B981',
                'display_order' => 2,
            ],
            [
                'id' => 'cat_mains',
                'name' => 'Asian & Western Mains',
                'icon' => 'restaurant',
                'color_hex' => '#F59E0B',
                'display_order' => 3,
            ],
            [
                'id' => 'cat_desserts',
                'name' => 'Pastries & Desserts',
                'icon' => 'cake',
                'color_hex' => '#8B5CF6',
                'display_order' => 4,
            ],
            [
                'id' => 'cat_drinks',
                'name' => 'Beverages & Frappes',
                'icon' => 'local_bar',
                'color_hex' => '#EC4899',
                'display_order' => 5,
            ],
        ];

        foreach ($categories as $c) {
            Category::updateOrCreate(['id' => $c['id']], $c);
        }

        // 4. Subcategories
        $subcategories = [
            ['id' => 'sub_hot_coffee', 'category_id' => 'cat_coffee', 'name' => 'Hot Espresso'],
            ['id' => 'sub_iced_coffee', 'category_id' => 'cat_coffee', 'name' => 'Iced Coffee'],
            ['id' => 'sub_burgers', 'category_id' => 'cat_burgers', 'name' => 'Gourmet Burgers'],
            ['id' => 'sub_fries', 'category_id' => 'cat_burgers', 'name' => 'Sides & Snacks'],
            ['id' => 'sub_rice', 'category_id' => 'cat_mains', 'name' => 'Signature Bowls'],
            ['id' => 'sub_pasta', 'category_id' => 'cat_mains', 'name' => 'Handmade Pasta'],
            ['id' => 'sub_cakes', 'category_id' => 'cat_desserts', 'name' => 'Artisan Cakes'],
            ['id' => 'sub_smoothies', 'category_id' => 'cat_drinks', 'name' => 'Fresh Smoothies'],
        ];

        foreach ($subcategories as $s) {
            Subcategory::updateOrCreate(['id' => $s['id']], $s);
        }

        // 5. Products (With Cost Price for simple Profit & Loss)
        $products = [
            // Coffee
            [
                'id' => 'prod_espresso',
                'category_id' => 'cat_coffee',
                'subcategory_id' => 'sub_hot_coffee',
                'sku' => 'CF-001',
                'name' => 'Double Espresso',
                'description' => 'Rich double shot espresso extracted from single origin beans.',
                'price' => 2.75,
                'cost' => 0.80,
                'barcode' => '100001',
                'image_path' => 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500',
                'color_hex' => '#0D9488',
                'in_stock' => 1,
                'stock_quantity' => 150,
                'tax_rate' => 10.0,
            ],
            [
                'id' => 'prod_americano',
                'category_id' => 'cat_coffee',
                'subcategory_id' => 'sub_hot_coffee',
                'sku' => 'CF-002',
                'name' => 'Caffe Americano',
                'description' => 'Rich espresso diluted with hot water.',
                'price' => 3.25,
                'cost' => 0.90,
                'barcode' => '100002',
                'image_path' => 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
                'color_hex' => '#0D9488',
                'in_stock' => 1,
                'stock_quantity' => 120,
                'tax_rate' => 10.0,
            ],
            [
                'id' => 'prod_latte',
                'category_id' => 'cat_coffee',
                'subcategory_id' => 'sub_hot_coffee',
                'sku' => 'CF-003',
                'name' => 'Vanilla Caffe Latte',
                'description' => 'Steamed milk with velvety micro-foam poured over espresso.',
                'price' => 4.50,
                'cost' => 1.20,
                'barcode' => '100003',
                'image_path' => 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500',
                'color_hex' => '#0D9488',
                'in_stock' => 1,
                'stock_quantity' => 100,
                'tax_rate' => 10.0,
            ],
            [
                'id' => 'prod_cappuccino',
                'category_id' => 'cat_coffee',
                'subcategory_id' => 'sub_hot_coffee',
                'sku' => 'CF-004',
                'name' => 'Caramel Cappuccino',
                'description' => 'Balanced espresso and frothed milk with salted caramel drizzle.',
                'price' => 4.75,
                'cost' => 1.30,
                'barcode' => '100004',
                'image_path' => 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500',
                'color_hex' => '#0D9488',
                'in_stock' => 1,
                'stock_quantity' => 90,
                'tax_rate' => 10.0,
            ],
            [
                'id' => 'prod_iced_latte',
                'category_id' => 'cat_coffee',
                'subcategory_id' => 'sub_iced_coffee',
                'sku' => 'CF-005',
                'name' => 'Iced Spanish Latte',
                'description' => 'Condensed milk, fresh milk and espresso over cracked ice.',
                'price' => 5.00,
                'cost' => 1.50,
                'barcode' => '100005',
                'image_path' => 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500',
                'color_hex' => '#0D9488',
                'in_stock' => 1,
                'stock_quantity' => 110,
                'tax_rate' => 10.0,
            ],
            [
                'id' => 'prod_matcha',
                'category_id' => 'cat_coffee',
                'subcategory_id' => 'sub_iced_coffee',
                'sku' => 'CF-006',
                'name' => 'Iced Uji Matcha Latte',
                'description' => 'Ceremonial grade Uji Kyoto matcha with fresh oat milk.',
                'price' => 5.50,
                'cost' => 1.80,
                'barcode' => '100006',
                'image_path' => 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500',
                'color_hex' => '#0D9488',
                'in_stock' => 1,
                'stock_quantity' => 80,
                'tax_rate' => 10.0,
            ],

            // Burgers & Sides
            [
                'id' => 'prod_wagyu_burger',
                'category_id' => 'cat_burgers',
                'subcategory_id' => 'sub_burgers',
                'sku' => 'BG-001',
                'name' => 'Truffle Wagyu Burger Deluxe',
                'description' => 'A5 Wagyu patty, black truffle aioli, melted aged cheddar on brioche.',
                'price' => 12.50,
                'cost' => 4.80,
                'barcode' => '200001',
                'image_path' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
                'color_hex' => '#10B981',
                'in_stock' => 1,
                'stock_quantity' => 60,
                'tax_rate' => 10.0,
            ],
            [
                'id' => 'prod_crispy_chicken',
                'category_id' => 'cat_burgers',
                'subcategory_id' => 'sub_burgers',
                'sku' => 'BG-002',
                'name' => 'Spicy Crispy Chicken Burger',
                'description' => 'Crispy buttermilk battered chicken breast with spicy sriracha slaw.',
                'price' => 9.75,
                'cost' => 3.20,
                'barcode' => '200002',
                'image_path' => 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500',
                'color_hex' => '#10B981',
                'in_stock' => 1,
                'stock_quantity' => 75,
                'tax_rate' => 10.0,
            ],
            [
                'id' => 'prod_club_sandwich',
                'category_id' => 'cat_burgers',
                'subcategory_id' => 'sub_burgers',
                'sku' => 'BG-003',
                'name' => 'Smoked Turkey Club Sandwich',
                'description' => 'Triple-deck toasted bread with smoked turkey, bacon, lettuce & tomato.',
                'price' => 8.50,
                'cost' => 2.80,
                'barcode' => '200003',
                'image_path' => 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500',
                'color_hex' => '#10B981',
                'in_stock' => 1,
                'stock_quantity' => 50,
                'tax_rate' => 10.0,
            ],
            [
                'id' => 'prod_truffle_fries',
                'category_id' => 'cat_burgers',
                'subcategory_id' => 'sub_fries',
                'sku' => 'SD-001',
                'name' => 'Parmesan Truffle Fries',
                'description' => 'Golden shoestring fries tossed in white truffle oil and parmigiano.',
                'price' => 4.95,
                'cost' => 1.40,
                'barcode' => '200004',
                'image_path' => 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500',
                'color_hex' => '#10B981',
                'in_stock' => 1,
                'stock_quantity' => 130,
                'tax_rate' => 10.0,
            ],
            [
                'id' => 'prod_onion_rings',
                'category_id' => 'cat_burgers',
                'subcategory_id' => 'sub_fries',
                'sku' => 'SD-002',
                'name' => 'Crispy Beer Onion Rings',
                'description' => 'Thick-cut onions dipped in craft beer batter, served with ranch.',
                'price' => 4.25,
                'cost' => 1.10,
                'barcode' => '200005',
                'image_path' => 'https://images.unsplash.com/photo-1639024471287-0352137452d9?w=500',
                'color_hex' => '#10B981',
                'in_stock' => 1,
                'stock_quantity' => 90,
                'tax_rate' => 10.0,
            ],

            // Mains
            [
                'id' => 'prod_pad_thai',
                'category_id' => 'cat_mains',
                'subcategory_id' => 'sub_rice',
                'sku' => 'MN-001',
                'name' => 'Royal Prawn Pad Thai',
                'description' => 'Stir-fried rice noodles with jumbo tiger prawns, tofu, peanuts & lime.',
                'price' => 11.00,
                'cost' => 3.90,
                'barcode' => '300001',
                'image_path' => 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500',
                'color_hex' => '#F59E0B',
                'in_stock' => 1,
                'stock_quantity' => 40,
                'tax_rate' => 10.0,
            ],
            [
                'id' => 'prod_teriyaki_bowl',
                'category_id' => 'cat_mains',
                'subcategory_id' => 'sub_rice',
                'sku' => 'MN-002',
                'name' => 'Salmon Teriyaki Rice Bowl',
                'description' => 'Pan-seared Atlantic salmon glazed with house teriyaki over jasmine rice.',
                'price' => 13.50,
                'cost' => 5.10,
                'barcode' => '300002',
                'image_path' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
                'color_hex' => '#F59E0B',
                'in_stock' => 1,
                'stock_quantity' => 35,
                'tax_rate' => 10.0,
            ],
            [
                'id' => 'prod_carbonara',
                'category_id' => 'cat_mains',
                'subcategory_id' => 'sub_pasta',
                'sku' => 'MN-003',
                'name' => 'Classic Guanciale Carbonara',
                'description' => 'Spaghetti, crispy cured guanciale, pecorino romano, and farm egg yolks.',
                'price' => 12.00,
                'cost' => 4.00,
                'barcode' => '300003',
                'image_path' => 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500',
                'color_hex' => '#F59E0B',
                'in_stock' => 1,
                'stock_quantity' => 45,
                'tax_rate' => 10.0,
            ],

            // Desserts
            [
                'id' => 'prod_cheesecake',
                'category_id' => 'cat_desserts',
                'subcategory_id' => 'sub_cakes',
                'sku' => 'DS-001',
                'name' => 'Basque Burnt Cheesecake',
                'description' => 'Caramelized crust with ultra-creamy, molten cheese center.',
                'price' => 6.25,
                'cost' => 2.00,
                'barcode' => '400001',
                'image_path' => 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500',
                'color_hex' => '#8B5CF6',
                'in_stock' => 1,
                'stock_quantity' => 30,
                'tax_rate' => 10.0,
            ],
            [
                'id' => 'prod_tiramisu',
                'category_id' => 'cat_desserts',
                'subcategory_id' => 'sub_cakes',
                'sku' => 'DS-002',
                'name' => 'Classic Italian Tiramisu',
                'description' => 'Espresso-soaked savoiardi layered with whipped mascarpone cream.',
                'price' => 6.75,
                'cost' => 2.20,
                'barcode' => '400002',
                'image_path' => 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500',
                'color_hex' => '#8B5CF6',
                'in_stock' => 1,
                'stock_quantity' => 25,
                'tax_rate' => 10.0,
            ],
            [
                'id' => 'prod_croissant',
                'category_id' => 'cat_desserts',
                'subcategory_id' => 'sub_cakes',
                'sku' => 'DS-003',
                'name' => 'Almond Butter Croissant',
                'description' => 'Flaky French butter croissant filled and topped with toasted almond cream.',
                'price' => 3.95,
                'cost' => 1.10,
                'barcode' => '400003',
                'image_path' => 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500',
                'color_hex' => '#8B5CF6',
                'in_stock' => 1,
                'stock_quantity' => 40,
                'tax_rate' => 10.0,
            ],

            // Drinks & Smoothies
            [
                'id' => 'prod_mango_smoothie',
                'category_id' => 'cat_drinks',
                'subcategory_id' => 'sub_smoothies',
                'sku' => 'DR-001',
                'name' => 'Tropical Mango Passion Smoothie',
                'description' => 'Fresh Kensington mango, passion fruit pulp, and greek yogurt.',
                'price' => 5.25,
                'cost' => 1.60,
                'barcode' => '500001',
                'image_path' => 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=500',
                'color_hex' => '#EC4899',
                'in_stock' => 1,
                'stock_quantity' => 60,
                'tax_rate' => 10.0,
            ],
            [
                'id' => 'prod_berry_blast',
                'category_id' => 'cat_drinks',
                'subcategory_id' => 'sub_smoothies',
                'sku' => 'DR-002',
                'name' => 'Wild Berry Acai Frappe',
                'description' => 'Organic acai, wild blueberries, strawberries, and almond milk.',
                'price' => 5.75,
                'cost' => 1.75,
                'barcode' => '500002',
                'image_path' => 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500',
                'color_hex' => '#EC4899',
                'in_stock' => 1,
                'stock_quantity' => 55,
                'tax_rate' => 10.0,
            ],
            [
                'id' => 'prod_sparkling_lemonade',
                'category_id' => 'cat_drinks',
                'subcategory_id' => 'sub_smoothies',
                'sku' => 'DR-003',
                'name' => 'Sparkling Mint Lemonade',
                'description' => 'Freshly squeezed lemons, crushed garden mint, and sparkling soda.',
                'price' => 4.25,
                'cost' => 0.95,
                'barcode' => '500003',
                'image_path' => 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500',
                'color_hex' => '#EC4899',
                'in_stock' => 1,
                'stock_quantity' => 70,
                'tax_rate' => 10.0,
            ],
        ];

        foreach ($products as $p) {
            Product::updateOrCreate(['id' => $p['id']], $p);
        }

        // 6. Dining Tables (12 Web Floor Plan Tables)
        $tables = [
            ['id' => 'tbl_01', 'branch_id' => 'store_a', 'table_number' => 'T01', 'name' => 'Window Table 1', 'zone' => 'Main Hall', 'capacity' => 4, 'status' => 'AVAILABLE', 'type' => 'STANDARD'],
            ['id' => 'tbl_02', 'branch_id' => 'store_a', 'table_number' => 'T02', 'name' => 'Window Table 2', 'zone' => 'Main Hall', 'capacity' => 4, 'status' => 'AVAILABLE', 'type' => 'STANDARD'],
            ['id' => 'tbl_03', 'branch_id' => 'store_a', 'table_number' => 'T03', 'name' => 'Cozy Corner', 'zone' => 'Main Hall', 'capacity' => 2, 'status' => 'AVAILABLE', 'type' => 'STANDARD'],
            ['id' => 'tbl_04', 'branch_id' => 'store_a', 'table_number' => 'T04', 'name' => 'Bistro Table 4', 'zone' => 'Main Hall', 'capacity' => 2, 'status' => 'AVAILABLE', 'type' => 'STANDARD'],
            ['id' => 'tbl_05', 'branch_id' => 'store_a', 'table_number' => 'T05', 'name' => 'Central Booth', 'zone' => 'Main Hall', 'capacity' => 6, 'status' => 'AVAILABLE', 'type' => 'STANDARD'],
            ['id' => 'tbl_06', 'branch_id' => 'store_a', 'table_number' => 'T06', 'name' => 'Family Table 6', 'zone' => 'Main Hall', 'capacity' => 6, 'status' => 'AVAILABLE', 'type' => 'STANDARD'],
            ['id' => 'tbl_07', 'branch_id' => 'store_a', 'table_number' => 'T07', 'name' => 'High Top 7', 'zone' => 'Bar Lounge', 'capacity' => 4, 'status' => 'AVAILABLE', 'type' => 'BAR'],
            ['id' => 'tbl_08', 'branch_id' => 'store_a', 'table_number' => 'T08', 'name' => 'Large Group Table', 'zone' => 'Main Hall', 'capacity' => 8, 'status' => 'AVAILABLE', 'type' => 'STANDARD'],
            ['id' => 'tbl_vip1', 'branch_id' => 'store_a', 'table_number' => 'VIP-1', 'name' => 'Royal Executive Room', 'zone' => 'VIP Room', 'capacity' => 10, 'status' => 'AVAILABLE', 'type' => 'VIP_ROOM'],
            ['id' => 'tbl_vip2', 'branch_id' => 'store_a', 'table_number' => 'VIP-2', 'name' => 'Emerald Private Suite', 'zone' => 'VIP Room', 'capacity' => 8, 'status' => 'AVAILABLE', 'type' => 'VIP_ROOM'],
            ['id' => 'tbl_patio1', 'branch_id' => 'store_a', 'table_number' => 'Patio-1', 'name' => 'Outdoor Garden 1', 'zone' => 'Terrace', 'capacity' => 4, 'status' => 'AVAILABLE', 'type' => 'OUTDOOR'],
            ['id' => 'tbl_patio2', 'branch_id' => 'store_a', 'table_number' => 'Patio-2', 'name' => 'Outdoor Garden 2', 'zone' => 'Terrace', 'capacity' => 4, 'status' => 'AVAILABLE', 'type' => 'OUTDOOR'],
        ];

        foreach ($tables as $t) {
            DiningTable::updateOrCreate(['id' => $t['id']], $t);
        }

        // 7. Store Settings (Simple POS Web Settings - No hardware/printer complication)
        $settings = [
            'store_name' => 'Gourmet Bistro POS',
            'store_address' => '123 Boulevard St, Suite 100, Downtown',
            'store_phone' => '+1 (555) 019-2834',
            'store_email' => 'contact@gourmetbistro.com',
            'currency_symbol' => '$',
            'default_tax_rate' => '10.0',
            'footer_note' => "Thank you for dining with us!\nPlease visit again.",
        ];

        foreach ($settings as $k => $v) {
            Setting::setVal($k, $v);
        }

        // 8. Hybrid Settlement Configs ($500 base rent + 3.0% product sales royalty)
        HybridSettlementConfig::updateOrCreate(
            ['branch_id' => 'store_a'],
            [
                'id' => 'config_store_a',
                'branch_id' => 'store_a',
                'base_rent_amount' => 500.00,
                'royalty_percent' => 3.00,
                'settlement_cycle' => 'MONTHLY',
            ]
        );

        HybridSettlementConfig::updateOrCreate(
            ['branch_id' => 'store_b'],
            [
                'id' => 'config_store_b',
                'branch_id' => 'store_b',
                'base_rent_amount' => 500.00,
                'royalty_percent' => 3.00,
                'settlement_cycle' => 'MONTHLY',
            ]
        );

        // 9. Sample Register Session (Active Open Session for Store A)
        $cashier = User::where('username', 'cashier_01')->first();
        RegisterSession::updateOrCreate(
            ['id' => 'reg_sess_active_01'],
            [
                'id' => 'reg_sess_active_01',
                'branch_id' => 'store_a',
                'branch_name' => 'Store A - Downtown',
                'cashier_id' => $cashier?->id,
                'cashier_name' => 'Staff Cashier 01',
                'opened_at' => Carbon::now()->subHours(4),
                'opening_cash' => 300.00,
                'opening_notes' => 'Starting drawer float verified.',
                'status' => 'OPEN',
                'total_orders' => 2,
                'total_cash_sales' => 21.95,
                'total_card_sales' => 0.00,
                'total_qr_sales' => 34.93,
                'total_cash_in' => 50.00,
                'total_cash_out' => 20.00,
            ]
        );

        // 10. Sample Historical Orders & Order Items
        $order1 = Order::updateOrCreate(
            ['id' => 'ord_demo_01'],
            [
                'id' => 'ord_demo_01',
                'branch_id' => 'store_a',
                'receipt_no' => 'RCP-20260902-0001',
                'order_number' => '001',
                'cashier_id' => $cashier?->id,
                'table_id' => 'tbl_01',
                'table_number' => 'T01',
                'customer_name' => 'Michael Scott',
                'order_type' => 'DINE_IN',
                'subtotal' => 21.95,
                'discount_amount' => 2.00,
                'discount_percent' => 0.0,
                'tax_amount' => 2.00,
                'tax_rate' => 10.0,
                'total_amount' => 21.95,
                'payment_method' => 'CASH',
                'cash_tendered' => 30.00,
                'change_amount' => 8.05,
                'status' => 'COMPLETED',
                'kitchen_status' => 'SERVED',
                'created_at' => Carbon::now()->subHours(3),
            ]
        );

        OrderItem::updateOrCreate(
            ['id' => 'item_01_1'],
            [
                'id' => 'item_01_1',
                'order_id' => 'ord_demo_01',
                'product_id' => 'prod_wagyu_burger',
                'product_name' => 'Truffle Wagyu Burger Deluxe',
                'quantity' => 1,
                'unit_price' => 12.50,
                'cost_price' => 4.80,
                'total_price' => 12.50,
                'notes' => 'Medium rare, extra pickles',
                'course' => 'MAIN',
            ]
        );

        OrderItem::updateOrCreate(
            ['id' => 'item_01_2'],
            [
                'id' => 'item_01_2',
                'order_id' => 'ord_demo_01',
                'product_id' => 'prod_truffle_fries',
                'product_name' => 'Parmesan Truffle Fries',
                'quantity' => 1,
                'unit_price' => 4.95,
                'cost_price' => 1.40,
                'total_price' => 4.95,
                'notes' => null,
                'course' => 'STARTER',
            ]
        );

        OrderItem::updateOrCreate(
            ['id' => 'item_01_3'],
            [
                'id' => 'item_01_3',
                'order_id' => 'ord_demo_01',
                'product_id' => 'prod_latte',
                'product_name' => 'Vanilla Caffe Latte',
                'quantity' => 1,
                'unit_price' => 4.50,
                'cost_price' => 1.20,
                'total_price' => 4.50,
                'notes' => 'Oat milk',
                'course' => 'BEVERAGE',
            ]
        );

        $order2 = Order::updateOrCreate(
            ['id' => 'ord_demo_02'],
            [
                'id' => 'ord_demo_02',
                'branch_id' => 'store_a',
                'receipt_no' => 'RCP-20260902-0002',
                'order_number' => '002',
                'cashier_id' => $cashier?->id,
                'table_id' => 'tbl_vip1',
                'table_number' => 'VIP-1',
                'customer_name' => 'Sarah Connor',
                'order_type' => 'DINE_IN',
                'subtotal' => 31.75,
                'discount_amount' => 0.0,
                'discount_percent' => 0.0,
                'tax_amount' => 3.18,
                'tax_rate' => 10.0,
                'total_amount' => 34.93,
                'payment_method' => 'QR',
                'cash_tendered' => 34.93,
                'change_amount' => 0.00,
                'status' => 'COMPLETED',
                'kitchen_status' => 'SERVED',
                'created_at' => Carbon::now()->subHours(1),
            ]
        );

        OrderItem::updateOrCreate(
            ['id' => 'item_02_1'],
            [
                'id' => 'item_02_1',
                'order_id' => 'ord_demo_02',
                'product_id' => 'prod_pad_thai',
                'product_name' => 'Royal Prawn Pad Thai',
                'quantity' => 2,
                'unit_price' => 11.00,
                'cost_price' => 3.90,
                'total_price' => 22.00,
                'notes' => 'Mild spice',
                'course' => 'MAIN',
            ]
        );

        OrderItem::updateOrCreate(
            ['id' => 'item_02_2'],
            [
                'id' => 'item_02_2',
                'order_id' => 'ord_demo_02',
                'product_id' => 'prod_matcha',
                'product_name' => 'Iced Uji Matcha Latte',
                'quantity' => 1,
                'unit_price' => 5.50,
                'cost_price' => 1.80,
                'total_price' => 5.50,
                'notes' => 'Less ice',
                'course' => 'BEVERAGE',
            ]
        );

        OrderItem::updateOrCreate(
            ['id' => 'item_02_3'],
            [
                'id' => 'item_02_3',
                'order_id' => 'ord_demo_02',
                'product_id' => 'prod_sparkling_lemonade',
                'product_name' => 'Sparkling Mint Lemonade',
                'quantity' => 1,
                'unit_price' => 4.25,
                'cost_price' => 0.95,
                'total_price' => 4.25,
                'notes' => null,
                'course' => 'BEVERAGE',
            ]
        );

        // 11. Sample Operating Expenses for Store A (Simple Expense Tracking)
        $subBoss1 = User::where('username', 'manager_store_a')->first();
        Expense::updateOrCreate(
            ['id' => 'exp_01'],
            [
                'id' => 'exp_01',
                'branch_id' => 'store_a',
                'category' => 'SALARIES',
                'title' => 'Staff Salaries',
                'amount' => 1800.00,
                'notes' => 'Bi-weekly staff salaries',
                'logged_by_user_id' => $subBoss1?->id,
                'logged_by_user_name' => 'Sub Boss 1',
                'created_at' => Carbon::now()->subDays(3),
            ]
        );

        Expense::updateOrCreate(
            ['id' => 'exp_02'],
            [
                'id' => 'exp_02',
                'branch_id' => 'store_a',
                'category' => 'UTILITIES',
                'title' => 'Store Utilities (Power & Internet)',
                'amount' => 420.00,
                'notes' => 'Monthly electricity & internet bill',
                'logged_by_user_id' => $subBoss1?->id,
                'logged_by_user_name' => 'Sub Boss 1',
                'created_at' => Carbon::now()->subDays(7),
            ]
        );

        Expense::updateOrCreate(
            ['id' => 'exp_03'],
            [
                'id' => 'exp_03',
                'branch_id' => 'store_a',
                'category' => 'SUPPLIES',
                'title' => 'Packaging & Paper Supplies',
                'amount' => 150.00,
                'notes' => 'Takeaway boxes and napkins',
                'logged_by_user_id' => $subBoss1?->id,
                'logged_by_user_name' => 'Sub Boss 1',
                'created_at' => Carbon::now()->subDays(10),
            ]
        );
    }
}
