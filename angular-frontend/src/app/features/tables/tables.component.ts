import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/header.component';
import { TableService } from '../../core/services/table.service';
import { AuthService } from '../../core/services/auth.service';
import { DiningTable } from '../../core/models/pos.models';

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <div class="tables-page">
      <app-header></app-header>

      <main class="tables-content">
        <!-- Floor Header & Zone Filters -->
        <div class="floor-header glass-panel">
          <div class="header-titles">
            <h1 class="page-title">Dining Floor Plan</h1>
            <p class="page-subtitle">Real-time table occupancy, guest assignments, and bill management</p>
          </div>

          <div class="zone-filters">
            <button 
              class="zone-btn" 
              [class.active]="selectedZone === 'ALL'"
              (click)="selectedZone = 'ALL'">
              All Areas ({{ tables.length }})
            </button>
            @for (zone of zones; track zone) {
              <button 
                class="zone-btn" 
                [class.active]="selectedZone === zone"
                (click)="selectedZone = zone">
                {{ zone }} ({{ getZoneCount(zone) }})
              </button>
            }
          </div>

          <div class="floor-stats">
            <div class="stat-badge available">
              <span class="dot"></span>
              <span>Available: {{ getStatusCount('AVAILABLE') }}</span>
            </div>
            <div class="stat-badge occupied">
              <span class="dot"></span>
              <span>Occupied: {{ getStatusCount('OCCUPIED') }}</span>
            </div>
            <div class="stat-badge billed">
              <span class="dot"></span>
              <span>Billed: {{ getStatusCount('BILLED') }}</span>
            </div>
          </div>
        </div>

        <!-- Tables Grid -->
        <div class="tables-grid">
          @for (table of filteredTables; track table.id) {
            <div class="table-card glass-panel" [ngClass]="table.status.toLowerCase()">
              <div class="table-card-top">
                <div class="table-identity">
                  <span class="table-num">{{ table.table_number }}</span>
                  <span class="table-zone">{{ table.zone }}</span>
                </div>
                <div class="table-status-pill" [ngClass]="table.status.toLowerCase()">
                  {{ table.status }}
                </div>
              </div>

              <div class="table-card-body">
                <div class="capacity-info">
                  <span class="cap-icon">👥</span>
                  <span>{{ table.capacity }} Seats</span>
                </div>

                @if (table.status !== 'AVAILABLE') {
                  <div class="occupancy-info">
                    @if (table.customer_name) {
                      <div class="guest-name">
                        <span class="lbl">Guest:</span>
                        <span class="val">{{ table.customer_name }}</span>
                      </div>
                    }
                    @if ((table.current_order_total || 0) > 0) {
                      <div class="order-total">
                        <span class="lbl">Running Bill:</span>
                        <span class="val">{{ formatCurrency(table.current_order_total) }}</span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="ready-badge">
                    <span>✨ Clean & Ready</span>
                  </div>
                }
              </div>

              <div class="table-card-actions">
                @if (table.status === 'AVAILABLE') {
                  <button class="btn btn-primary btn-sm full-w" (click)="openAssignModal(table)">
                    <span>⚡ Assign & Dine</span>
                  </button>
                } @else {
                  <div class="action-btn-group">
                    <button class="btn btn-secondary btn-sm" (click)="goToPos(table)">
                      <span>🛒 Order</span>
                    </button>
                    <button class="btn btn-outline btn-sm" (click)="openTransferModal(table)" title="Transfer to another table">
                      <span>🔄 Move</span>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" (click)="releaseTable(table)" title="Release / Clear Table">
                      <span>🧹 Clear</span>
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </main>

      <!-- Modal: Assign Table -->
      @if (showAssignModal && selectedTable) {
        <div class="modal-backdrop" (click)="showAssignModal = false">
          <div class="modal-window glass-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Open {{ selectedTable.table_number }} ({{ selectedTable.zone }})</h2>
              <button class="btn-close" (click)="showAssignModal = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Guest / Party Name (Optional)</label>
                <input 
                  type="text" 
                  class="input-field" 
                  [(ngModel)]="assignCustomerName" 
                  placeholder="e.g. VIP Party / John Smith"
                  autofocus />
              </div>
              <div class="quick-guest-tags">
                <button type="button" class="tag-btn" (click)="assignCustomerName = 'Walk-in Party'">Walk-in Party</button>
                <button type="button" class="tag-btn" (click)="assignCustomerName = 'Table ' + selectedTable.table_number">Table {{ selectedTable.table_number }}</button>
                <button type="button" class="tag-btn" (click)="assignCustomerName = 'VIP Guest'">VIP Guest</button>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showAssignModal = false">Cancel</button>
              <button class="btn btn-primary" (click)="confirmAssign()">Open Table & Order</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal: Transfer Table -->
      @if (showTransferModal && selectedTable) {
        <div class="modal-backdrop" (click)="showTransferModal = false">
          <div class="modal-window glass-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Transfer {{ selectedTable.table_number }} to Another Table</h2>
              <button class="btn-close" (click)="showTransferModal = false">✕</button>
            </div>
            <div class="modal-body">
              <p class="modal-desc">
                Select an available table to migrate current order ({{ formatCurrency(selectedTable.current_order_total || 0) }}):
              </p>
              
              <div class="transfer-grid">
                @for (avail of availableTables; track avail.id) {
                  <div 
                    class="transfer-item" 
                    [class.selected]="targetTransferTableId === avail.id"
                    (click)="targetTransferTableId = avail.id">
                    <div class="trans-name">{{ avail.table_number }}</div>
                    <div class="trans-sub">{{ avail.zone }} ({{ avail.capacity }} seats)</div>
                  </div>
                }
              </div>

              @if (availableTables.length === 0) {
                <div class="empty-state">
                  <span>⚠️ No other tables are currently available for transfer.</span>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showTransferModal = false">Cancel</button>
              <button 
                class="btn btn-primary" 
                [disabled]="!targetTransferTableId" 
                (click)="confirmTransfer()">
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tables-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #0B0F19;
    }

    .tables-content {
      padding: 24px;
      flex: 1;
      max-width: 1440px;
      margin: 0 auto;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .floor-header {
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-titles .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #F8FAFC;
      letter-spacing: -0.02em;
    }
    .header-titles .page-subtitle {
      font-size: 0.85rem;
      color: #94A3B8;
      margin-top: 2px;
    }

    .zone-filters {
      display: flex;
      gap: 8px;
      background: rgba(0, 0, 0, 0.3);
      padding: 4px;
      border-radius: 12px;
    }

    .zone-btn {
      background: transparent;
      border: none;
      color: #94A3B8;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .zone-btn:hover {
      color: #F8FAFC;
    }
    .zone-btn.active {
      background: #10B981;
      color: #041F16;
      font-weight: 700;
    }

    .floor-stats {
      display: flex;
      gap: 12px;
    }
    .stat-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #94A3B8;
    }
    .stat-badge .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .stat-badge.available .dot { background: #10B981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.6); }
    .stat-badge.occupied .dot { background: #F59E0B; box-shadow: 0 0 8px rgba(245, 158, 11, 0.6); }
    .stat-badge.billed .dot { background: #06B6D4; box-shadow: 0 0 8px rgba(6, 182, 212, 0.6); }

    /* Tables Grid */
    .tables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 18px;
    }

    .table-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 200px;
      transition: all 0.2s ease;
      position: relative;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .table-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    .table-card.available {
      border-top: 4px solid #10B981;
    }
    .table-card.occupied {
      border-top: 4px solid #F59E0B;
      background: rgba(245, 158, 11, 0.04);
    }
    .table-card.billed {
      border-top: 4px solid #06B6D4;
      background: rgba(6, 182, 212, 0.04);
    }

    .table-card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .table-num {
      font-size: 1.25rem;
      font-weight: 800;
      color: #F8FAFC;
    }
    .table-zone {
      display: block;
      font-size: 0.75rem;
      color: #94A3B8;
      font-weight: 600;
    }

    .table-status-pill {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }
    .table-status-pill.available {
      background: rgba(16, 185, 129, 0.15);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .table-status-pill.occupied {
      background: rgba(245, 158, 11, 0.15);
      color: #FBBF24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .table-status-pill.billed {
      background: rgba(6, 182, 212, 0.15);
      color: #38BDF8;
      border: 1px solid rgba(6, 182, 212, 0.3);
    }

    .table-card-body {
      margin: 16px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .capacity-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: #94A3B8;
    }
    .ready-badge {
      font-size: 0.8rem;
      color: #10B981;
      font-weight: 600;
    }
    .occupancy-info {
      background: rgba(0, 0, 0, 0.25);
      padding: 8px 12px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .guest-name, .order-total {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
    }
    .guest-name .lbl, .order-total .lbl {
      color: #94A3B8;
    }
    .guest-name .val {
      color: #F8FAFC;
      font-weight: 600;
    }
    .order-total .val {
      color: #10B981;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }

    .action-btn-group {
      display: flex;
      gap: 6px;
      width: 100%;
    }
    .action-btn-group .btn {
      flex: 1;
    }
    .full-w {
      width: 100%;
    }

    .btn-outline-danger {
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: #FB7185;
    }
    .btn-outline-danger:hover {
      background: #F43F5E;
      color: #FFFFFF;
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
      animation: fadeIn 0.2s ease-out;
    }
    .modal-window {
      width: 100%;
      max-width: 500px;
      background: #111827;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
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
    .modal-desc {
      font-size: 0.9rem;
      color: #94A3B8;
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #94A3B8;
      margin-bottom: 8px;
    }
    .input-field {
      width: 100%;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 12px 16px;
      color: #F8FAFC;
      font-size: 1rem;
    }
    .quick-guest-tags {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      flex-wrap: wrap;
    }
    .tag-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94A3B8;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .tag-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #F8FAFC;
    }
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: rgba(0, 0, 0, 0.2);
    }

    .transfer-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      max-height: 260px;
      overflow-y: auto;
    }
    .transfer-item {
      padding: 12px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .transfer-item:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .transfer-item.selected {
      background: rgba(16, 185, 129, 0.15);
      border-color: #10B981;
    }
    .trans-name {
      font-weight: 700;
      color: #F8FAFC;
      font-size: 0.95rem;
    }
    .trans-sub {
      font-size: 0.75rem;
      color: #94A3B8;
      margin-top: 2px;
    }
    .empty-state {
      padding: 24px;
      text-align: center;
      color: #F59E0B;
      font-size: 0.9rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class TablesComponent implements OnInit {
  private tableService = inject(TableService);
  private auth = inject(AuthService);
  private router = inject(Router);

  tables: DiningTable[] = [];
  selectedZone: string = 'ALL';
  zones: string[] = ['Main Hall', 'Terrace', 'VIP Room', 'Patio'];

  // Modals state
  showAssignModal: boolean = false;
  showTransferModal: boolean = false;
  selectedTable: DiningTable | null = null;
  assignCustomerName: string = '';
  targetTransferTableId: string = '';

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables(): void {
    const branchId = this.auth.activeBranch().id;
    this.tableService.getTables(branchId).subscribe({
      next: res => {
        if (res.success) {
          this.tables = res.tables;
          // Dynamically extract unique zones if available
          const extractedZones = Array.from(new Set(this.tables.map(t => t.zone)));
          if (extractedZones.length > 0) {
            this.zones = extractedZones;
          }
        }
      }
    });
  }

  get filteredTables(): DiningTable[] {
    if (this.selectedZone === 'ALL') {
      return this.tables;
    }
    return this.tables.filter(t => t.zone === this.selectedZone);
  }

  get availableTables(): DiningTable[] {
    return this.tables.filter(t => t.status === 'AVAILABLE' && t.id !== this.selectedTable?.id);
  }

  getZoneCount(zone: string): number {
    return this.tables.filter(t => t.zone === zone).length;
  }

  getStatusCount(status: string): number {
    return this.tables.filter(t => t.status === status).length;
  }

  formatCurrency(val?: number): string {
    return '$' + Number(val || 0).toFixed(2);
  }

  openAssignModal(table: DiningTable): void {
    this.selectedTable = table;
    this.assignCustomerName = 'Table ' + table.table_number;
    this.showAssignModal = true;
  }

  confirmAssign(): void {
    if (!this.selectedTable) return;
    this.tableService.assignTable(this.selectedTable.id, this.assignCustomerName).subscribe({
      next: () => {
        const tId = this.selectedTable?.id;
        const tNum = this.selectedTable?.table_number;
        this.showAssignModal = false;
        // Navigate to POS terminal with table parameters
        this.router.navigate(['/pos'], { queryParams: { table_id: tId, table_name: tNum } });
      }
    });
  }

  goToPos(table: DiningTable): void {
    this.router.navigate(['/pos'], { queryParams: { table_id: table.id, table_name: table.table_number } });
  }

  openTransferModal(table: DiningTable): void {
    this.selectedTable = table;
    this.targetTransferTableId = '';
    this.showTransferModal = true;
  }

  confirmTransfer(): void {
    if (!this.selectedTable || !this.targetTransferTableId) return;
    this.tableService.transferTable(this.selectedTable.id, this.targetTransferTableId).subscribe({
      next: res => {
        this.showTransferModal = false;
        this.loadTables();
      }
    });
  }

  releaseTable(table: DiningTable): void {
    if (confirm(`Are you sure you want to release Table ${table.table_number}? This marks it clean and available.`)) {
      this.tableService.releaseTable(table.id).subscribe({
        next: () => this.loadTables()
      });
    }
  }
}
