import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header.component';
import { AccountingService } from '../../core/services/accounting.service';
import { SettlementService } from '../../core/services/settlement.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <div class="accounting-page">
      <app-header></app-header>

      <main class="accounting-content">
        <!-- Page Title -->
        <div class="page-title-bar glass-panel">
          <div>
            <h1 class="page-title">Financial Summary & P&L</h1>
            <p class="page-subtitle">Simple, direct financial metrics: revenue, cost of goods, expenses, and net profit</p>
          </div>

          <div class="header-actions">
            <button class="btn btn-primary" (click)="openExpenseModal()">
              <span>➕ Log New Expense</span>
            </button>
          </div>
        </div>

        <!-- P&L Metric Cards -->
        <div class="pnl-grid">
          <div class="pnl-card glass-panel">
            <span class="pnl-label">Gross Sales</span>
            <span class="pnl-val">{{ formatCurrency(plData?.gross_sales) }}</span>
            <span class="pnl-desc">Total billed revenue</span>
          </div>

          <div class="pnl-card glass-panel">
            <span class="pnl-label">Product Cost (COGS)</span>
            <span class="pnl-val text-amber">-{{ formatCurrency(plData?.cogs) }}</span>
            <span class="pnl-desc">Cost of inventory sold</span>
          </div>

          <div class="pnl-card glass-panel">
            <span class="pnl-label">Gross Profit</span>
            <span class="pnl-val text-emerald">{{ formatCurrency(plData?.gross_profit) }}</span>
            <span class="pnl-desc">Gross Margin: {{ plData?.gross_margin_percent }}%</span>
          </div>

          <div class="pnl-card glass-panel">
            <span class="pnl-label">Operating Expenses</span>
            <span class="pnl-val text-rose">-{{ formatCurrency(plData?.total_expenses) }}</span>
            <span class="pnl-desc">Utilities, supplies, overhead</span>
          </div>

          <div class="pnl-card glass-panel net-profit-card" [class.negative]="(plData?.net_profit || 0) < 0">
            <span class="pnl-label">Net Profit</span>
            <span class="pnl-val highlight">{{ formatCurrency(plData?.net_profit) }}</span>
            <span class="pnl-desc">Net Margin: {{ plData?.net_margin_percent }}%</span>
          </div>
        </div>

        <!-- Hybrid Franchise Settlement Banner -->
        @if (settlementSummary) {
          <div class="settlement-banner glass-panel">
            <div class="settlement-left">
              <div class="badge badge-warning">HYBRID FRANCHISE SETTLEMENT</div>
              <h3>Franchise Model: $500/mo Base Rent + 3% Revenue Royalty</h3>
              <p>Automated calculation based on current branch gross sales ({{ formatCurrency(settlementSummary.branch_sales || plData?.gross_sales) }})</p>
            </div>
            <div class="settlement-metrics">
              <div class="set-metric">
                <span class="lbl">Base Rent</span>
                <span class="val">{{ formatCurrency(settlementSummary.base_rent_amount || 500) }}</span>
              </div>
              <div class="set-metric">
                <span class="lbl">Royalty (3%)</span>
                <span class="val">{{ formatCurrency(settlementSummary.royalty_amount || (plData?.gross_sales * 0.03)) }}</span>
              </div>
              <div class="set-metric total">
                <span class="lbl">Total Remittance</span>
                <span class="val">{{ formatCurrency((settlementSummary.base_rent_amount || 500) + (settlementSummary.royalty_amount || (plData?.gross_sales * 0.03))) }}</span>
              </div>
              <button class="btn btn-secondary btn-sm" (click)="triggerSettlement()">
                <span>⚡ Settle Period</span>
              </button>
            </div>
          </div>
        }

        <!-- Expenses Ledger -->
        <div class="expenses-card glass-panel">
          <div class="expenses-header">
            <h3>Recent Store Expenses</h3>
            <span class="exp-count">{{ expenses.length }} transactions</span>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Category</th>
                  <th>Title & Description</th>
                  <th>Logged By</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                @for (e of expenses; track e.id) {
                  <tr>
                    <td class="time-col">{{ e.created_at | date:'mediumDate' }} {{ e.created_at | date:'shortTime' }}</td>
                    <td>
                      <span class="cat-badge">{{ e.category }}</span>
                    </td>
                    <td class="title-col">
                      <div class="exp-title">{{ e.title }}</div>
                      @if (e.notes) {
                        <div class="exp-notes">{{ e.notes }}</div>
                      }
                    </td>
                    <td class="user-col">{{ e.user?.name || 'Manager' }}</td>
                    <td class="amount-col text-right text-rose">
                      -{{ formatCurrency(e.amount) }}
                    </td>
                  </tr>
                }
                @if (expenses.length === 0) {
                  <tr>
                    <td colspan="5" class="empty-row">No expenses recorded for this branch yet.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <!-- Modal: Log Expense -->
      @if (showExpenseModal) {
        <div class="modal-backdrop" (click)="showExpenseModal = false">
          <div class="modal-window glass-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Log Store Expense</h2>
              <button class="btn-close" (click)="showExpenseModal = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Category</label>
                <select class="input-field" [(ngModel)]="newExpenseCategory">
                  <option value="Supplies">Store Supplies & Cleaning</option>
                  <option value="Ingredients">Food & Beverage Ingredients</option>
                  <option value="Utilities">Utilities (Electric, Water, Internet)</option>
                  <option value="Maintenance">Equipment Maintenance / Repairs</option>
                  <option value="Wages">Wages & Casual Labor</option>
                  <option value="Other">Other Operating Expense</option>
                </select>
              </div>

              <div class="form-group">
                <label>Expense Title</label>
                <input 
                  type="text" 
                  class="input-field" 
                  [(ngModel)]="newExpenseTitle" 
                  placeholder="e.g. Milk & Coffee bean restock" 
                  autofocus />
              </div>

              <div class="form-group">
                <label>Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  class="input-field num-large" 
                  [(ngModel)]="newExpenseAmount" 
                  placeholder="0.00" />
              </div>

              <div class="form-group">
                <label>Notes / Memo (Optional)</label>
                <input 
                  type="text" 
                  class="input-field" 
                  [(ngModel)]="newExpenseNotes" 
                  placeholder="e.g. Paid cash from drawer" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showExpenseModal = false">Cancel</button>
              <button 
                class="btn btn-primary" 
                [disabled]="!newExpenseTitle || newExpenseAmount <= 0" 
                (click)="saveExpense()">
                Save Expense
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .accounting-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #0B0F19;
    }

    .accounting-content {
      padding: 24px;
      flex: 1;
      max-width: 1440px;
      margin: 0 auto;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-title-bar {
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #F8FAFC;
    }
    .page-subtitle {
      font-size: 0.85rem;
      color: #94A3B8;
      margin-top: 2px;
    }

    /* PnL Grid */
    .pnl-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .pnl-card {
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .pnl-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94A3B8;
    }
    .pnl-val {
      font-size: 1.8rem;
      font-weight: 800;
      color: #F8FAFC;
      font-family: 'JetBrains Mono', monospace;
    }
    .pnl-desc {
      font-size: 0.75rem;
      color: #64748B;
    }

    .text-emerald { color: #10B981; }
    .text-amber { color: #F59E0B; }
    .text-rose { color: #FB7185; }

    .net-profit-card {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(16, 185, 129, 0.08);
    }
    .net-profit-card .highlight {
      color: #34D399;
    }
    .net-profit-card.negative {
      border-color: rgba(244, 63, 94, 0.4);
      background: rgba(244, 63, 94, 0.08);
    }
    .net-profit-card.negative .highlight {
      color: #FB7185;
    }

    /* Settlement Banner */
    .settlement-banner {
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      border: 1px solid rgba(245, 158, 11, 0.3);
      background: rgba(245, 158, 11, 0.05);
    }
    .settlement-left h3 {
      font-size: 1.1rem;
      font-weight: 800;
      color: #F8FAFC;
      margin: 6px 0 2px;
    }
    .settlement-left p {
      font-size: 0.8rem;
      color: #94A3B8;
    }
    .settlement-metrics {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .set-metric {
      display: flex;
      flex-direction: column;
    }
    .set-metric .lbl {
      font-size: 0.7rem;
      color: #94A3B8;
      text-transform: uppercase;
      font-weight: 700;
    }
    .set-metric .val {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 1.1rem;
      color: #F8FAFC;
    }
    .set-metric.total .val {
      color: #F59E0B;
      font-size: 1.3rem;
      font-weight: 800;
    }

    /* Expenses List */
    .expenses-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .expenses-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .expenses-header h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #F8FAFC;
    }
    .exp-count {
      font-size: 0.8rem;
      color: #94A3B8;
    }

    .table-responsive {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th {
      padding: 12px 16px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94A3B8;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .data-table td {
      padding: 14px 16px;
      font-size: 0.9rem;
      color: #E2E8F0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .time-col {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #94A3B8;
    }
    .cat-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #CBD5E1;
    }
    .exp-title {
      font-weight: 600;
      color: #F8FAFC;
    }
    .exp-notes {
      font-size: 0.75rem;
      color: #64748B;
      margin-top: 2px;
    }
    .amount-col {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 1rem;
    }
    .empty-row {
      text-align: center;
      padding: 32px;
      color: #64748B;
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .modal-window {
      width: 100%;
      max-width: 480px;
      background: #111827;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      overflow: hidden;
    }
    .modal-header {
      padding: 18px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-header h2 {
      font-size: 1.15rem;
      font-weight: 800;
      color: #F8FAFC;
    }
    .btn-close {
      background: transparent;
      border: none;
      color: #94A3B8;
      font-size: 1.2rem;
      cursor: pointer;
    }
    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: rgba(0, 0, 0, 0.2);
    }
    .num-large {
      font-size: 1.3rem;
      font-family: 'JetBrains Mono', monospace;
    }
  `]
})
export class AccountingComponent implements OnInit {
  private accountingService = inject(AccountingService);
  private settlementService = inject(SettlementService);
  private auth = inject(AuthService);

  plData: any = null;
  expenses: any[] = [];
  settlementSummary: any = null;

  // New Expense Modal
  showExpenseModal: boolean = false;
  newExpenseCategory: string = 'Supplies';
  newExpenseTitle: string = '';
  newExpenseAmount: number = 0;
  newExpenseNotes: string = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const branchId = this.auth.activeBranch().id;

    // Load P&L
    this.accountingService.getProfitLoss(branchId).subscribe({
      next: res => {
        if (res.success) {
          this.plData = res.profit_loss;
        }
      }
    });

    // Load Expenses
    this.accountingService.getExpenses(branchId).subscribe({
      next: res => {
        if (res.success) {
          this.expenses = res.expenses;
        }
      }
    });

    // Load Settlement
    this.settlementService.getSummary().subscribe({
      next: res => {
        if (res.success) {
          this.settlementSummary = res.summary?.[branchId] || null;
        }
      }
    });
  }

  openExpenseModal(): void {
    this.newExpenseCategory = 'Supplies';
    this.newExpenseTitle = '';
    this.newExpenseAmount = 0;
    this.newExpenseNotes = '';
    this.showExpenseModal = true;
  }

  saveExpense(): void {
    if (!this.newExpenseTitle || this.newExpenseAmount <= 0) return;
    const branchId = this.auth.activeBranch().id;

    this.accountingService.storeExpense({
      branch_id: branchId,
      category: this.newExpenseCategory,
      title: this.newExpenseTitle,
      amount: this.newExpenseAmount,
      notes: this.newExpenseNotes
    }).subscribe({
      next: () => {
        this.showExpenseModal = false;
        this.loadData();
      }
    });
  }

  triggerSettlement(): void {
    const branchId = this.auth.activeBranch().id;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const periodEnd = now.toISOString().split('T')[0];

    if (confirm(`Confirm hybrid royalty settlement calculation for ${this.auth.activeBranch().name}?`)) {
      this.settlementService.settle({
        branch_id: branchId,
        period_start: periodStart,
        period_end: periodEnd
      }).subscribe({
        next: () => {
          alert('Franchise settlement payout logged successfully!');
          this.loadData();
        }
      });
    }
  }

  formatCurrency(val: number): string {
    return '$' + Number(val || 0).toFixed(2);
  }
}
