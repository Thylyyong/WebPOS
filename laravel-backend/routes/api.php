<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\RegisterSessionController;
use App\Http\Controllers\Api\AccountingController;
use App\Http\Controllers\Api\SettlementController;
use App\Http\Controllers\Api\CustomerDisplayController;
use App\Http\Controllers\Api\SettingController;

/*
|--------------------------------------------------------------------------
| OmniPOS Enterprise API Routes
|--------------------------------------------------------------------------
| High-performance RESTful API matching Flutter POS & Odoo enterprise spec.
*/

// Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'OmniPOS Enterprise API',
        'version' => '1.0.0',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Authentication & Roles
Route::prefix('auth')->group(function () {
    Route::get('/roles', [AuthController::class, 'roles']);
    Route::post('/login-pin', [AuthController::class, 'loginWithPin']);
    Route::post('/switch-branch', [AuthController::class, 'switchBranch']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Catalog & Inventory
Route::prefix('catalog')->group(function () {
    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::get('/products', [CatalogController::class, 'products']);
    Route::get('/products/barcode/{barcode}', [CatalogController::class, 'findByBarcode']);
    Route::post('/products', [CatalogController::class, 'storeProduct']);
    Route::patch('/products/{id}/stock', [CatalogController::class, 'updateStock']);
});

// Dining Tables & Floor Plan
Route::prefix('tables')->group(function () {
    Route::get('/', [TableController::class, 'index']);
    Route::post('/{id}/assign', [TableController::class, 'assign']);
    Route::post('/{id}/transfer', [TableController::class, 'transfer']);
    Route::post('/{id}/release', [TableController::class, 'release']);
});

// Orders & Checkout
Route::prefix('orders')->group(function () {
    Route::get('/', [OrderController::class, 'index']);
    Route::get('/parked', [OrderController::class, 'parkedOrders']);
    Route::get('/{id}', [OrderController::class, 'show']);
    Route::post('/', [OrderController::class, 'store']);
    Route::post('/hold', [OrderController::class, 'holdOrder']);
    Route::post('/{id}/split', [OrderController::class, 'splitBill']);
    Route::post('/{id}/void', [OrderController::class, 'voidOrder']);
});

// Cash Register Session Lifecycle (Odoo Sessions)
Route::prefix('register')->group(function () {
    Route::get('/current', [RegisterSessionController::class, 'current']);
    Route::post('/open', [RegisterSessionController::class, 'openRegister']);
    Route::post('/cash-movement', [RegisterSessionController::class, 'cashMovement']);
    Route::post('/close', [RegisterSessionController::class, 'closeRegister']);
    Route::get('/{id}/z-report', [RegisterSessionController::class, 'zReport']);
});

// Odoo-Style Mini Accounting (Profit & Loss)
Route::prefix('accounting')->group(function () {
    Route::get('/profit-loss', [AccountingController::class, 'profitLoss']);
    Route::get('/expenses', [AccountingController::class, 'expenses']);
    Route::post('/expenses', [AccountingController::class, 'storeExpense']);
});

// Hybrid Settlement Engine (Sub Bosses ➔ Main Boss)
Route::prefix('settlement')->group(function () {
    Route::get('/summary', [SettlementController::class, 'summary']);
    Route::post('/config/{branchId}', [SettlementController::class, 'updateConfig']);
    Route::post('/settle', [SettlementController::class, 'settle']);
});

// Customer-Facing Display (CFD)
Route::prefix('customer-display')->group(function () {
    Route::get('/state', [CustomerDisplayController::class, 'getState']);
    Route::post('/state', [CustomerDisplayController::class, 'updateState']);
    Route::post('/clear', [CustomerDisplayController::class, 'clearState']);
});

// Store Settings & Branches
Route::prefix('settings')->group(function () {
    Route::get('/', [SettingController::class, 'index']);
    Route::post('/', [SettingController::class, 'update']);
});

Route::get('/branches', [SettingController::class, 'branches']);
