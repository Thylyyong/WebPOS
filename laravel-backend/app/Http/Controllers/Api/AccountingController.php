<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Expense;
use App\Models\Branch;
use App\Models\HybridSettlementConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AccountingController extends Controller
{
    /**
     * Simple Profit & Loss Summary for POS Web
     */
    public function profitLoss(Request $request)
    {
        $branchId = $request->query('branch_id', 'store_a');
        $isConsolidated = ($branchId === 'enterprise' || $branchId === 'all');

        if ($isConsolidated) {
            return $this->simpleConsolidatedPL();
        }

        return $this->simpleBranchPL($branchId);
    }

    /**
     * Simple Branch Financial Summary
     */
    private function simpleBranchPL(string $branchId)
    {
        $branch = Branch::findOrFail($branchId);

        // Orders & Revenue
        $orders = Order::where('branch_id', $branchId)
            ->where('status', 'COMPLETED')
            ->get();

        $grossSales = round((float) $orders->sum('subtotal'), 2);
        $totalDiscounts = round((float) $orders->sum('discount_amount'), 2);
        $netSales = round($grossSales - $totalDiscounts, 2);

        // Cost of Goods Sold (COGS)
        $cogs = (float) OrderItem::whereHas('order', function ($q) use ($branchId) {
            $q->where('branch_id', $branchId)->where('status', 'COMPLETED');
        })->sum(\DB::raw('cost_price * quantity'));
        $cogs = round($cogs, 2);

        // Gross Profit
        $grossProfit = round($netSales - $cogs, 2);

        // Operating Expenses
        $expenses = Expense::where('branch_id', $branchId)->get();
        $totalExpenses = round((float) $expenses->sum('amount'), 2);

        // Hybrid Royalty (Base Rent $500 + 3% Sales)
        $config = HybridSettlementConfig::where('branch_id', $branchId)->first();
        $baseRent = $config ? (float) $config->base_rent_amount : 500.00;
        $royaltyPercent = $config ? (float) $config->royalty_percent : 3.00;
        $royaltyAmount = round(($royaltyPercent / 100) * $netSales, 2);
        $totalPaidToBoss = round($baseRent + $royaltyAmount, 2);

        // Simple Net Profit
        $netProfit = round($grossProfit - $totalExpenses - $totalPaidToBoss, 2);

        return response()->json([
            'success' => true,
            'branch_name' => $branch->branch_name,
            'summary' => [
                'gross_sales' => $grossSales,
                'discounts' => $totalDiscounts,
                'net_sales' => $netSales,
                'cogs' => $cogs,
                'gross_profit' => $grossProfit,
                'total_expenses' => $totalExpenses,
                'hybrid_paid_to_boss' => $totalPaidToBoss,
                'net_profit' => $netProfit,
            ],
            'settlement' => [
                'base_rent' => $baseRent,
                'royalty_percent' => $royaltyPercent,
                'royalty_amount' => $royaltyAmount,
                'total_settlement' => $totalPaidToBoss,
            ],
            'expenses_breakdown' => $expenses->map(function ($e) {
                return [
                    'id' => $e->id,
                    'title' => $e->title,
                    'category' => $e->category,
                    'amount' => $e->amount,
                    'date' => $e->created_at->format('Y-m-d'),
                ];
            }),
        ]);
    }

    /**
     * Simple Consolidated Summary for Main Boss
     */
    private function simpleConsolidatedPL()
    {
        $storeA = $this->simpleBranchPL('store_a')->getData(true);
        $storeB = $this->simpleBranchPL('store_b')->getData(true);

        $rentInflow = $storeA['settlement']['base_rent'] + $storeB['settlement']['base_rent'];
        $royaltyInflow = $storeA['settlement']['royalty_amount'] + $storeB['settlement']['royalty_amount'];
        $totalExecutiveRevenue = round($rentInflow + $royaltyInflow, 2);

        $centralExpenses = 300.00; // Simplified server hosting
        $executiveNet = round($totalExecutiveRevenue - $centralExpenses, 2);

        return response()->json([
            'success' => true,
            'report_title' => 'Executive Consolidated Summary (Main Boss)',
            'is_consolidated' => true,
            'summary' => [
                'total_rent_collected' => $rentInflow,
                'total_royalty_collected' => $royaltyInflow,
                'total_hybrid_revenue' => $totalExecutiveRevenue,
                'central_expenses' => $centralExpenses,
                'executive_net_profit' => $executiveNet,
            ],
            'stores' => [
                'store_a' => $storeA['summary'],
                'store_b' => $storeB['summary'],
            ],
        ]);
    }

    /**
     * List logged expenses
     */
    public function expenses(Request $request)
    {
        $branchId = $request->query('branch_id', 'store_a');

        $expenses = Expense::where('branch_id', $branchId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'expenses' => $expenses,
        ]);
    }

    /**
     * Log new expense
     */
    public function storeExpense(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|string|exists:branches,id',
            'category' => 'required|string',
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();

        $expense = Expense::create([
            'id' => 'exp_' . Str::random(8),
            'branch_id' => $validated['branch_id'],
            'category' => $validated['category'],
            'title' => $validated['title'],
            'amount' => $validated['amount'],
            'notes' => $validated['notes'] ?? null,
            'logged_by_user_id' => $user?->id,
            'logged_by_user_name' => $user?->name ?? 'Store Manager',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Expense added successfully',
            'expense' => $expense,
        ], 201);
    }
}
