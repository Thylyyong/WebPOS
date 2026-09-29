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
     * Upload product image file directly
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp,svg|max:5120',
        ]);

        $uploadDir = public_path('uploads/products');
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $file = $request->file('image');
        $filename = 'prod_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
        $file->move($uploadDir, $filename);

        $relativePath = 'uploads/products/' . $filename;

        return response()->json([
            'success' => true,
            'message' => 'Image uploaded successfully',
            'image_path' => $relativePath,
            'image_url' => url($relativePath),
        ]);
    }

    /**
     * Create new catalog product (Main Boss / Store Manager)
     */
    public function storeProduct(Request $request)
    {
        if ($request->has('subcategory_id') && ($request->subcategory_id === '' || $request->subcategory_id === 'null' || $request->subcategory_id === 'none')) {
            $request->merge(['subcategory_id' => null]);
        }
        if ($request->has('sku') && trim($request->sku) === '') {
            $request->merge(['sku' => null]);
        }
        if ($request->has('barcode') && trim($request->barcode) === '') {
            $request->merge(['barcode' => null]);
        }

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
            'color_hex' => 'nullable|string',
            'is_available' => 'nullable|boolean',
            'image_path' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp,svg|max:5120',
        ]);

        // Handle direct file upload if present
        if ($request->hasFile('image')) {
            $uploadDir = public_path('uploads/products');
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            $file = $request->file('image');
            $filename = 'prod_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $file->move($uploadDir, $filename);
            $validated['image_path'] = 'uploads/products/' . $filename;
        }

        unset($validated['image']);

        $validated['id'] = 'prod_' . Str::random(8);
        if (!isset($validated['cost']) || $validated['cost'] === null) {
            $validated['cost'] = 0.00;
        }
        if (!isset($validated['stock_quantity'])) {
            $validated['stock_quantity'] = 100;
        }
        $validated['in_stock'] = $validated['stock_quantity'] > 0 ? 1 : 0;
        if (!isset($validated['tax_rate'])) {
            $validated['tax_rate'] = 10.0;
        }
        if (!isset($validated['is_available'])) {
            $validated['is_available'] = true;
        }

        $product = Product::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product added to catalog successfully',
            'product' => $product->load(['category', 'subcategory']),
        ], 201);
    }

    /**
     * Update an existing product (Main Boss / Store Manager)
     */
    public function updateProduct(Request $request, string $id)
    {
        $product = Product::findOrFail($id);

        if ($request->has('subcategory_id') && ($request->subcategory_id === '' || $request->subcategory_id === 'null' || $request->subcategory_id === 'none')) {
            $request->merge(['subcategory_id' => null]);
        }
        if ($request->has('sku') && trim($request->sku) === '') {
            $request->merge(['sku' => null]);
        }
        if ($request->has('barcode') && trim($request->barcode) === '') {
            $request->merge(['barcode' => null]);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category_id' => 'sometimes|required|string|exists:categories,id',
            'subcategory_id' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'sku' => "nullable|string|unique:products,sku,{$id},id",
            'barcode' => 'nullable|string',
            'description' => 'nullable|string',
            'stock_quantity' => 'nullable|integer|min:0',
            'tax_rate' => 'nullable|numeric|min:0',
            'color_hex' => 'nullable|string',
            'is_available' => 'nullable|boolean',
            'image_path' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp,svg|max:5120',
        ]);

        // Handle uploaded file
        if ($request->hasFile('image')) {
            $uploadDir = public_path('uploads/products');
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            $file = $request->file('image');
            $filename = 'prod_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $file->move($uploadDir, $filename);
            $validated['image_path'] = 'uploads/products/' . $filename;
        } elseif ($request->boolean('remove_image')) {
            $validated['image_path'] = null;
        }

        unset($validated['image']);

        if (isset($validated['stock_quantity'])) {
            $validated['in_stock'] = $validated['stock_quantity'] > 0 ? 1 : 0;
        }

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => "Product '{$product->name}' updated successfully",
            'product' => $product->fresh(['category', 'subcategory']),
        ]);
    }

    /**
     * Delete or deactivate product
     */
    public function destroyProduct(string $id)
    {
        $product = Product::findOrFail($id);

        // Check if there are order items referencing this product
        if ($product->orderItems()->exists()) {
            $product->update(['is_available' => false]);
            return response()->json([
                'success' => true,
                'message' => "Product '{$product->name}' has order history; archived as unavailable.",
            ]);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => "Product '{$product->name}' deleted successfully",
        ]);
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

    /**
     * Create category
     */
    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color_hex' => 'nullable|string|max:30',
            'icon' => 'nullable|string|max:50',
            'display_order' => 'nullable|integer',
        ]);

        $validated['id'] = 'cat_' . Str::random(8);
        if (empty($validated['color_hex'])) {
            $validated['color_hex'] = '#0D9488';
        }
        if (!isset($validated['display_order'])) {
            $validated['display_order'] = Category::count();
        }

        $category = Category::create($validated);

        return response()->json([
            'success' => true,
            'message' => "Category '{$category->name}' created successfully",
            'category' => $category->load('subcategories'),
        ], 201);
    }

    /**
     * Update category
     */
    public function updateCategory(Request $request, string $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'color_hex' => 'nullable|string|max:30',
            'icon' => 'nullable|string|max:50',
            'display_order' => 'nullable|integer',
        ]);

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => "Category '{$category->name}' updated successfully",
            'category' => $category->fresh('subcategories'),
        ]);
    }

    /**
     * Delete category
     */
    public function destroyCategory(string $id)
    {
        $category = Category::findOrFail($id);

        // Check if category has products
        if ($category->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete category '{$category->name}' because it contains {$category->products()->count()} products. Please reassign or delete the products first.",
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => "Category '{$category->name}' deleted successfully",
        ]);
    }

    /**
     * Add subcategory
     */
    public function storeSubcategory(Request $request, string $categoryId)
    {
        $category = Category::findOrFail($categoryId);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $validated['id'] = 'sub_' . Str::random(8);
        $validated['category_id'] = $category->id;

        $sub = Subcategory::create($validated);

        return response()->json([
            'success' => true,
            'message' => "Subcategory '{$sub->name}' created successfully",
            'subcategory' => $sub,
        ], 201);
    }

    /**
     * Delete subcategory
     */
    public function destroySubcategory(string $id)
    {
        $sub = Subcategory::findOrFail($id);
        $sub->delete();

        return response()->json([
            'success' => true,
            'message' => "Subcategory deleted successfully",
        ]);
    }
}
