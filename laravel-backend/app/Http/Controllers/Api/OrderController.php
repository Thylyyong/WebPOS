<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\DiningTable;
use App\Models\Product;
use App\Models\ReceiptLog;
use App\Models\RegisterSession;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OrderController extends Controller
{
    /**
     * List past orders
     */
    public function index(Request $request)
    {
        $branchId = $request->query('branch_id');
        $status = $request->query('status', 'COMPLETED');
        $search = $request->query('search');

        $query = Order::with(['items.product', 'cashier', 'diningTable']);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('receipt_no', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('table_number', 'like', "%{$search}%");
            });
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'orders' => $orders,
        ]);
    }

    /**
     * Get single order details with itemized breakdown and thermal receipt representation
     */
    public function show(string $id)
    {
        $order = Order::with(['items.product', 'cashier', 'branch'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'order' => $order,
            'cogs_total' => $order->cogs,
        ]);
    }

    /**
     * Create / Checkout POS order
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|string|exists:branches,id',
            'order_id' => 'nullable|string', // set when completing an existing PARKED/held order
            'cashier_id' => 'nullable|integer|exists:users,id',
            'table_id' => 'nullable|string',
            'table_number' => 'nullable|string',
            'customer_name' => 'nullable|string',
            'order_type' => 'nullable|string', // DINE_IN, TAKEAWAY, DELIVERY
            'subtotal' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string', // CASH, QR, CARD, CUSTOMER_ACCOUNT
            'cash_tendered' => 'nullable|numeric|min:0',
            'change_amount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|string',
            'items.*.product_name' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.total_price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string',
            'items.*.course' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // Completing an existing held (PARKED) order: reuse that order record
            // instead of creating a second one.
            $parked = null;
            if (!empty($validated['order_id'])) {
                $parked = Order::where('id', $validated['order_id'])
                    ->where('branch_id', $validated['branch_id'])
                    ->lockForUpdate()
                    ->first();

                if (!$parked || $parked->status !== 'PARKED') {
                    return response()->json([
                        'success' => false,
                        'message' => 'This held order is no longer available (already paid, cancelled or removed).',
                    ], 422);
                }
            }

            $orderId = 'ord_' . Str::random(10);
            $datePrefix = Carbon::now()->format('Ymd');
            $randomSeq = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $receiptNo = "RCP-{$datePrefix}-{$randomSeq}";
            $orderNumber = '#' . substr($randomSeq, -3);

            $attributes = [
                'branch_id' => $validated['branch_id'],
                'receipt_no' => $receiptNo,
                'order_number' => $orderNumber,
                'cashier_id' => $validated['cashier_id'] ?? $request->user()?->id,
                'table_id' => $validated['table_id'] ?? null,
                'table_number' => $validated['table_number'] ?? null,
                'customer_name' => $validated['customer_name'] ?? 'Walk-In Guest',
                'order_type' => $validated['order_type'] ?? 'DINE_IN',
                'subtotal' => $validated['subtotal'],
                'discount_amount' => $validated['discount_amount'] ?? 0.00,
                'discount_percent' => $validated['discount_percent'] ?? 0.00,
                'tax_amount' => $validated['tax_amount'] ?? 0.00,
                'tax_rate' => $validated['tax_rate'] ?? 10.00,
                'total_amount' => $validated['total_amount'],
                'payment_method' => strtoupper($validated['payment_method']),
                'cash_tendered' => $validated['cash_tendered'] ?? $validated['total_amount'],
                'change_amount' => $validated['change_amount'] ?? 0.00,
                'status' => 'COMPLETED',
                'kitchen_status' => 'PREPARING',
            ];

            if ($parked) {
                // If the cashier detached/changed the table while continuing the order,
                // free the table that was linked to the held order.
                if ($parked->table_id && $parked->table_id !== ($validated['table_id'] ?? null)) {
                    $this->unlinkTableFromOrder($parked->table_id, $parked->id);
                }

                // Items are replaced with the final cart contents (held orders never
                // touched stock, so inventory is adjusted below exactly once).
                $parked->items()->delete();
                $parked->fill($attributes);
                // Count the sale in the period it was actually paid so register
                // sessions / Z-reports (which filter on created_at) stay consistent
                // with the running totals incremented below.
                $parked->created_at = Carbon::now();
                $parked->save();
                $order = $parked;
            } else {
                $order = Order::create(['id' => $orderId] + $attributes);
            }

            // Create Order Items and adjust inventory
            foreach ($validated['items'] as $itemData) {
                $costPrice = 0.00;
                if (!empty($itemData['product_id'])) {
                    $prod = Product::find($itemData['product_id']);
                    if ($prod) {
                        $costPrice = $prod->cost;
                        // Decrement stock
                        $prod->decrement('stock_quantity', $itemData['quantity']);
                    }
                }

                OrderItem::create([
                    'id' => 'item_' . Str::random(10),
                    'order_id' => $order->id,
                    'product_id' => $itemData['product_id'] ?? null,
                    'product_name' => $itemData['product_name'],
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'cost_price' => $costPrice,
                    'total_price' => $itemData['total_price'],
                    'notes' => $itemData['notes'] ?? null,
                    'course' => $itemData['course'] ?? 'MAIN',
                ]);
            }

            // Release dining table if order was linked to one
            if (!empty($validated['table_id'])) {
                $table = DiningTable::find($validated['table_id']);
                if ($table) {
                    $table->status = 'AVAILABLE';
                    $table->customer_name = null;
                    $table->order_total = 0.00;
                    $table->current_order_id = null;
                    $table->save();
                }
            }

            // Update active register session running totals
            $session = RegisterSession::where('branch_id', $validated['branch_id'])
                ->where('status', 'OPEN')
                ->latest()
                ->first();

            if ($session) {
                $session->increment('total_orders', 1);
                if (str_contains(strtoupper($validated['payment_method']), 'CASH')) {
                    $session->increment('total_cash_sales', $validated['total_amount']);
                } elseif (str_contains(strtoupper($validated['payment_method']), 'QR')) {
                    $session->increment('total_qr_sales', $validated['total_amount']);
                } elseif (str_contains(strtoupper($validated['payment_method']), 'CARD')) {
                    $session->increment('total_card_sales', $validated['total_amount']);
                }
            }

            // Log receipt creation
            ReceiptLog::create([
                'id' => 'log_' . Str::random(10),
                'receipt_no' => $receiptNo,
                'order_id' => $order->id,
                'action' => 'INITIAL_PRINT',
                'is_success' => true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order completed successfully',
                'order' => $order->load('items'),
            ], 201);
        });
    }

    /**
     * Park / Hold an active order.
     *
     * When `order_id` is supplied the existing PARKED order is updated in place
     * (continue-order flow: resume -> add/modify items -> hold again) instead of
     * creating a second held ticket.
     */
    public function holdOrder(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|string',
            'order_id' => 'nullable|string',
            'customer_name' => 'nullable|string',
            'table_id' => 'nullable|string',
            'table_number' => 'nullable|string',
            'order_type' => 'nullable|string',
            'subtotal' => 'required|numeric',
            'discount_amount' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric',
            'items' => 'required|array|min:1',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $existing = null;
            if (!empty($validated['order_id'])) {
                $existing = Order::where('id', $validated['order_id'])
                    ->where('branch_id', $validated['branch_id'])
                    ->lockForUpdate()
                    ->first();

                if (!$existing || $existing->status !== 'PARKED') {
                    return response()->json([
                        'success' => false,
                        'message' => 'This held order is no longer available (already paid, cancelled or removed).',
                    ], 422);
                }
            }

            $attributes = [
                'branch_id' => $validated['branch_id'],
                'cashier_id' => $request->user()?->id,
                'customer_name' => $validated['customer_name'] ?? 'Parked Ticket',
                'table_id' => $validated['table_id'] ?? null,
                'table_number' => $validated['table_number'] ?? null,
                'order_type' => $validated['order_type'] ?? 'DINE_IN',
                'subtotal' => $validated['subtotal'],
                'discount_amount' => $validated['discount_amount'] ?? 0.00,
                'discount_percent' => $validated['discount_percent'] ?? 0.00,
                'tax_amount' => $validated['tax_amount'] ?? 0.00,
                'total_amount' => $validated['total_amount'],
                'payment_method' => 'PENDING',
                'status' => 'PARKED',
            ];

            if ($existing) {
                if ($existing->table_id && $existing->table_id !== ($validated['table_id'] ?? null)) {
                    $this->unlinkTableFromOrder($existing->table_id, $existing->id);
                }
                $existing->items()->delete();
                $existing->fill($attributes)->save();
                $order = $existing;
            } else {
                $order = Order::create([
                    'id' => 'park_' . Str::random(8),
                    'receipt_no' => 'PARK-' . Carbon::now()->format('His'),
                    'order_number' => 'HOLD',
                ] + $attributes);
            }

            foreach ($validated['items'] as $item) {
                OrderItem::create([
                    'id' => 'item_' . Str::random(10),
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['total_price'],
                ]);
            }

            // Keep the table relationship: the table now points at this held order.
            if (!empty($validated['table_id'])) {
                $table = DiningTable::find($validated['table_id']);
                if ($table) {
                    if ($table->status === 'AVAILABLE') {
                        $table->status = 'OCCUPIED';
                    }
                    $table->current_order_id = $order->id;
                    $table->order_total = $validated['total_amount'];
                    $table->save();
                }
            }

            return response()->json([
                'success' => true,
                'message' => $existing ? 'Held order updated successfully' : 'Order parked successfully',
                'order' => $order->load('items'),
            ]);
        });
    }

    /**
     * Detach a held order from a table (only if the table still points at that order).
     * The table itself stays occupied/untouched otherwise — releasing a table remains
     * an explicit floor-plan action.
     */
    private function unlinkTableFromOrder(string $tableId, string $orderId): void
    {
        $table = DiningTable::find($tableId);
        if ($table && $table->current_order_id === $orderId) {
            $table->current_order_id = null;
            $table->save();
        }
    }

    /**
     * List currently parked/held orders
     */
    public function parkedOrders(Request $request)
    {
        $branchId = $request->query('branch_id', 'store_a');
        $parked = Order::where('branch_id', $branchId)
            ->where('status', 'PARKED')
            ->with('items')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'orders' => $parked,
        ]);
    }

    /**
     * Odoo Bill Split: Split by Items or Equal Split
     */
    public function splitBill(Request $request, string $id)
    {
        $order = Order::with('items')->findOrFail($id);
        $mode = $request->input('mode', 'EQUAL'); // 'EQUAL' or 'BY_ITEMS'

        if ($mode === 'EQUAL') {
            $guests = max(2, (int) $request->input('guests', 2));
            $splitTotal = round($order->total_amount / $guests, 2);
            $splits = [];
            for ($i = 1; $i <= $guests; $i++) {
                $splits[] = [
                    'split_index' => $i,
                    'amount_due' => $splitTotal,
                    'status' => 'UNPAID',
                ];
            }
            return response()->json([
                'success' => true,
                'mode' => 'EQUAL',
                'original_order_id' => $order->id,
                'total_amount' => $order->total_amount,
                'guests' => $guests,
                'splits' => $splits,
            ]);
        }

        // By items
        $selectedItemIds = $request->input('item_ids', []);
        $subtotal = 0.00;
        $splitItems = [];

        foreach ($order->items as $item) {
            if (in_array($item->id, $selectedItemIds)) {
                $subtotal += $item->total_price;
                $splitItems[] = $item;
            }
        }

        $tax = round($subtotal * 0.10, 2);
        $total = $subtotal + $tax;

        return response()->json([
            'success' => true,
            'mode' => 'BY_ITEMS',
            'original_order_id' => $order->id,
            'split_subtotal' => $subtotal,
            'split_tax' => $tax,
            'split_total' => $total,
            'items' => $splitItems,
        ]);
    }

    /**
     * Void completed order (Supervisor PIN required)
     */
    public function voidOrder(Request $request, string $id)
    {
        $request->validate([
            'manager_pin' => 'required|string',
            'reason' => 'required|string',
        ]);

        return DB::transaction(function () use ($id) {
            $order = Order::lockForUpdate()->findOrFail($id);

            // Voiding twice must not reverse the register totals twice.
            if ($order->status === 'CANCELLED') {
                return response()->json([
                    'success' => false,
                    'message' => "Order {$order->receipt_no} is already voided.",
                ], 422);
            }

            $wasCompleted = $order->status === 'COMPLETED';

            $order->status = 'CANCELLED';
            $order->save();

            // A completed sale was added to the register's running totals when it was paid.
            // Take it back out so Expected Cash stays consistent with the orders, but only
            // when that sale belongs to the currently open session: a session that is already
            // closed keeps the reconciliation it was closed with.
            if ($wasCompleted) {
                $session = RegisterSession::where('branch_id', $order->branch_id)
                    ->where('status', 'OPEN')
                    ->latest('opened_at')
                    ->first();

                if ($session && $order->created_at && $order->created_at >= $session->opened_at) {
                    $method = strtoupper((string) $order->payment_method);
                    $session->decrement('total_orders', 1);
                    if (str_contains($method, 'CASH')) {
                        $session->decrement('total_cash_sales', $order->total_amount);
                    } elseif (str_contains($method, 'QR')) {
                        $session->decrement('total_qr_sales', $order->total_amount);
                    } elseif (str_contains($method, 'CARD')) {
                        $session->decrement('total_card_sales', $order->total_amount);
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Order {$order->receipt_no} has been voided",
                'order' => $order,
            ]);
        });
    }
}
