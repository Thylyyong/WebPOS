<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\HybridSettlementConfig;
use App\Models\HybridRoyaltyPayout;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class SettlementController extends Controller
{
    /**
     * Interactive side-by-side settlement demonstration
     * Sub Boss 1 (Store A) vs Sub Boss 2 (Store B) vs Main Boss (Master Executive)
     */
    public function summary()
    {
        $branches = Branch::whereIn('id', ['store_a', 'store_b'])->get();
        $comparison = [];

        $totalRentCollected = 0.00;
        $totalRoyaltyCollected = 0.00;

        foreach ($branches as $branch) {
            $config = HybridSettlementConfig::firstOrCreate(
                ['branch_id' => $branch->id],
                [
                    'id' => 'config_' . $branch->id,
                    'base_rent_amount' => 500.00,
                    'royalty_percent' => 3.00,
                    'settlement_cycle' => 'MONTHLY',
                ]
            );

            // Gross sales
            $grossSales = (float) Order::where('branch_id', $branch->id)
                ->where('status', 'COMPLETED')
                ->sum('total_amount');

            // COGS
            $cogs = (float) OrderItem::whereHas('order', function ($q) use ($branch) {
                $q->where('branch_id', $branch->id)->where('status', 'COMPLETED');
            })->sum(\DB::raw('cost_price * quantity'));

            $grossMargin = round($grossSales - $cogs, 2);

            // Formula: Rent + Royalty% x Sales
            $baseRent = (float) $config->base_rent_amount;
            $royalty = round(($config->royalty_percent / 100) * $grossSales, 2);
            $totalPayoutToBoss = round($baseRent + $royalty, 2);

            $localExpenses = 1800.00 + 420.00 + 150.00; // Sample expenses
            $netTakeHome = round($grossMargin - $totalPayoutToBoss - $localExpenses, 2);

            $totalRentCollected += $baseRent;
            $totalRoyaltyCollected += $royalty;

            $comparison[$branch->id] = [
                'branch_id' => $branch->id,
                'branch_name' => $branch->branch_name,
                'gross_product_sales' => $grossSales,
                'cogs' => $cogs,
                'store_gross_margin' => $grossMargin,
                'base_rent_paid' => $baseRent,
                'royalty_percent' => $config->royalty_percent,
                'royalty_amount_paid' => $royalty,
                'total_hybrid_paid_to_boss' => $totalPayoutToBoss,
                'local_expenses' => $localExpenses,
                'net_take_home_profit' => $netTakeHome,
            ];
        }

        // Main Boss perspective
        $totalExecutiveRevenue = round($totalRentCollected + $totalRoyaltyCollected, 2);
        $holdingCosts = 750.00;
        $executiveNet = round($totalExecutiveRevenue - $holdingCosts, 2);

        $mainBossSummary = [
            'entity' => 'Main Boss (Holding Company Owner)',
            'total_base_rent_inflow' => $totalRentCollected,
            'total_royalty_inflow' => $totalRoyaltyCollected,
            'total_hybrid_revenue' => $totalExecutiveRevenue,
            'central_cloud_and_legal_expenses' => $holdingCosts,
            'passive_executive_net_profit' => $executiveNet,
        ];

        return response()->json([
            'success' => true,
            'formula' => 'Total Payout to Main Boss = [ Fixed Low Base Rent ] + [ (Low Royalty %) x (Product Sales Revenue) ]',
            'branches' => $comparison,
            'main_boss' => $mainBossSummary,
        ]);
    }

    /**
     * Update hybrid contract config (Main Boss only)
     */
    public function updateConfig(Request $request, string $branchId)
    {
        $validated = $request->validate([
            'base_rent_amount' => 'required|numeric|min:0',
            'royalty_percent' => 'required|numeric|min:0|max:100',
            'settlement_cycle' => 'nullable|string|in:DAILY,WEEKLY,MONTHLY',
        ]);

        $config = HybridSettlementConfig::updateOrCreate(
            ['branch_id' => $branchId],
            [
                'id' => 'config_' . $branchId,
                'base_rent_amount' => $validated['base_rent_amount'],
                'royalty_percent' => $validated['royalty_percent'],
                'settlement_cycle' => $validated['settlement_cycle'] ?? 'MONTHLY',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Hybrid contract updated for branch {$branchId}",
            'config' => $config,
        ]);
    }

    /**
     * Settle & log official payout record
     */
    public function settle(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|string|exists:branches,id',
            'period_start' => 'required|date',
            'period_end' => 'required|date',
        ]);

        $config = HybridSettlementConfig::where('branch_id', $validated['branch_id'])->firstOrFail();

        $grossSales = (float) Order::where('branch_id', $validated['branch_id'])
            ->whereBetween('created_at', [$validated['period_start'], $validated['period_end']])
            ->where('status', 'COMPLETED')
            ->sum('total_amount');

        $baseRent = (float) $config->base_rent_amount;
        $royalty = round(($config->royalty_percent / 100) * $grossSales, 2);
        $total = round($baseRent + $royalty, 2);

        $payout = HybridRoyaltyPayout::create([
            'id' => 'payout_' . Str::random(8),
            'branch_id' => $validated['branch_id'],
            'period_start' => $validated['period_start'],
            'period_end' => $validated['period_end'],
            'gross_product_sales' => $grossSales,
            'base_rent_paid' => $baseRent,
            'royalty_amount_paid' => $royalty,
            'total_payout_to_main_boss' => $total,
            'payment_status' => 'SETTLED',
            'settled_at' => Carbon::now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Settlement completed. Total \${$total} settled to Main Boss.",
            'payout' => $payout,
        ], 201);
    }
}
