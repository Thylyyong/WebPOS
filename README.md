# WebPOS

Full-stack POS and Dining Terminal system:
- **Backend**: Laravel 11 RESTful API with SQLite database (`laravel-backend`).
- **Frontend**: Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS (`vue-frontend`).

---

## 🚀 How to Run the App

### 1. Backend Server (Laravel API)
```powershell
cd "C:\Users\asus\POS Final\laravel-backend"
php -S 127.0.0.1:8000 -t public
```
> API will run on: `http://127.0.0.1:8000/api`

### 2. Frontend Server (Vue 3 Terminal)
```powershell
cd "C:\Users\asus\POS Final\vue-frontend"
npm run dev
```
> Web UI will run on: `http://localhost:5173`

---

## 🔑 Quick Test Credentials (2 Roles)

| Role | Username | PIN | Access |
| :--- | :--- | :--- | :--- |
| **Boss** | `boss` | **`9999`** | Full Store Management, P&L Analytics, Settings, Cash Register, POS |
| **Cashier** | `cashier` | **`1234`** | Frontline POS Terminal, Dining Floor Plan Tables, Shift Register |

---

## 📖 API Documentation
For complete backend API endpoints, request bodies, and JSON responses, see:
👉 [**BACKEND_API_DOCS.md**](./BACKEND_API_DOCS.md)

---

## 🎨 Frontend Architecture (`vue-frontend`)
- **Framework**: Vue 3 (Composition API `<script setup lang="ts">`)
- **Build Tool**: Vite 6 (with dev proxy to `http://127.0.0.1:8000`)
- **State Stores**: Pinia (`auth`, `catalog`, `cart`, `tables`, `register`, `accounting`, `ui`)
- **Router**: Vue Router 4 with Role-Based Route Guards (`Boss` vs `Cashier`)
- **Icons**: Lucide Vue (`@lucide/vue`)
- **Design System**: *Obsidian Dark Luxury* palette with glassmorphism and touchscreen ergonomics (min 48–60px targets)
- **Features Included**:
  - Splash / Fast-Switch Role & PIN Keypad login
  - Dual-pane POS Terminal (Category pills, Product grid, Barcode scan, Cart sidebar)
  - Quick Tender Cash, Card, QR, Split Bill, and Held / Parked Tickets
  - Thermal 80mm printable customer receipt
  - Dining Tables Floor Plan (Zones, Occupied/Available status, Party assignment, Table transfer, Release)
  - Cash Register Shift Management (Opening float, Petty cash In/Out with supervisor PIN, Drawer close reconciliation, and printable Z-Report)
  - Boss P&L Analytics (Gross Sales, COGS, Gross Profit, Expenses ledger, and Hybrid Franchise Settlement)
  - Store & Receipt Configuration Settings
