<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use App\Models\Order;
use Illuminate\Http\Request;

class TableController extends Controller
{
    /**
     * Get visual floor plan tables grouped by zones
     */
    public function index(Request $request)
    {
        $branchId = $request->query('branch_id', 'store_a');

        $tables = DiningTable::where('branch_id', $branchId)
            ->with(['currentOrder.items'])
            ->get();

        $zones = $tables->pluck('zone')->unique()->values();

        $stats = [
            'total' => $tables->count(),
            'available' => $tables->where('status', 'AVAILABLE')->count(),
            'occupied' => $tables->where('status', 'OCCUPIED')->count(),
            'billed' => $tables->where('status', 'BILLED')->count(),
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats,
            'zones' => $zones,
            'tables' => $tables,
        ]);
    }

    /**
     * Assign dining table to guest / start new tab
     */
    public function assign(Request $request, string $id)
    {
        $request->validate([
            'customer_name' => 'nullable|string',
            'capacity' => 'nullable|integer|min:1',
            'order_total' => 'nullable|numeric',
        ]);

        $table = DiningTable::findOrFail($id);
        $table->status = 'OCCUPIED';
        if ($request->filled('customer_name')) {
            $table->customer_name = $request->customer_name;
        }
        if ($request->filled('order_total')) {
            $table->order_total = $request->order_total;
        }
        $table->save();

        return response()->json([
            'success' => true,
            'message' => "Table {$table->table_number} is now Occupied",
            'table' => $table,
        ]);
    }

    /**
     * Transfer dining table tab from source table to destination table
     */
    public function transfer(Request $request, string $id)
    {
        $request->validate([
            'target_table_id' => 'required|string|exists:dining_tables,id',
        ]);

        $sourceTable = DiningTable::findOrFail($id);
        $targetTable = DiningTable::findOrFail($request->target_table_id);

        if ($targetTable->status === 'OCCUPIED' && $targetTable->id !== $sourceTable->id) {
            return response()->json([
                'success' => false,
                'message' => "Target table {$targetTable->table_number} is already occupied!",
            ], 422);
        }

        // Move active order and details
        $targetTable->status = $sourceTable->status;
        $targetTable->customer_name = $sourceTable->customer_name;
        $targetTable->order_total = $sourceTable->order_total;
        $targetTable->current_order_id = $sourceTable->current_order_id;
        $targetTable->save();

        // Update active order's table reference if linked
        if ($sourceTable->current_order_id) {
            Order::where('id', $sourceTable->current_order_id)->update([
                'table_id' => $targetTable->id,
                'table_number' => $targetTable->table_number,
            ]);
        }

        // Free source table
        $sourceTable->status = 'AVAILABLE';
        $sourceTable->customer_name = null;
        $sourceTable->order_total = 0.00;
        $sourceTable->current_order_id = null;
        $sourceTable->save();

        return response()->json([
            'success' => true,
            'message' => "Order transferred successfully from {$sourceTable->table_number} to {$targetTable->table_number}",
            'source_table' => $sourceTable,
            'target_table' => $targetTable,
        ]);
    }

    /**
     * Release dining table back to AVAILABLE
     */
    public function release(string $id)
    {
        $table = DiningTable::findOrFail($id);
        $table->status = 'AVAILABLE';
        $table->customer_name = null;
        $table->order_total = 0.00;
        $table->current_order_id = null;
        $table->save();

        return response()->json([
            'success' => true,
            'message' => "Table {$table->table_number} is now Available",
            'table' => $table,
        ]);
    }
}
