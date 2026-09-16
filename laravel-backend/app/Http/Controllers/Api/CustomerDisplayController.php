<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CustomerDisplayController extends Controller
{
    /**
     * Get real-time CFD customer-facing state
     */
    public function getState(Request $request)
    {
        $branchId = $request->query('branch_id', 'store_a');
        $cacheKey = "cfd_state_{$branchId}";

        $state = Cache::get($cacheKey, [
            'status' => 'IDLE', // IDLE, ORDER_IN_PROGRESS, PAYMENT_PENDING, THANK_YOU
            'cart_items' => [],
            'subtotal' => 0.00,
            'discount_amount' => 0.00,
            'tax_amount' => 0.00,
            'total_amount' => 0.00,
            'customer_name' => null,
            'payment_qr_code' => null,
            'last_updated' => now()->toIso8601String(),
        ]);

        $storeName = Setting::getVal('store_name', 'Gourmet Bistro POS');
        $footerNote = Setting::getVal('footer_note', "Thank you for dining with us!\nPlease visit again.");

        return response()->json([
            'success' => true,
            'store_name' => $storeName,
            'footer_note' => $footerNote,
            'state' => $state,
        ]);
    }

    /**
     * Update CFD state from Cashier POS terminal
     */
    public function updateState(Request $request)
    {
        $branchId = $request->input('branch_id', 'store_a');
        $cacheKey = "cfd_state_{$branchId}";

        $state = [
            'status' => $request->input('status', 'ORDER_IN_PROGRESS'),
            'cart_items' => $request->input('cart_items', []),
            'subtotal' => (float) $request->input('subtotal', 0.00),
            'discount_amount' => (float) $request->input('discount_amount', 0.00),
            'tax_amount' => (float) $request->input('tax_amount', 0.00),
            'total_amount' => (float) $request->input('total_amount', 0.00),
            'customer_name' => $request->input('customer_name'),
            'payment_qr_code' => $request->input('payment_qr_code'),
            'last_updated' => now()->toIso8601String(),
        ];

        Cache::put($cacheKey, $state, 3600);

        return response()->json([
            'success' => true,
            'message' => 'Customer display updated successfully',
            'state' => $state,
        ]);
    }

    /**
     * Clear / Reset CFD to IDLE screen
     */
    public function clearState(Request $request)
    {
        $branchId = $request->input('branch_id', 'store_a');
        $cacheKey = "cfd_state_{$branchId}";

        $idleState = [
            'status' => 'IDLE',
            'cart_items' => [],
            'subtotal' => 0.00,
            'discount_amount' => 0.00,
            'tax_amount' => 0.00,
            'total_amount' => 0.00,
            'customer_name' => null,
            'payment_qr_code' => null,
            'last_updated' => now()->toIso8601String(),
        ];

        Cache::put($cacheKey, $idleState, 3600);

        return response()->json([
            'success' => true,
            'message' => 'Customer display reset to idle screen',
            'state' => $idleState,
        ]);
    }
}
