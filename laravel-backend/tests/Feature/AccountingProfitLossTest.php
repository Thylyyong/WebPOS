<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountingProfitLossTest extends TestCase
{
    use RefreshDatabase;

    protected User $boss;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
        $this->boss = User::where('username', 'boss')->firstOrFail();
        Sanctum::actingAs($this->boss);
    }

    public function test_profit_loss_endpoint_returns_the_shape_and_calculations_used_by_the_ui(): void
    {
        Expense::query()->delete();

        Order::create([
            'id' => 'order_pnl_test',
            'branch_id' => 'store_main',
            'receipt_no' => 'RCP-PNL-TEST',
            'subtotal' => 100,
            'discount_amount' => 10,
            'total_amount' => 99,
            'status' => 'COMPLETED',
        ]);
        OrderItem::create([
            'id' => 'item_pnl_test',
            'order_id' => 'order_pnl_test',
            'product_name' => 'Test item',
            'quantity' => 2,
            'unit_price' => 50,
            'cost_price' => 20,
            'total_price' => 100,
        ]);
        Expense::create([
            'id' => 'expense_pnl_test',
            'branch_id' => 'store_main',
            'category' => 'Supplies',
            'title' => 'Test expense',
            'amount' => 15,
        ]);

        $response = $this->getJson('/api/accounting/profit-loss?branch_id=store_main');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('profit_loss.gross_sales', 100)
            ->assertJsonPath('profit_loss.cogs', 40)
            ->assertJsonPath('profit_loss.gross_profit', 50)
            ->assertJsonPath('profit_loss.gross_margin_percent', 55.6)
            ->assertJsonPath('profit_loss.total_expenses', 15)
            ->assertJsonPath('profit_loss.net_profit', -467.7)
            ->assertJsonPath('profit_loss.net_margin_percent', -519.7);
    }

    public function test_profit_loss_defaults_to_the_seeded_main_branch(): void
    {
        $this->getJson('/api/accounting/profit-loss')
            ->assertOk()
            ->assertJsonPath('branch_name', 'OmniPOS Main Store')
            ->assertJsonPath('profit_loss.gross_sales', 0)
            ->assertJsonPath('profit_loss.gross_margin_percent', 0)
            ->assertJsonPath('profit_loss.net_margin_percent', 0);
    }
}
