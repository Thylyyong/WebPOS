<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Subcategory;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CatalogController extends Controller
{
    /**
     * List all categories with subcategories and active product counts
     */
    public function categories()
    {
        $categories = Category::with(['subcategories'])
            ->withCount('products')
            ->orderBy('display_order', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'categories' => $categories,
        ]);
    }

    /**
     * List products with search, category filtering and barcode matching
     */
    public function products(Request $request)
    {
        $query = Product::with(['category', 'subcategory'])->available();

        if ($request->filled('category_id') && $request->category_id !== 'all') {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('subcategory_id')) {
            $query->where('subcategory_id', $request->subcategory_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $products = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'count' => $products->count(),
            'products' => $products,
        ]);
    }

    /**
     * Instant lookup by USB/HID barcode scan
     */
    public function findByBarcode(string $barcode)
    {
        $product = Product::with(['category', 'subcategory'])
            ->where('barcode', $barcode)
            ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => "No product found with barcode '{$barcode}'",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'product' => $product,
        ]);
    }

    /**
     * Create new catalog product (Main Boss / Store Manager)
     */
    public function storeProduct(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|string|exists:categories,id',
            'subcategory_id' => 'nullable|string|exists:subcategories,id',
            'price' => 'required|numeric|min:0',
            'cost' => 'nullable|numeric|min:0', // COGS
            'sku' => 'nullable|string|unique:products,sku',
            'barcode' => 'nullable|string',
            'description' => 'nullable|string',
            'stock_quantity' => 'nullable|integer|min:0',
            'tax_rate' => 'nullable|numeric|min:0',
            'image_path' => 'nullable|string',
        ]);

        $validated['id'] = 'prod_' . Str::random(8);
        if (empty($validated['cost'])) {
            $validated['cost'] = 0.00;
        }

        $product = Product::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product added to catalog successfully',
            'product' => $product->load(['category', 'subcategory']),
        ], 201);
    }

    /**
     * Quick stock quantity adjustment
     */
    public function updateStock(Request $request, string $id)
    {
        $request->validate([
            'stock_quantity' => 'required|integer',
        ]);

        $product = Product::findOrFail($id);
        $product->update([
            'stock_quantity' => $request->stock_quantity,
            'in_stock' => $request->stock_quantity > 0 ? 1 : 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Stock updated for {$product->name}",
            'product' => $product,
        ]);
    }
}
