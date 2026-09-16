<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RegisterSession;
use App\Models\CashMovement;
use App\Models\Order;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class RegisterSessionController extends Controller
{
    /**
     * Get active register session for branch
     */
    public function current(Request $request)
    {
        $branchId = $request->query('branch_id', 'store_a');

        $session = RegisterSession::with(['cashMovements.authorizedBy', 'cashier'])
            ->where('branch_id', $branchId)
            ->where('status', 'OPEN')
            ->latest('opened_at')
            ->first();

        return response()->json([
            'success' => true,
            'has_active_session' => $session !== null,
            'session' => $session,
        ]);
    }

    /**
     * 1. 🔓 Opening Control: Open Cash Register
     */
    public function openRegister(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|string|exists:branches,id',
            'opening_cash' => 'required|numeric|min:0',
            'opening_notes' => 'nullable|string',
            'cashier_id' => 'nullable|integer|exists:users,id',
            'cashier_name' => 'nullable|string',
        ]);

        $branch = Branch::findOrFail($validated['branch_id']);
        $user = $request->user();

        // Check if there is already an open session
        $existing = RegisterSession::where('branch_id', $branch->id)
            ->where('status', 'OPEN')
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'A register session is already open for this branch. Please close it first.',
                'session' => $existing,
            ], 422);
        }

        $sessionId = 'sess_' . Str::random(10);

        $session = RegisterSession::create([
            'id' => $sessionId,
            'branch_id' => $branch->id,
            'branch_name' => $branch->branch_name,
            'cashier_id' => $validated['cashier_id'] ?? $user?->id,
            'cashier_name' => $validated['cashier_name'] ?? $user?->name ?? 'Staff Cashier',
            'opened_at' => Carbon::now(),
            'opening_cash' => $validated['opening_cash'],
            'opening_notes' => $validated['opening_notes'] ?? 'Opening cash float placed into drawer.',
            'status' => 'OPEN',
            'total_orders' => 0,
            'total_cash_sales' => 0.00,
            'total_card_sales' => 0.00,
            'total_qr_sales' => 0.00,
            'total_cash_in' => 0.00,
            'total_cash_out' => 0.00,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Register session opened successfully',
            'auto_kick_drawer' => true,
            'session' => $session,
        ], 201);
    }

    /**
     * 2. 💸 Cash In / Cash Out (Petty Cash Movements)
     */
    public function cashMovement(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string|exists:register_sessions,id',
            'type' => 'required|string|in:CASH_IN,CASH_OUT',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255',
            'supervisor_pin' => 'required|string',
        ]);

        // Verify supervisor PIN
        $supervisor = User::where('pin_code', $validated['supervisor_pin'])
            ->whereIn('role', ['MAIN_BOSS', 'SUB_BOSS', 'OWNER', 'MANAGER'])
            ->first();

        if (!$supervisor) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid supervisor PIN. Cash movement requires manager authorization.',
            ], 403);
        }

        $session = RegisterSession::findOrFail($validated['session_id']);

        if ($session->status !== 'OPEN') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot add cash movements to a closed register session.',
            ], 422);
        }

        $movement = CashMovement::create([
            'id' => 'mov_' . Str::random(10),
            'session_id' => $session->id,
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'reason' => $validated['reason'],
            'authorized_by_id' => $supervisor->id,
            'authorized_by_name' => $supervisor->name,
        ]);

        if ($validated['type'] === 'CASH_IN') {
            $session->increment('total_cash_in', $validated['amount']);
        } else {
            $session->increment('total_cash_out', $validated['amount']);
        }

        return response()->json([
            'success' => true,
            'message' => "{$validated['type']} of \${$validated['amount']} recorded successfully",
            'movement' => $movement,
            'session' => $session->fresh(),
        ]);
    }

    /**
     * 3. 🔒 Closing Register & Discrepancy Reconciliation
     */
    public function closeRegister(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string|exists:register_sessions,id',
            'closing_cash_counted' => 'required|numeric|min:0',
            'closing_card_counted' => 'nullable|numeric|min:0',
            'closing_customer_account_counted' => 'nullable|numeric|min:0',
            'closing_notes' => 'nullable|string',
        ]);

        $session = RegisterSession::with('cashMovements')->findOrFail($validated['session_id']);

        // Expected Cash Formula:
        // Expected Cash = Opening Cash + Cash Sales + Total Cash In - Total Cash Out
        $expectedCash = $session->opening_cash + $session->total_cash_sales + $session->total_cash_in - $session->total_cash_out;
        $countedCash = (float) $validated['closing_cash_counted'];
        $cashDifference = round($countedCash - $expectedCash, 2);

        $session->update([
            'closed_at' => Carbon::now(),
            'closing_cash_counted' => $countedCash,
            'closing_card_counted' => $validated['closing_card_counted'] ?? $session->total_card_sales,
            'closing_customer_account_counted' => $validated['closing_customer_account_counted'] ?? 0.00,
            'expected_cash' => round($expectedCash, 2),
            'cash_difference' => $cashDifference,
            'closing_notes' => $validated['closing_notes'] ?? 'Shift reconciled.',
            'status' => 'CLOSED',
        ]);

        $reconciliationStatus = 'BALANCED';
        if ($cashDifference < 0) {
            $reconciliationStatus = 'SHORTAGE';
        } elseif ($cashDifference > 0) {
            $reconciliationStatus = 'OVERAGE';
        }

        return response()->json([
            'success' => true,
            'message' => 'Register session closed and reconciled successfully',
            'reconciliation_status' => $reconciliationStatus,
            'difference' => $cashDifference,
            'session' => $session,
        ]);
    }

    /**
     * 4. 📥 Daily Sale Export & Thermal Z-Report Data
     */
    public function zReport(string $id)
    {
        $session = RegisterSession::with(['cashMovements.authorizedBy', 'branch', 'cashier'])->findOrFail($id);

        $orders = Order::where('branch_id', $session->branch_id)
            ->whereBetween('created_at', [$session->opened_at, $session->closed_at ?? Carbon::now()])
            ->get();

        $grossSales = $orders->sum('total_amount');
        $taxCollected = $orders->sum('tax_amount');
        $discountGiven = $orders->sum('discount_amount');

        return response()->json([
            'success' => true,
            'z_report' => [
                'session_id' => $session->id,
                'branch_name' => $session->branch_name,
                'branch_address' => $session->branch?->address,
                'branch_phone' => $session->branch?->phone,
                'cashier_name' => $session->cashier_name,
                'opened_at' => $session->opened_at->format('Y-m-d H:i:s'),
                'closed_at' => $session->closed_at?->format('Y-m-d H:i:s') ?? 'ACTIVE',
                'opening_float' => $session->opening_cash,
                'gross_sales' => round($grossSales, 2),
                'cash_sales' => $session->total_cash_sales,
                'qr_sales' => $session->total_qr_sales,
                'card_sales' => $session->total_card_sales,
                'total_tax' => round($taxCollected, 2),
                'total_discount' => round($discountGiven, 2),
                'cash_in' => $session->total_cash_in,
                'cash_out' => $session->total_cash_out,
                'expected_cash' => $session->expected_cash,
                'counted_cash' => $session->closing_cash_counted,
                'difference' => $session->cash_difference,
                'total_transactions' => $orders->count(),
                'closing_notes' => $session->closing_notes,
            ],
        ]);
    }
}
