import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header.component';
import { PosService } from '../../core/services/pos.service';
import { CatalogService } from '../../core/services/catalog.service';
import { AuthService } from '../../core/services/auth.service';
import { Category, Product, CartItem } from '../../core/models/pos.models';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <div class="pos-layout">
      <!-- Shared Navigation Header -->
      <app-header></app-header>

      <!-- Main POS 3-Column Area -->
      <div class="pos-body">
        <!-- Center/Left Area: Catalog (Categories & Products Grid) -->
        <main class="catalog-section">
          <!-- Search & Category Header -->
          <div class="catalog-controls glass-panel">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search products by name, SKU or scan barcode..."
                class="search-input"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange()"
              />
              @if (searchTerm) {
                <button type="button" class="clear-search-btn" (click)="clearSearch()">✖</button>
              }
            </div>

            <!-- Categories Horizontal Bar -->
            <div class="categories-bar">
              <button
                type="button"
                class="category-chip"
                [class.active]="selectedCategoryId === 'all'"
                (click)="selectCategory('all')"
              >
                <span>⭐ All Items</span>
              </button>
              @for (cat of categories; track cat.id) {
                <button
                  type="button"
                  class="category-chip"
                  [class.active]="selectedCategoryId === cat.id"
                  (click)="selectCategory(cat.id)"
                  [style.--cat-color]="cat.color_hex || '#10B981'"
                >
                  <span>{{ getCategoryIcon(cat.id) }} {{ cat.name }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Products Responsive Grid -->
          <div class="products-grid">
            @for (prod of filteredProducts; track prod.id) {
              <div class="product-card glass-panel" (click)="pos.addToCart(prod)">
                <div class="product-image-wrap">
                  <img [src]="prod.image_path || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'" [alt]="prod.name" class="product-img" />
                  <div class="product-stock-pill" [class.low-stock]="prod.stock_quantity < 20">
                    {{ prod.stock_quantity }} left
                  </div>
                </div>
                <div class="product-info">
                  <div class="product-name">{{ prod.name }}</div>
                  <div class="product-meta">
                    <span class="product-sku">{{ prod.sku || 'ITEM' }}</span>
                    <span class="product-price">\${{ prod.price.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="no-products glass-panel">
                <div class="empty-icon">🍽️</div>
                <div class="empty-title">No products found</div>
                <div class="empty-desc">Try clearing your search or selecting another category.</div>
              </div>
            }
          </div>
        </main>

        <!-- Right Area: Active Cart & Odoo Touch Action Numpad -->
        <aside class="cart-section glass-panel">
          <!-- Cart Header -->
          <div class="cart-header">
            <div class="cart-title-row">
              <div class="cart-title">
                <span>🛒 Active Cart</span>
                <span class="cart-badge">{{ pos.cart().length }} items</span>
              </div>
              @if (pos.cart().length > 0) {
                <button type="button" class="clear-cart-btn" (click)="pos.clearCart()" title="Clear Cart">Clear</button>
              }
            </div>

            <!-- Table & Customer Indicator -->
            <div class="cart-meta-bar">
              <span class="meta-item">
                <span class="meta-icon">🍽️</span>
                <span>{{ pos.selectedTable()?.name || 'Walk-In Customer' }}</span>
              </span>
              <button type="button" class="hold-btn" [disabled]="pos.cart().length === 0" (click)="holdCurrentOrder()">
                📌 Hold
              </button>
            </div>
          </div>

          <!-- Cart Line Items List -->
          <div class="cart-items-scroll">
            @for (item of pos.cart(); track $index) {
              <div
                class="cart-item"
                [class.selected]="pos.selectedItemIndex() === $index"
                (click)="pos.selectedItemIndex.set($index)"
              >
                <div class="cart-item-header">
                  <span class="item-name">{{ item.product.name }}</span>
                  <span class="item-total">\${{ item.total_price.toFixed(2) }}</span>
                </div>
                <div class="cart-item-controls">
                  <div class="qty-stepper">
                    <button type="button" class="step-btn" (click)="pos.updateQuantity($index, item.quantity - 1); $event.stopPropagation()">-</button>
                    <span class="qty-val">{{ item.quantity }}</span>
                    <button type="button" class="step-btn" (click)="pos.updateQuantity($index, item.quantity + 1); $event.stopPropagation()">+</button>
                  </div>
                  <div class="unit-breakdown">
                    \${{ item.unit_price.toFixed(2) }} ea
                    @if (item.discount_percent > 0) {
                      <span class="disc-tag">-{{ item.discount_percent }}%</span>
                    }
                  </div>
                  <button type="button" class="item-delete-btn" (click)="pos.removeItem($index); $event.stopPropagation()" title="Remove item">🗑️</button>
                </div>
              </div>
            } @empty {
              <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <div class="empty-cart-text">Cart is empty</div>
                <div class="empty-cart-hint">Click products on the left or scan barcodes to begin order.</div>
              </div>
            }
          </div>

          <!-- Order Financial Totals -->
          <div class="cart-totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>\${{ pos.subtotal().toFixed(2) }}</span>
            </div>
            <div class="total-row">
              <span>Tax / VAT (10%)</span>
              <span>\${{ pos.tax().toFixed(2) }}</span>
            </div>
            <div class="total-row grand-total">
              <span>TOTAL DUE</span>
              <span class="total-amount">\${{ pos.totalDue().toFixed(2) }}</span>
            </div>
          </div>

          <!-- Odoo Action Numpad (Qty, % Disc, Tender Buttons) -->
          <div class="numpad-container">
            <div class="numpad-mode-selector">
              <button
                type="button"
                class="mode-btn"
                [class.active]="numpadMode === 'QTY'"
                (click)="setNumpadMode('QTY')"
              >
                [ Qty ]
              </button>
              <button
                type="button"
                class="mode-btn"
                [class.active]="numpadMode === 'DISC'"
                (click)="setNumpadMode('DISC')"
              >
                [ % Disc ]
              </button>
            </div>

            <div class="touch-numpad-grid">
              <button type="button" class="pad-key" (click)="onNumpadPress('1')">1</button>
              <button type="button" class="pad-key" (click)="onNumpadPress('2')">2</button>
              <button type="button" class="pad-key" (click)="onNumpadPress('3')">3</button>
              <button type="button" class="pad-key tender-key" (click)="quickTender(10)">$10</button>

              <button type="button" class="pad-key" (click)="onNumpadPress('4')">4</button>
              <button type="button" class="pad-key" (click)="onNumpadPress('5')">5</button>
              <button type="button" class="pad-key" (click)="onNumpadPress('6')">6</button>
              <button type="button" class="pad-key tender-key" (click)="quickTender(20)">$20</button>

              <button type="button" class="pad-key" (click)="onNumpadPress('7')">7</button>
              <button type="button" class="pad-key" (click)="onNumpadPress('8')">8</button>
              <button type="button" class="pad-key" (click)="onNumpadPress('9')">9</button>
              <button type="button" class="pad-key tender-key" (click)="quickTender(50)">$50</button>

              <button type="button" class="pad-key pad-action" (click)="onNumpadClear()">C</button>
              <button type="button" class="pad-key" (click)="onNumpadPress('0')">0</button>
              <button type="button" class="pad-key pad-action" (click)="onNumpadBackspace()">⌫</button>
              <button type="button" class="pad-key tender-key highlight-tender" (click)="quickTender(pos.totalDue())">Exact</button>
            </div>
          </div>

          <!-- Checkout Action Buttons -->
          <div class="checkout-actions">
            <button
              type="button"
              class="glow-btn-primary checkout-btn"
              [disabled]="pos.cart().length === 0"
              (click)="openPaymentModal('CASH')"
            >
              <span>💵 Pay Cash</span>
            </button>
            <button
              type="button"
              class="glow-btn-secondary checkout-btn qr-pay-btn"
              [disabled]="pos.cart().length === 0"
              (click)="openPaymentModal('QR')"
            >
              <span>📱 Pay QR</span>
            </button>
            <button
              type="button"
              class="glow-btn-secondary checkout-btn"
              [disabled]="pos.cart().length === 0"
              (click)="openPaymentModal('CARD')"
            >
              <span>💳 Pay Card</span>
            </button>
          </div>
        </aside>
      </div>

      <!-- Payment / Tender Modal -->
      @if (showPaymentModal) {
        <div class="modal-backdrop" (click)="closePaymentModal()">
          <div class="modal-content glass-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">{{ selectedPaymentMethod }} Payment</h2>
              <button type="button" class="close-modal-btn" (click)="closePaymentModal()">✖</button>
            </div>

            <div class="modal-body">
              <div class="due-banner">
                <span class="due-label">Total Amount Due</span>
                <span class="due-value">\${{ pos.totalDue().toFixed(2) }}</span>
              </div>

              <!-- Cash Tender Form -->
              @if (selectedPaymentMethod === 'CASH') {
                <div class="tender-calc-section">
                  <label class="calc-label">Cash Tendered by Customer</label>
                  <div class="tender-input-wrap">
                    <span class="currency-prefix">\$</span>
                    <input
                      type="number"
                      class="input-field tender-input"
                      [(ngModel)]="cashTendered"
                      (ngModelChange)="calcChange()"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <!-- Change Due Box -->
                  <div class="change-box" [class.change-ready]="changeDue >= 0">
                    <div class="change-label">Change Due:</div>
                    <div class="change-value">\${{ changeDue >= 0 ? changeDue.toFixed(2) : '0.00' }}</div>
                  </div>
                </div>
              }

              <!-- QR Code Simulator -->
              @if (selectedPaymentMethod === 'QR') {
                <div class="qr-sim-section">
                  <div class="qr-box">
                    <div class="qr-visual">
                      <!-- Stylized Dynamic QR representation -->
                      <svg class="qr-svg" viewBox="0 0 100 100">
                        <rect width="100" height="100" fill="#FFFFFF" rx="8"/>
                        <path d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z" fill="#0F172A"/>
                        <path d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z" fill="#0F172A"/>
                        <path d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z" fill="#0F172A"/>
                        <rect x="50" y="50" width="10" height="10" fill="#10B981"/>
                        <rect x="70" y="50" width="10" height="20" fill="#0F172A"/>
                        <rect x="50" y="70" width="20" height="10" fill="#0F172A"/>
                        <rect x="80" y="80" width="10" height="10" fill="#10B981"/>
                      </svg>
                    </div>
                    <div class="qr-instructions">
                      <strong>Scan to Pay \${{ pos.totalDue().toFixed(2) }}</strong>
                      <span>Dynamic payment link generated</span>
                    </div>
                  </div>
                  <button type="button" class="glow-btn-primary simulate-btn" (click)="simulateQrSuccess()">
                    ⚡ Simulate Customer Scan & Approval
                  </button>
                </div>
              }

              <!-- Card Payment -->
              @if (selectedPaymentMethod === 'CARD') {
                <div class="card-sim-section">
                  <div class="card-terminal-icon">💳</div>
                  <div class="card-instructions">Tap or insert card on POS terminal</div>
                </div>
              }
            </div>

            <div class="modal-footer">
              <button type="button" class="glow-btn-secondary" (click)="closePaymentModal()">Cancel</button>
              <button
                type="button"
                class="glow-btn-primary"
                [disabled]="isSubmitting || (selectedPaymentMethod === 'CASH' && cashTendered < pos.totalDue())"
                (click)="completeCheckout()"
              >
                {{ isSubmitting ? 'Processing...' : 'Complete Order' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Thermal Digital Receipt Modal -->
      @if (completedReceipt) {
        <div class="modal-backdrop" (click)="completedReceipt = null">
          <div class="modal-content receipt-modal glass-panel" (click)="$event.stopPropagation()">
            <div class="receipt-paper">
              <div class="receipt-header">
                <div class="receipt-brand">GOURMET BISTRO POS</div>
                <div class="receipt-sub">{{ auth.activeBranch().name }}</div>
                <div class="receipt-date">{{ completedReceipt.created_at | date:'medium' }}</div>
                <div class="receipt-no">Receipt #: {{ completedReceipt.receipt_no }}</div>
              </div>

              <div class="receipt-divider">--------------------------------</div>

              <div class="receipt-table">
                @for (item of completedReceipt.items; track item.id) {
                  <div class="receipt-row">
                    <span class="r-item">{{ item.product_name }} x{{ item.quantity }}</span>
                    <span class="r-price">\${{ item.total_price.toFixed(2) }}</span>
                  </div>
                }
              </div>

              <div class="receipt-divider">--------------------------------</div>

              <div class="receipt-calc">
                <div class="r-calc-row"><span>Subtotal:</span><span>\${{ completedReceipt.subtotal.toFixed(2) }}</span></div>
                <div class="r-calc-row"><span>Tax (10%):</span><span>\${{ completedReceipt.tax_amount.toFixed(2) }}</span></div>
                <div class="r-calc-row r-bold"><span>TOTAL:</span><span>\${{ completedReceipt.total_amount.toFixed(2) }}</span></div>
                <div class="r-calc-row"><span>Payment ({{ completedReceipt.payment_method }}):</span><span>\${{ completedReceipt.cash_tendered.toFixed(2) }}</span></div>
                @if (completedReceipt.change_amount > 0) {
                  <div class="r-calc-row"><span>Change Due:</span><span>\${{ completedReceipt.change_amount.toFixed(2) }}</span></div>
                }
              </div>

              <div class="receipt-divider">--------------------------------</div>

              <div class="receipt-footer">
                Thank you for dining with us!<br/>
                Please visit again.
              </div>
            </div>

            <div class="receipt-modal-actions">
              <button type="button" class="glow-btn-secondary" (click)="printReceipt()">🖨️ Print Receipt</button>
              <button type="button" class="glow-btn-primary" (click)="completedReceipt = null">New Order</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .pos-layout {
      height: 100vh;
      width: 100vw;
      display: flex;
      flex-direction: column;
      background: var(--bg-dark-900);
      overflow: hidden;
    }

    .pos-body {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 420px;
      gap: 16px;
      padding: 16px;
      height: calc(100vh - 64px);
      overflow: hidden;
    }

    /* Catalog Section */
    .catalog-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      height: 100%;
      overflow: hidden;
    }

    .catalog-controls {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 14px;
      color: var(--text-dim);
      font-size: 1.1rem;
    }
    .search-input {
      width: 100%;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      padding: 12px 40px;
      color: var(--text-main);
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s ease;
    }
    .search-input:focus {
      border-color: var(--emerald-500);
      box-shadow: 0 0 0 3px var(--emerald-glow);
    }
    .clear-search-btn {
      position: absolute;
      right: 14px;
      background: none;
      border: none;
      color: var(--text-dim);
      cursor: pointer;
    }

    .categories-bar {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .category-chip {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
      padding: 8px 16px;
      border-radius: var(--radius-full);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .category-chip:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-main);
    }
    .category-chip.active {
      background: rgba(16, 185, 129, 0.15);
      border-color: var(--emerald-500);
      color: #34D399;
      box-shadow: 0 0 12px var(--emerald-glow);
    }

    /* Products Grid */
    .products-grid {
      flex: 1;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 14px;
      padding-right: 4px;
    }

    .product-card {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      user-select: none;
    }
    .product-card:hover {
      transform: translateY(-4px);
      border-color: rgba(16, 185, 129, 0.4);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    }
    .product-card:active {
      transform: translateY(-1px);
    }

    .product-image-wrap {
      position: relative;
      width: 100%;
      height: 120px;
      background: #1E293B;
    }
    .product-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .product-stock-pill {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      color: #34D399;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
    }
    .product-stock-pill.low-stock {
      color: #FBBF24;
    }

    .product-info {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      justify-content: space-between;
    }
    .product-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: #F8FAFC;
      line-height: 1.3;
    }
    .product-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .product-sku {
      font-size: 0.75rem;
      color: var(--text-dim);
    }
    .product-price {
      font-weight: 800;
      color: #34D399;
      font-size: 1.05rem;
    }

    .no-products {
      grid-column: 1 / -1;
      padding: 40px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .empty-icon { font-size: 2.5rem; }
    .empty-title { font-weight: 700; font-size: 1.2rem; }
    .empty-desc { color: var(--text-muted); font-size: 0.9rem; }

    /* Cart Section */
    .cart-section {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      padding: 16px;
      gap: 12px;
      background: rgba(15, 23, 42, 0.9);
    }

    .cart-header {
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-bottom: 1px solid var(--glass-border);
      padding-bottom: 12px;
    }
    .cart-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cart-title {
      font-weight: 800;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cart-badge {
      font-size: 0.75rem;
      background: rgba(16, 185, 129, 0.15);
      color: #34D399;
      padding: 2px 8px;
      border-radius: 9999px;
    }
    .clear-cart-btn {
      background: none;
      border: none;
      color: #FB7185;
      font-size: 0.8rem;
      cursor: pointer;
      font-weight: 600;
    }

    .cart-meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.04);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .hold-btn {
      background: rgba(245, 158, 11, 0.15);
      color: #FBBF24;
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
    }
    .hold-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Cart Scroll Area */
    .cart-items-scroll {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-right: 4px;
    }

    .cart-item {
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .cart-item:hover {
      background: rgba(30, 41, 59, 0.7);
    }
    .cart-item.selected {
      border-color: var(--emerald-500);
      background: rgba(16, 185, 129, 0.1);
      box-shadow: 0 0 10px var(--emerald-glow);
    }

    .cart-item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .item-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: #F8FAFC;
    }
    .item-total {
      font-weight: 700;
      color: #34D399;
      font-size: 0.95rem;
    }

    .cart-item-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .qty-stepper {
      display: flex;
      align-items: center;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
      overflow: hidden;
    }
    .step-btn {
      width: 26px;
      height: 26px;
      background: none;
      border: none;
      color: #F8FAFC;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
    }
    .step-btn:hover { background: rgba(255, 255, 255, 0.1); }
    .qty-val {
      padding: 0 8px;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .unit-breakdown {
      font-size: 0.8rem;
      color: var(--text-dim);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .disc-tag {
      color: #FBBF24;
      font-weight: 700;
    }
    .item-delete-btn {
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.6;
      font-size: 0.9rem;
    }
    .item-delete-btn:hover { opacity: 1; }

    .empty-cart {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 8px;
      color: var(--text-dim);
    }
    .empty-cart-icon { font-size: 2rem; opacity: 0.4; }
    .empty-cart-text { font-weight: 700; font-size: 1rem; color: var(--text-muted); }
    .empty-cart-hint { font-size: 0.8rem; max-width: 220px; }

    /* Totals Box */
    .cart-totals {
      border-top: 1px solid var(--glass-border);
      padding-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .grand-total {
      margin-top: 4px;
      font-size: 1.15rem;
      font-weight: 800;
      color: #F8FAFC;
    }
    .total-amount {
      color: #34D399;
      font-size: 1.3rem;
    }

    /* Odoo Touch Numpad */
    .numpad-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .numpad-mode-selector {
      display: flex;
      gap: 6px;
    }
    .mode-btn {
      flex: 1;
      padding: 6px 0;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      color: var(--text-muted);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }
    .mode-btn.active {
      background: rgba(16, 185, 129, 0.15);
      border-color: var(--emerald-500);
      color: #34D399;
    }

    .touch-numpad-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }
    .pad-key {
      height: 38px;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      color: #F8FAFC;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .pad-key:hover { background: rgba(51, 65, 85, 0.9); }
    .pad-key:active { background: var(--emerald-500); }
    .pad-action { color: var(--text-dim); }
    .tender-key {
      background: rgba(15, 23, 42, 0.9);
      color: #FBBF24;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .highlight-tender {
      color: #34D399;
      border-color: rgba(16, 185, 129, 0.3);
    }

    /* Checkout Actions */
    .checkout-actions {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr;
      gap: 8px;
    }
    .checkout-btn {
      padding: 10px 8px;
      font-size: 0.85rem;
      white-space: nowrap;
    }
    .qr-pay-btn {
      color: #38BDF8;
      border-color: rgba(56, 189, 248, 0.3);
    }

    /* Modal Styles */
    .modal-header {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--glass-border);
    }
    .modal-title { font-size: 1.15rem; font-weight: 700; }
    .close-modal-btn { background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 1.1rem; }

    .modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .due-banner {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .due-label { font-size: 0.9rem; color: var(--text-muted); }
    .due-value { font-size: 1.5rem; font-weight: 800; color: #34D399; }

    .calc-label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; display: block; }
    .tender-input-wrap { position: relative; display: flex; align-items: center; }
    .currency-prefix { position: absolute; left: 14px; font-weight: 800; font-size: 1.2rem; color: var(--text-muted); }
    .tender-input { padding-left: 36px; font-size: 1.2rem; font-weight: 700; }

    .change-box {
      margin-top: 12px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 10px;
      padding: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .change-box.change-ready {
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .change-label { font-weight: 600; color: var(--text-muted); }
    .change-value { font-size: 1.4rem; font-weight: 800; color: #34D399; }

    /* QR Simulator */
    .qr-sim-section { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .qr-box { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .qr-visual { width: 140px; height: 140px; background: white; padding: 10px; border-radius: 12px; }
    .qr-svg { width: 100%; height: 100%; }
    .qr-instructions { text-align: center; display: flex; flex-direction: column; font-size: 0.85rem; color: var(--text-muted); }
    .simulate-btn { width: 100%; }

    /* Card Section */
    .card-sim-section { text-align: center; padding: 30px 0; }
    .card-terminal-icon { font-size: 3rem; margin-bottom: 12px; }
    .card-instructions { color: var(--text-muted); font-size: 0.95rem; }

    .modal-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--glass-border);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    /* Receipt Modal Styles */
    .receipt-modal {
      max-width: 380px;
    }
    .receipt-paper {
      background: #FFFFFF;
      color: #0F172A;
      font-family: 'JetBrains Mono', monospace;
      padding: 24px;
      font-size: 0.8rem;
      line-height: 1.4;
    }
    .receipt-header { text-align: center; margin-bottom: 10px; }
    .receipt-brand { font-weight: 800; font-size: 1.1rem; }
    .receipt-sub { font-size: 0.75rem; color: #475569; }
    .receipt-divider { text-align: center; color: #94A3B8; margin: 6px 0; }
    .receipt-row { display: flex; justify-content: space-between; margin: 3px 0; }
    .receipt-calc { margin: 6px 0; }
    .r-calc-row { display: flex; justify-content: space-between; margin: 2px 0; }
    .r-bold { font-weight: 800; font-size: 0.95rem; margin-top: 4px; }
    .receipt-footer { text-align: center; font-size: 0.75rem; color: #64748B; margin-top: 10px; }
    .receipt-modal-actions {
      padding: 16px;
      display: flex;
      gap: 10px;
      background: #0F172A;
    }
    .receipt-modal-actions button { flex: 1; }
  `]
})
export class PosComponent implements OnInit {
  public pos = inject(PosService);
  private catalog = inject(CatalogService);
  public auth = inject(AuthService);

  categories: Category[] = [];
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedCategoryId: string = 'all';
  searchTerm: string = '';

  numpadMode: 'QTY' | 'DISC' = 'QTY';

  showPaymentModal: boolean = false;
  selectedPaymentMethod: 'CASH' | 'QR' | 'CARD' = 'CASH';
  cashTendered: number = 0;
  changeDue: number = 0;
  isSubmitting: boolean = false;
  completedReceipt: any = null;

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.catalog.getCategories().subscribe({
      next: res => {
        if (res.success) {
          this.categories = res.categories;
        }
      }
    });

    this.catalog.getProducts().subscribe({
      next: res => {
        if (res.success) {
          this.products = res.products;
          this.filteredProducts = res.products;
        }
      }
    });
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryId = categoryId;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  applyFilters(): void {
    let list = this.products;

    if (this.selectedCategoryId !== 'all') {
      list = list.filter(p => p.category_id === this.selectedCategoryId);
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q))
      );
    }

    this.filteredProducts = list;
  }

  setNumpadMode(mode: 'QTY' | 'DISC'): void {
    this.numpadMode = mode;
  }

  onNumpadPress(digit: string): void {
    const idx = this.pos.selectedItemIndex();
    if (idx === null || !this.pos.cart()[idx]) return;

    const item = this.pos.cart()[idx];
    if (this.numpadMode === 'QTY') {
      const currentQty = item.quantity.toString();
      const newQty = parseInt(currentQty === '1' ? digit : currentQty + digit, 10) || 1;
      this.pos.updateQuantity(idx, Math.min(99, newQty));
    } else {
      const currentDisc = item.discount_percent.toString();
      const newDisc = parseInt(currentDisc === '0' ? digit : currentDisc + digit, 10) || 0;
      this.pos.updateDiscount(idx, Math.min(100, newDisc));
    }
  }

  onNumpadBackspace(): void {
    const idx = this.pos.selectedItemIndex();
    if (idx === null || !this.pos.cart()[idx]) return;

    const item = this.pos.cart()[idx];
    if (this.numpadMode === 'QTY') {
      const currentQty = item.quantity.toString();
      const newQty = parseInt(currentQty.slice(0, -1), 10) || 1;
      this.pos.updateQuantity(idx, newQty);
    } else {
      const currentDisc = item.discount_percent.toString();
      const newDisc = parseInt(currentDisc.slice(0, -1), 10) || 0;
      this.pos.updateDiscount(idx, newDisc);
    }
  }

  onNumpadClear(): void {
    const idx = this.pos.selectedItemIndex();
    if (idx === null || !this.pos.cart()[idx]) return;

    if (this.numpadMode === 'QTY') {
      this.pos.updateQuantity(idx, 1);
    } else {
      this.pos.updateDiscount(idx, 0);
    }
  }

  quickTender(amount: number): void {
    this.cashTendered = amount;
    this.calcChange();
    this.openPaymentModal('CASH');
  }

  openPaymentModal(method: 'CASH' | 'QR' | 'CARD'): void {
    this.selectedPaymentMethod = method;
    this.showPaymentModal = true;
    if (method === 'CASH' && this.cashTendered < this.pos.totalDue()) {
      this.cashTendered = Math.ceil(this.pos.totalDue());
      this.calcChange();
    }
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
  }

  calcChange(): void {
    this.changeDue = Math.round((this.cashTendered - this.pos.totalDue()) * 100) / 100;
  }

  simulateQrSuccess(): void {
    this.completeCheckout();
  }

  completeCheckout(): void {
    if (this.pos.cart().length === 0) return;

    this.isSubmitting = true;

    const payload = {
      branch_id: this.auth.activeBranch().id,
      cashier_id: this.auth.currentUser()?.id,
      table_id: this.pos.selectedTable()?.id,
      table_number: this.pos.selectedTable()?.table_number,
      customer_name: this.pos.customerName(),
      order_type: this.pos.selectedTable() ? 'DINE_IN' : 'TAKEAWAY',
      subtotal: this.pos.subtotal(),
      discount_amount: 0.00,
      tax_amount: this.pos.tax(),
      total_amount: this.pos.totalDue(),
      payment_method: this.selectedPaymentMethod,
      cash_tendered: this.selectedPaymentMethod === 'CASH' ? this.cashTendered : this.pos.totalDue(),
      change_amount: this.selectedPaymentMethod === 'CASH' ? Math.max(0, this.changeDue) : 0.00,
      items: this.pos.cart().map(i => ({
        product_id: i.product.id,
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price
      }))
    };

    this.pos.checkout(payload).subscribe({
      next: res => {
        this.isSubmitting = false;
        this.showPaymentModal = false;
        if (res.success) {
          this.completedReceipt = res.order;
          this.pos.clearCart();
        }
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  holdCurrentOrder(): void {
    if (this.pos.cart().length === 0) return;
    this.pos.holdOrder(this.auth.activeBranch().id).subscribe({
      next: res => {
        if (res.success) {
          this.pos.clearCart();
        }
      }
    });
  }

  printReceipt(): void {
    window.print();
  }

  getCategoryIcon(id: string): string {
    if (id.includes('coffee')) return '☕';
    if (id.includes('burger')) return '🍔';
    if (id.includes('main')) return '🍛';
    if (id.includes('dessert')) return '🍰';
    if (id.includes('drink')) return '🍹';
    return '📦';
  }
}
