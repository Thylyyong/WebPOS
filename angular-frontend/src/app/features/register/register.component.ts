import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header.component';
import { RegisterService } from '../../core/services/register.service';
import { AuthService } from '../../core/services/auth.service';

import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, IconComponent],
  template: `
    <div class="register-page">
      <app-header></app-header>

      <main class="register-content">
        <!-- Page Header -->
        <div class="page-title-bar glass-panel">
          <div>
            <h1 class="page-title">Shift Register & Cash Drawer</h1>
            <p class="page-subtitle">Track physical cash balances, record petty cash in/out, and reconcile shift end</p>
          </div>

          <div class="status-indicator">
            @if (hasActiveSession) {
              <span class="badge badge-success">ACTIVE SHIFT #{{ sessionData?.id?.substring(0, 8) }}</span>
            } @else {
              <span class="badge badge-danger">REGISTER CLOSED</span>
            }
          </div>
        </div>

        @if (hasActiveSession) {
          <!-- Active Shift Overview Cards -->
          <div class="metrics-grid">
            <div class="metric-card glass-panel">
              <span class="metric-label">Opening Float</span>
              <span class="metric-value">{{ formatCurrency(sessionData?.opening_cash) }}</span>
              <span class="metric-sub">Start of shift</span>
            </div>
            <div class="metric-card glass-panel highlight-sales">
              <span class="metric-label">Cash Sales</span>
              <span class="metric-value">{{ formatCurrency(sessionData?.cash_sales) }}</span>
              <span class="metric-sub">Processed at terminal</span>
            </div>
            <div class="metric-card glass-panel">
              <span class="metric-label">Cash In (+)</span>
              <span class="metric-value text-emerald">+{{ formatCurrency(sessionData?.cash_in) }}</span>
              <span class="metric-sub">Drawer additions</span>
            </div>
            <div class="metric-card glass-panel">
              <span class="metric-label">Cash Out (-)</span>
              <span class="metric-value text-rose">-{{ formatCurrency(sessionData?.cash_out) }}</span>
              <span class="metric-sub">Petty cash & payouts</span>
            </div>
            <div class="metric-card glass-panel drawer-balance">
              <span class="metric-label">Expected Drawer Cash</span>
              <span class="metric-value text-accent">{{ formatCurrency(sessionData?.expected_cash) }}</span>
              <span class="metric-sub">Physical target to count</span>
            </div>
          </div>

          <!-- Shift Actions Bar -->
          <div class="shift-actions glass-panel">
            <div class="actions-left">
              <button class="btn btn-secondary" (click)="openCashMovementModal('CASH_IN')">
                <app-icon name="plus" [size]="14"></app-icon>
                <span>Add Cash (In)</span>
              </button>
              <button class="btn btn-secondary" (click)="openCashMovementModal('CASH_OUT')">
                <app-icon name="minus" [size]="14"></app-icon>
                <span>Petty Cash Out</span>
              </button>
              <button class="btn btn-outline" (click)="loadZReport()">
                <span>View Shift Z-Report</span>
              </button>
            </div>
            <div class="actions-right">
              <button class="btn btn-primary btn-danger-theme" (click)="openCloseRegisterModal()">
                <app-icon name="lock" [size]="14"></app-icon>
                <span>Close Register & End Shift</span>
              </button>
            </div>
          </div>

          <!-- Cash Movements History -->
          <div class="movements-card glass-panel">
            <div class="card-header">
              <h3>Shift Cash Movements & Petty Logs</h3>
              <span class="movement-count">{{ movements.length }} events recorded</span>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>Authorized By</th>
                    <th class="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of movements; track m.id) {
                    <tr>
                      <td class="time-col">{{ m.created_at | date:'HH:mm:ss' }}</td>
                      <td>
                        <span class="badge" [class.badge-success]="m.type === 'CASH_IN'" [class.badge-danger]="m.type === 'CASH_OUT'">
                          {{ m.type }}
                        </span>
                      </td>
                      <td class="reason-col">{{ m.reason }}</td>
                      <td class="user-col">{{ m.user?.name || 'Manager' }}</td>
                      <td class="amount-col text-right" [class.text-emerald]="m.type === 'CASH_IN'" [class.text-rose]="m.type === 'CASH_OUT'">
                        {{ m.type === 'CASH_IN' ? '+' : '-' }}{{ formatCurrency(m.amount) }}
                      </td>
                    </tr>
                  }
                  @if (movements.length === 0) {
                    <tr>
                      <td colspan="5" class="empty-row">No manual cash movements logged during this shift.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        } @else {
          <!-- Closed Register: Open Register Form -->
          <div class="open-register-container glass-panel">
            <div class="open-reg-icon">
              <app-icon name="cash" [size]="48"></app-icon>
            </div>
            <h2>Register is Currently Closed</h2>
            <p>Start a new cashier shift by declaring the starting physical cash float in the cash drawer.</p>

            <form class="open-reg-form" (submit)="openShift()">
              <div class="form-group">
                <label>Opening Cash Float ($)</label>
                <div class="input-with-icon">
                  <span class="currency-prefix">$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    class="input-field" 
                    [(ngModel)]="openingCash" 
                    name="openingCash" 
                    required />
                </div>
              </div>

              <div class="quick-cash-pills">
                <button type="button" class="tag-btn" (click)="openingCash = 100">$100</button>
                <button type="button" class="tag-btn" (click)="openingCash = 200">$200</button>
                <button type="button" class="tag-btn" (click)="openingCash = 300">$300 (Standard)</button>
                <button type="button" class="tag-btn" (click)="openingCash = 500">$500</button>
              </div>

              <div class="form-group">
                <label>Opening Shift Notes (Optional)</label>
                <input 
                  type="text" 
                  class="input-field" 
                  [(ngModel)]="openingNotes" 
                  name="openingNotes" 
                  placeholder="e.g. Morning Shift - Drawer verified by Cashier" />
              </div>

              <button type="submit" class="btn btn-primary btn-lg full-w">
                <span>Open Shift & Initialize Drawer</span>
              </button>
            </form>
          </div>
        }
      </main>

      <!-- Modal: Cash Movement -->
      @if (showMovementModal) {
        <div class="modal-backdrop" (click)="showMovementModal = false">
          <div class="modal-window glass-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ movementType === 'CASH_IN' ? 'Add Cash to Drawer' : 'Petty Cash Payout' }}</h2>
              <button class="btn-close" (click)="showMovementModal = false">
                <app-icon name="close" [size]="16"></app-icon>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Movement Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  class="input-field num-large" 
                  [(ngModel)]="movementAmount" 
                  placeholder="0.00" 
                  autofocus />
              </div>

              <div class="form-group">
                <label>Reason / Description</label>
                <input 
                  type="text" 
                  class="input-field" 
                  [(ngModel)]="movementReason" 
                  [placeholder]="movementType === 'CASH_IN' ? 'e.g. Added change rolls (quarters)' : 'e.g. Store supplies, Ice purchase'" />
              </div>

              <div class="form-group">
                <label>Supervisor / Manager PIN (Optional)</label>
                <input 
                  type="password" 
                  maxlength="6" 
                  class="input-field" 
                  [(ngModel)]="supervisorPin" 
                  placeholder="Enter Manager PIN" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showMovementModal = false">Cancel</button>
              <button class="btn btn-primary" [disabled]="movementAmount <= 0" (click)="submitCashMovement()">
                Confirm {{ movementType === 'CASH_IN' ? 'Cash In' : 'Cash Out' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal: Close Register -->
      @if (showCloseModal) {
        <div class="modal-backdrop" (click)="showCloseModal = false">
          <div class="modal-window glass-panel close-reg-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Close Register & Shift Reconciliation</h2>
              <button class="btn-close" (click)="showCloseModal = false">
                <app-icon name="close" [size]="16"></app-icon>
              </button>
            </div>
            <div class="modal-body">
              <div class="reconciliation-box">
                <div class="recon-row">
                  <span>Expected Drawer Cash:</span>
                  <span class="recon-val">{{ formatCurrency(sessionData?.expected_cash) }}</span>
                </div>
                <div class="recon-row highlight">
                  <span>Physical Cash Counted:</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    class="input-field count-input" 
                    [(ngModel)]="countedCash" 
                    (input)="calculateDifference()" 
                    placeholder="0.00" 
                    autofocus />
                </div>
                <div class="recon-row diff-row" [ngClass]="getDiffClass()">
                  <span>Discrepancy:</span>
                  <span class="diff-val">{{ getDiffText() }}</span>
                </div>
              </div>

              <div class="form-group mt-16">
                <label>Closing Shift Notes (Optional)</label>
                <input 
                  type="text" 
                  class="input-field" 
                  [(ngModel)]="closingNotes" 
                  placeholder="e.g. End of day reconciliation completed" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showCloseModal = false">Cancel</button>
              <button class="btn btn-primary btn-danger-theme" (click)="confirmCloseRegister()">
                Confirm & Close Register
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal: Z-Report Preview -->
      @if (showZReportModal && zReportData) {
        <div class="modal-backdrop" (click)="showZReportModal = false">
          <div class="modal-window glass-panel receipt-preview" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Official Shift Z-Report</h2>
              <button class="btn-close" (click)="showZReportModal = false">
                <app-icon name="close" [size]="16"></app-icon>
              </button>
            </div>
            <div class="modal-body receipt-scroll">
              <div class="thermal-receipt">
                <div class="receipt-header">
                  <div class="store-name">OMNIPOS STORE</div>
                  <div class="store-sub">DAILY Z-REPORT SUMMARY</div>
                  <div class="receipt-meta">
                    <div>Session ID: #{{ zReportData.session?.id?.substring(0, 8) }}</div>
                    <div>Generated: {{ zReportData.generated_at | date:'medium' }}</div>
                    <div>Cashier: {{ zReportData.session?.user?.name }}</div>
                  </div>
                </div>

                <div class="receipt-divider">================================</div>

                <div class="receipt-section">
                  <div class="sec-title">SALES BREAKDOWN</div>
                  <div class="receipt-line"><span>Total Completed Orders:</span><span>{{ zReportData.sales?.order_count }}</span></div>
                  <div class="receipt-line"><span>Gross Sales:</span><span>{{ formatCurrency(zReportData.sales?.gross_sales) }}</span></div>
                  <div class="receipt-line"><span>Discount:</span><span>-{{ formatCurrency(zReportData.sales?.discount) }}</span></div>
                  <div class="receipt-line"><span>Tax Collected (10%):</span><span>{{ formatCurrency(zReportData.sales?.tax) }}</span></div>
                  <div class="receipt-line bold"><span>NET REVENUE:</span><span>{{ formatCurrency(zReportData.sales?.net_revenue) }}</span></div>
                </div>

                <div class="receipt-divider">--------------------------------</div>

                <div class="receipt-section">
                  <div class="sec-title">PAYMENT METHODS</div>
                  <div class="receipt-line"><span>Cash:</span><span>{{ formatCurrency(zReportData.payments?.cash) }}</span></div>
                  <div class="receipt-line"><span>Credit/Debit Card:</span><span>{{ formatCurrency(zReportData.payments?.card) }}</span></div>
                  <div class="receipt-line"><span>QR Digital Pay:</span><span>{{ formatCurrency(zReportData.payments?.qr) }}</span></div>
                </div>

                <div class="receipt-divider">--------------------------------</div>

                <div class="receipt-section">
                  <div class="sec-title">CASH DRAWER RECONCILIATION</div>
                  <div class="receipt-line"><span>Opening Cash Float:</span><span>{{ formatCurrency(zReportData.drawer?.opening_cash) }}</span></div>
                  <div class="receipt-line"><span>Cash Sales:</span><span>+{{ formatCurrency(zReportData.drawer?.cash_sales) }}</span></div>
                  <div class="receipt-line"><span>Cash In:</span><span>+{{ formatCurrency(zReportData.drawer?.cash_in) }}</span></div>
                  <div class="receipt-line"><span>Cash Out:</span><span>-{{ formatCurrency(zReportData.drawer?.cash_out) }}</span></div>
                  <div class="receipt-line bold"><span>Expected Drawer Cash:</span><span>{{ formatCurrency(zReportData.drawer?.expected_cash) }}</span></div>
                  @if (zReportData.drawer?.closing_cash_counted !== null) {
                    <div class="receipt-line"><span>Actual Counted:</span><span>{{ formatCurrency(zReportData.drawer?.closing_cash_counted) }}</span></div>
                    <div class="receipt-line bold"><span>Discrepancy:</span><span>{{ formatCurrency(zReportData.drawer?.difference) }}</span></div>
                  }
                </div>

                <div class="receipt-footer">
                  <p>*** END OF Z-REPORT ***</p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showZReportModal = false">Close</button>
              <button class="btn btn-primary" (click)="printZReport()">
                <app-icon name="print" [size]="14"></app-icon>
                <span>Print Report</span>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .register-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #0B0F19;
    }

    .register-content {
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

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .metric-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .metric-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .metric-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #F8FAFC;
      font-family: 'JetBrains Mono', monospace;
    }
    .metric-sub {
      font-size: 0.75rem;
      color: #64748B;
    }
    .drawer-balance {
      border-color: rgba(16, 185, 129, 0.3);
      background: rgba(16, 185, 129, 0.06);
    }

    .text-emerald { color: #10B981; }
    .text-rose { color: #FB7185; }
    .text-accent { color: #34D399; }

    /* Shift Actions */
    .shift-actions {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .actions-left, .actions-right {
      display: flex;
      gap: 12px;
    }
    .btn-danger-theme {
      background: #E11D48;
      color: white;
    }
    .btn-danger-theme:hover {
      background: #F43F5E;
    }

    /* Cash Movements Table */
    .movements-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-header h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #F8FAFC;
    }
    .movement-count {
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
      color: #94A3B8;
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

    /* Open Register Container */
    .open-register-container {
      max-width: 500px;
      margin: 40px auto;
      padding: 40px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .open-reg-icon {
      font-size: 3rem;
      margin-bottom: 12px;
    }
    .open-register-container h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #F8FAFC;
    }
    .open-register-container p {
      font-size: 0.9rem;
      color: #94A3B8;
      margin: 8px 0 24px;
    }
    .open-reg-form {
      width: 100%;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .input-with-icon {
      position: relative;
    }
    .currency-prefix {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.25rem;
      font-weight: 700;
      color: #10B981;
    }
    .input-with-icon .input-field {
      padding-left: 36px;
      font-size: 1.3rem;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
    }
    .quick-cash-pills {
      display: flex;
      gap: 8px;
    }
    .full-w {
      width: 100%;
    }

    /* Modal Styling */
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
      font-size: 1.4rem;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Reconciliation Box */
    .reconciliation-box {
      background: rgba(0, 0, 0, 0.3);
      padding: 16px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .recon-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.95rem;
      color: #94A3B8;
    }
    .recon-val {
      font-size: 1.1rem;
      font-weight: 700;
      color: #F8FAFC;
      font-family: 'JetBrains Mono', monospace;
    }
    .count-input {
      width: 140px;
      text-align: right;
      font-size: 1.2rem;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
    }
    .diff-row {
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      font-weight: 800;
    }
    .diff-row.match { color: #10B981; }
    .diff-row.shortage { color: #FB7185; }
    .diff-row.surplus { color: #F59E0B; }
    .diff-val {
      font-size: 1.1rem;
      font-family: 'JetBrains Mono', monospace;
    }
    .mt-16 {
      margin-top: 16px;
    }

    /* Receipt */
    .receipt-preview {
      max-width: 440px;
    }
    .thermal-receipt {
      background: #FDFBF7;
      color: #1E293B;
      font-family: 'JetBrains Mono', monospace;
      padding: 24px;
      border-radius: 8px;
      font-size: 0.85rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .receipt-header {
      text-align: center;
      margin-bottom: 12px;
    }
    .store-name {
      font-size: 1.2rem;
      font-weight: 900;
    }
    .store-sub {
      font-size: 0.8rem;
      font-weight: 700;
    }
    .receipt-meta {
      font-size: 0.75rem;
      margin-top: 6px;
      color: #475569;
    }
    .receipt-divider {
      text-align: center;
      color: #94A3B8;
      margin: 8px 0;
      letter-spacing: -1px;
    }
    .sec-title {
      font-weight: 800;
      font-size: 0.8rem;
      margin-bottom: 4px;
    }
    .receipt-line {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
    }
    .receipt-line.bold {
      font-weight: 800;
      font-size: 0.95rem;
      border-top: 1px dashed #CBD5E1;
      padding-top: 4px;
      margin-top: 4px;
    }
    .receipt-footer {
      text-align: center;
      margin-top: 16px;
      font-weight: 700;
    }
  `]
})
export class RegisterComponent implements OnInit {
  private registerService = inject(RegisterService);
  private auth = inject(AuthService);

  hasActiveSession: boolean = false;
  sessionData: any = null;
  movements: any[] = [];

  // Open Shift Form
  openingCash: number = 300;
  openingNotes: string = '';

  // Cash Movement Modal
  showMovementModal: boolean = false;
  movementType: 'CASH_IN' | 'CASH_OUT' = 'CASH_IN';
  movementAmount: number = 0;
  movementReason: string = '';
  supervisorPin: string = '';

  // Close Register Modal
  showCloseModal: boolean = false;
  countedCash: number = 0;
  closingNotes: string = '';
  difference: number = 0;

  // Z-Report Modal
  showZReportModal: boolean = false;
  zReportData: any = null;

  ngOnInit(): void {
    this.checkSession();
  }

  checkSession(): void {
    const branchId = this.auth.activeBranch().id;
    this.registerService.getCurrentSession(branchId).subscribe({
      next: res => {
        this.hasActiveSession = res.has_active_session;
        if (res.has_active_session) {
          this.sessionData = res.session;
          this.movements = res.session.cash_movements || [];
          this.countedCash = this.sessionData.expected_cash;
          this.calculateDifference();
        }
      }
    });
  }

  openShift(): void {
    const branchId = this.auth.activeBranch().id;
    this.registerService.openRegister({
      branch_id: branchId,
      opening_cash: this.openingCash,
      opening_notes: this.openingNotes
    }).subscribe({
      next: () => this.checkSession()
    });
  }

  openCashMovementModal(type: 'CASH_IN' | 'CASH_OUT'): void {
    this.movementType = type;
    this.movementAmount = 0;
    this.movementReason = '';
    this.supervisorPin = '';
    this.showMovementModal = true;
  }

  submitCashMovement(): void {
    if (!this.sessionData?.id || this.movementAmount <= 0) return;
    this.registerService.cashMovement({
      session_id: this.sessionData.id,
      type: this.movementType,
      amount: this.movementAmount,
      reason: this.movementReason || (this.movementType === 'CASH_IN' ? 'Change replenishment' : 'Store petty expense'),
      supervisor_pin: this.supervisorPin || '9999'
    }).subscribe({
      next: () => {
        this.showMovementModal = false;
        this.checkSession();
      }
    });
  }

  openCloseRegisterModal(): void {
    this.countedCash = this.sessionData?.expected_cash || 0;
    this.closingNotes = '';
    this.calculateDifference();
    this.showCloseModal = true;
  }

  calculateDifference(): void {
    const expected = Number(this.sessionData?.expected_cash || 0);
    const counted = Number(this.countedCash || 0);
    this.difference = counted - expected;
  }

  getDiffClass(): string {
    if (Math.abs(this.difference) < 0.01) return 'match';
    return this.difference < 0 ? 'shortage' : 'surplus';
  }

  getDiffText(): string {
    if (Math.abs(this.difference) < 0.01) return 'PERFECT MATCH ($0.00)';
    if (this.difference < 0) return `SHORTAGE: -${this.formatCurrency(Math.abs(this.difference))}`;
    return `SURPLUS: +${this.formatCurrency(this.difference)}`;
  }

  confirmCloseRegister(): void {
    if (!this.sessionData?.id) return;
    this.registerService.closeRegister({
      session_id: this.sessionData.id,
      closing_cash_counted: this.countedCash,
      closing_notes: this.closingNotes
    }).subscribe({
      next: () => {
        this.showCloseModal = false;
        this.checkSession();
      }
    });
  }

  loadZReport(): void {
    if (!this.sessionData?.id) return;
    this.registerService.getZReport(this.sessionData.id).subscribe({
      next: res => {
        if (res.success) {
          this.zReportData = res.z_report;
          this.showZReportModal = true;
        }
      }
    });
  }

  printZReport(): void {
    window.print();
  }

  formatCurrency(val: number): string {
    return '$' + Number(val || 0).toFixed(2);
  }
}
