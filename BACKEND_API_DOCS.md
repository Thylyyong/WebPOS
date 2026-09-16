# OmniPOS Backend API Documentation for Frontend Team

Welcome! The Laravel backend is **100% complete, fully tested, and ready** for the frontend team to build custom UI components.

---

## 🚀 1. Quick Start

### Base URL
```
http://127.0.0.1:8000/api
```

### Start the Backend Server
```powershell
cd "C:\Users\asus\POS Final\laravel-backend"
php -S 127.0.0.1:8000 -t public
```

### Database
- Engine: **SQLite** (`database/database.sqlite`)
- Seeded with clean, production-grade test data.

### Seeded Credentials (2 Clean Roles)

| Role | Username | Default PIN | Permissions |
| :--- | :--- | :--- | :--- |
| **Boss** (Manager / Owner) | `boss` | **`9999`** | Full store access, P&L financials, shift oversight, settings |
| **Cashier** (Frontline) | `cashier` | **`1234`** | POS terminal, dining floor plan, shift register cash drawer |

---

## 🔑 2. Authentication & Roles

### 2.1 Get Available Roles
Returns the 2 active user profiles for the splash/login screen.
- **Endpoint**: `GET /api/auth/roles`
- **Response**:
```json
{
  "success": true,
  "roles": [
    {
      "id": 16,
      "name": "Boss",
      "username": "boss",
      "role": "BOSS",
      "branch_id": "store_main",
      "branch_name": "OmniPOS Main Store"
    },
    {
      "id": 17,
      "name": "Cashier",
      "username": "cashier",
      "role": "CASHIER",
      "branch_id": "store_main",
      "branch_name": "OmniPOS Main Store"
    }
  ]
}
```

### 2.2 Login with PIN
Authenticate a user using their 4-digit PIN.
- **Endpoint**: `POST /api/auth/login-pin`
- **Request Body**:
```json
{
  "pin_code": "9999",
  "username": "boss"
}
```
*(Note: `username` is optional. If omitted, the backend authenticates against any user with that PIN).*

- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "1|qX9...BearerToken...",
  "user": {
    "id": 16,
    "name": "Boss",
    "username": "boss",
    "role": "BOSS",
    "branch_id": "store_main",
    "branch_name": "OmniPOS Main Store",
    "is_main_boss": true,
    "is_sub_boss": false,
    "is_cashier": false
  }
}
```

---

## 📦 3. Catalog & Products

### 3.1 Get Categories
- **Endpoint**: `GET /api/catalog/categories`
- **Response**:
```json
{
  "success": true,
  "categories": [
    {
      "id": "cat_coffee",
      "name": "Coffee & Drinks",
      "color_hex": "#D97706",
      "display_order": 1,
      "products_count": 4
    },
    {
      "id": "cat_food",
      "name": "Gourmet Food",
      "color_hex": "#EF4444",
      "display_order": 2,
      "products_count": 4
    },
    {
      "id": "cat_bakery",
      "name": "Bakery & Dessert",
      "color_hex": "#10B981",
      "display_order": 3,
      "products_count": 4
    }
  ]
}
```

### 3.2 Get Products
- **Endpoint**: `GET /api/catalog/products`
- **Query Params (Optional)**:
  - `category_id`: string (filter by category)
  - `search`: string (search by name, SKU, or barcode)
- **Response**:
```json
{
  "success": true,
  "count": 12,
  "products": [
    {
      "id": "prod_espresso",
      "category_id": "cat_coffee",
      "name": "Artisan Espresso",
      "sku": "COF-001",
      "barcode": "200001",
      "price": 3.5,
      "cost": 0.85,
      "stock_quantity": 150,
      "tax_rate": 10.0,
      "is_available": true
    },
    {
      "id": "prod_wagyu_burger",
      "category_id": "cat_food",
      "name": "Truffle Wagyu Burger Deluxe",
      "sku": "FOOD-001",
      "barcode": "200005",
      "price": 16.5,
      "cost": 5.8,
      "stock_quantity": 50,
      "tax_rate": 10.0,
      "is_available": true
    }
  ]
}
```

### 3.3 Barcode Scanner Lookup
Instant product lookup when a cashier scans a physical or digital barcode.
- **Endpoint**: `GET /api/catalog/products/barcode/{barcode}`
- **Example**: `GET /api/catalog/products/barcode/200005`
- **Response**:
```json
{
  "success": true,
  "product": {
    "id": "prod_wagyu_burger",
    "name": "Truffle Wagyu Burger Deluxe",
    "price": 16.5,
    "cost": 5.8,
    "barcode": "200005",
    "stock_quantity": 50
  }
}
```

---

## 🍽️ 4. Floor Plan & Dining Tables

### 4.1 Get All Tables
- **Endpoint**: `GET /api/tables`
- **Query Params**: `branch_id=store_main`
- **Response**:
```json
{
  "success": true,
  "tables": [
    {
      "id": "tbl_01",
      "table_number": "Table 1",
      "zone": "Main Dining",
      "capacity": 2,
      "status": "AVAILABLE",
      "customer_name": null,
      "order_total": 0.0
    },
    {
      "id": "tbl_03",
      "table_number": "Table 3",
      "zone": "Main Dining",
      "capacity": 4,
      "status": "OCCUPIED",
      "customer_name": "VIP Table",
      "order_total": 24.5
    }
  ]
}
```

### 4.2 Assign Table
Open a table and assign customer/party name.
- **Endpoint**: `POST /api/tables/{id}/assign`
- **Request Body**:
```json
{
  "customer_name": "John Doe Party",
  "order_total": 0
}
```

### 4.3 Transfer Table (Move Party to Another Table)
- **Endpoint**: `POST /api/tables/{id}/transfer`
- **Request Body**:
```json
{
  "target_table_id": "tbl_02"
}
```

### 4.4 Release Table (Mark Clean & Available)
- **Endpoint**: `POST /api/tables/{id}/release`

---

## 🛒 5. Orders & Checkout

### 5.1 Process POS Checkout
Completes an order, calculates tax and change, logs a printable thermal receipt, and updates table status.
- **Endpoint**: `POST /api/orders`
- **Request Body**:
```json
{
  "branch_id": "store_main",
  "cashier_id": 17,
  "table_id": "tbl_01",
  "table_number": "Table 1",
  "customer_name": "Walk-In Customer",
  "order_type": "DINE_IN",
  "subtotal": 20.00,
  "discount_amount": 0.00,
  "tax_amount": 2.00,
  "total_amount": 22.00,
  "payment_method": "CASH",
  "cash_tendered": 50.00,
  "change_amount": 28.00,
  "items": [
    {
      "product_id": "prod_wagyu_burger",
      "product_name": "Truffle Wagyu Burger Deluxe",
      "quantity": 1,
      "unit_price": 16.50,
      "total_price": 16.50
    },
    {
      "product_id": "prod_matcha",
      "product_name": "Ceremonial Uji Matcha",
      "quantity": 1,
      "unit_price": 5.50,
      "total_price": 5.50
    }
  ]
}
```

- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Order processed successfully",
  "order": {
    "id": "ord_a1b2c3d4",
    "receipt_no": "RCP-20260916-4821",
    "status": "COMPLETED",
    "total_amount": 22.00,
    "cash_tendered": 50.00,
    "change_amount": 28.00,
    "payment_method": "CASH",
    "created_at": "2026-09-16T12:00:00.000000Z",
    "items": [ ... ]
  }
}
```

### 5.2 Hold Cart Order
- **Endpoint**: `POST /api/orders/hold`
- **Request Body**: `{ "branch_id": "store_main" }`

### 5.3 Split Bill
- **Endpoint**: `POST /api/orders/{id}/split`
- **Request Body**:
```json
{
  "split_count": 2,
  "payments": [
    { "amount": 11.00, "payment_method": "CASH" },
    { "amount": 11.00, "payment_method": "CARD" }
  ]
}
```

---

## 💵 6. Shift Register & Cash Drawer

### 6.1 Get Active Shift Status
- **Endpoint**: `GET /api/register/current?branch_id=store_main`
- **Response**:
```json
{
  "success": true,
  "has_active_session": true,
  "session": {
    "id": "reg_sess_active_01",
    "branch_id": "store_main",
    "cashier_name": "Cashier",
    "status": "OPEN",
    "opening_cash": 300.00,
    "cash_sales": 48.50,
    "cash_in": 0.00,
    "cash_out": 0.00,
    "expected_cash": 348.50,
    "cash_movements": []
  }
}
```

### 6.2 Open Register / Start Shift
- **Endpoint**: `POST /api/register/open`
- **Request Body**:
```json
{
  "branch_id": "store_main",
  "opening_cash": 300.00,
  "opening_notes": "Morning float verified"
}
```

### 6.3 Cash Movement (Petty Cash In / Out)
- **Endpoint**: `POST /api/register/cash-movement`
- **Request Body**:
```json
{
  "session_id": "reg_sess_active_01",
  "type": "CASH_IN",
  "amount": 50.00,
  "reason": "Change fund replenishment",
  "supervisor_pin": "9999"
}
```
*(Types: `CASH_IN` or `CASH_OUT`)*

### 6.4 Close Register & Reconcile
- **Endpoint**: `POST /api/register/close`
- **Request Body**:
```json
{
  "session_id": "reg_sess_active_01",
  "closing_cash_counted": 348.50,
  "closing_notes": "Drawer balanced cleanly"
}
```
*(Backend automatically calculates discrepancy: `closing_cash_counted - expected_cash`)*.

### 6.5 Daily Shift Z-Report Data
- **Endpoint**: `GET /api/register/{sessionId}/z-report`
- **Response**: Returns full financial breakdown (Gross Sales, Discounts, Tax, Cash/Card/QR totals, and Drawer Reconciliation).

---

## 📊 7. Simple Web Financials & P&L

### 7.1 Profit & Loss Summary
- **Endpoint**: `GET /api/accounting/profit-loss?branch_id=store_main`
- **Response**:
```json
{
  "success": true,
  "profit_loss": {
    "gross_sales": 80.50,
    "cogs": 24.30,
    "gross_profit": 56.20,
    "gross_margin_percent": 69.8,
    "total_expenses": 65.00,
    "net_profit": -8.80,
    "net_margin_percent": -10.9
  }
}
```

### 7.2 Get Store Expenses
- **Endpoint**: `GET /api/accounting/expenses?branch_id=store_main`

### 7.3 Log Store Expense
- **Endpoint**: `POST /api/accounting/expenses`
- **Request Body**:
```json
{
  "branch_id": "store_main",
  "category": "Supplies",
  "title": "Ice Bags & Coffee Cups Restock",
  "amount": 25.00,
  "notes": "Paid cash from register"
}
```

---

## ⚖️ 8. Hybrid Franchise Settlement

- **Formula**: `$500.00 Base Rent / Month + 3% of Gross Sales`
- **Endpoint**: `GET /api/settlement/summary`
- **Trigger Settlement**: `POST /api/settlement/settle`
  - **Body**: `{ "branch_id": "store_main", "period_start": "2026-09-01", "period_end": "2026-09-30" }`

---

## ⚙️ 9. Store Settings

- **Get Settings**: `GET /api/settings`
- **Update Settings**: `POST /api/settings`
  - **Body**:
    ```json
    {
      "settings": {
        "store_name": "OmniPOS Bistro",
        "store_phone": "+1 (555) 019-2834",
        "currency_symbol": "$",
        "default_tax_rate": "10",
        "receipt_header": "Welcome to OmniPOS Bistro!",
        "receipt_footer": "Thank you for dining with us!"
      }
    }
    ```

---

## 📐 10. Ready TypeScript Interfaces for Frontend

Your frontend team can copy and paste this directly into their TypeScript project:

```typescript
export interface User {
  id: number;
  name: string;
  username: string;
  role: 'BOSS' | 'CASHIER';
  branch_id: string;
  branch_name: string;
  is_main_boss: boolean;
  is_cashier: boolean;
}

export interface Category {
  id: string;
  name: string;
  color_hex?: string;
  display_order: number;
  products_count?: number;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost: number;
  stock_quantity: number;
  tax_rate: number;
  is_available: boolean;
}

export interface DiningTable {
  id: string;
  table_number: string;
  zone: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'BILLED';
  customer_name?: string;
  order_total?: number;
}

export interface RegisterSession {
  id: string;
  cashier_name: string;
  status: 'OPEN' | 'CLOSED';
  opening_cash: number;
  cash_sales: number;
  cash_in: number;
  cash_out: number;
  expected_cash: number;
}

export interface ProfitLoss {
  gross_sales: number;
  cogs: number;
  gross_profit: number;
  gross_margin_percent: number;
  total_expenses: number;
  net_profit: number;
  net_margin_percent: number;
}
```
