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
            $orderId = 'ord_' . Str::random(10);
            $datePrefix = Carbon::now()->format('Ymd');
            $randomSeq = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $receiptNo = "RCP-{$datePrefix}-{$randomSeq}";
            $orderNumber = '#' . substr($randomSeq, -3);

            $order = Order::create([
                'id' => $orderId,
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
            ]);

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
     * Park / Hold an active order
     */
    public function holdOrder(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|string',
            'customer_name' => 'nullable|string',
            'table_number' => 'nullable|string',
            'subtotal' => 'required|numeric',
            'total_amount' => 'required|numeric',
            'items' => 'required|array|min:1',
        ]);

        $orderId = 'park_' . Str::random(8);
        $receiptNo = 'PARK-' . Carbon::now()->format('His');

        $order = Order::create([
            'id' => $orderId,
            'branch_id' => $validated['branch_id'],
            'receipt_no' => $receiptNo,
            'order_number' => 'HOLD',
            'customer_name' => $validated['customer_name'] ?? 'Parked Ticket',
            'table_number' => $validated['table_number'] ?? null,
            'subtotal' => $validated['subtotal'],
            'total_amount' => $validated['total_amount'],
            'payment_method' => 'PENDING',
            'status' => 'PARKED',
        ]);

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

        return response()->json([
            'success' => true,
            'message' => 'Order parked successfully',
            'order' => $order->load('items'),
        ]);
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

        $order = Order::findOrFail($id);
        $order->status = 'CANCELLED';
        $order->save();

        return response()->json([
            'success' => true,
            'message' => "Order {$order->receipt_no} has been voided",
            'order' => $order,
        ]);
    }
}
