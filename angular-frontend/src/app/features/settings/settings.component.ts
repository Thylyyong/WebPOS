import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header.component';
import { SettingService } from '../../core/services/setting.service';
import { AuthService } from '../../core/services/auth.service';
import { Branch } from '../../core/models/pos.models';

import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, IconComponent],
  template: `
    <div class="settings-page">
      <app-header></app-header>

      <main class="settings-content">
        <!-- Page Title -->
        <div class="page-title-bar glass-panel">
          <div>
            <h1 class="page-title">Store & Terminal Settings</h1>
            <p class="page-subtitle">Configure store identity, financial tax rates, and receipt custom headers</p>
          </div>

          <div class="save-actions">
            @if (saveSuccess) {
              <span class="save-toast">
                <app-icon name="check" [size]="14"></app-icon>
                <span>Settings saved successfully!</span>
              </span>
            }
            <button class="btn btn-primary" (click)="saveSettings()">
              <app-icon name="save" [size]="16"></app-icon>
              <span>Save Settings</span>
            </button>
          </div>
        </div>

        <div class="settings-grid">
          <!-- Left Column: Store Profile & Financials -->
          <div class="settings-col">
            <div class="settings-card glass-panel">
              <div class="card-header">
                <h3>Store Profile</h3>
                <span class="sec-badge">Public Receipt Info</span>
              </div>

              <div class="form-body">
                <div class="form-group">
                  <label>Store Brand Name</label>
                  <input type="text" class="input-field" [(ngModel)]="storeName" placeholder="e.g. OmniPOS Bistro" />
                </div>

                <div class="form-group">
                  <label>Contact Phone</label>
                  <input type="text" class="input-field" [(ngModel)]="storePhone" placeholder="e.g. (555) 019-2831" />
                </div>

                <div class="form-group">
                  <label>Contact Email</label>
                  <input type="email" class="input-field" [(ngModel)]="storeEmail" placeholder="e.g. info@omnipos.com" />
                </div>

                <div class="form-group">
                  <label>Street Address</label>
                  <input type="text" class="input-field" [(ngModel)]="storeAddress" placeholder="e.g. 100 Innovation Way, Suite 400" />
                </div>
              </div>
            </div>

            <div class="settings-card glass-panel mt-20">
              <div class="card-header">
                <h3>Financial & Web Terminal</h3>
                <span class="sec-badge">Taxes & Currency</span>
              </div>

              <div class="form-body">
                <div class="form-row">
                  <div class="form-group">
                    <label>Currency Symbol</label>
                    <input type="text" class="input-field" [(ngModel)]="currencySymbol" placeholder="$" maxlength="3" />
                  </div>
                  <div class="form-group">
                    <label>Default Tax Rate (%)</label>
                    <input type="number" step="0.5" class="input-field" [(ngModel)]="defaultTaxRate" placeholder="10" />
                  </div>
                </div>

                <div class="toggle-row">
                  <div>
                    <div class="toggle-title">Show Receipt Preview on Checkout</div>
                    <div class="toggle-desc">Automatically open thermal receipt view when order completes</div>
                  </div>
                  <input type="checkbox" class="toggle-check" [(ngModel)]="autoShowReceipt" />
                </div>

                <div class="toggle-row">
                  <div>
                    <div class="toggle-title">Terminal Sound Effects</div>
                    <div class="toggle-desc">Play audio chirp when barcode is scanned or item added</div>
                  </div>
                  <input type="checkbox" class="toggle-check" [(ngModel)]="soundEffects" />
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Receipt Template & Branches -->
          <div class="settings-col">
            <div class="settings-card glass-panel">
              <div class="card-header">
                <h3>Receipt Template Content</h3>
                <span class="sec-badge">Thermal Paper</span>
              </div>

              <div class="form-body">
                <div class="form-group">
                  <label>Receipt Welcome Header</label>
                  <textarea rows="2" class="input-field textarea-field" [(ngModel)]="receiptHeader" placeholder="e.g. Welcome to OmniPOS Dining! We hope you enjoy your meal."></textarea>
                </div>

                <div class="form-group">
                  <label>Receipt Thank You Footer</label>
                  <textarea rows="2" class="input-field textarea-field" [(ngModel)]="receiptFooter" placeholder="e.g. Thank you for dining with us! Follow us on Instagram @omnipos"></textarea>
                </div>

                <div class="receipt-preview-snippet">
                  <div class="preview-label">Live Preview:</div>
                  <div class="mini-receipt">
                    <div class="m-center bold">{{ storeName || 'OmniPOS Store' }}</div>
                    <div class="m-center italic">{{ receiptHeader }}</div>
                    <div class="m-divider">--------------------------------</div>
                    <div class="m-row"><span>1x Truffle Burger</span><span>$16.50</span></div>
                    <div class="m-row"><span>Tax ({{ defaultTaxRate }}%):</span><span>{{ formatCurrency(16.5 * (defaultTaxRate / 100)) }}</span></div>
                    <div class="m-row bold"><span>Total:</span><span>{{ formatCurrency(16.5 * (1 + defaultTaxRate / 100)) }}</span></div>
                    <div class="m-divider">--------------------------------</div>
                    <div class="m-center italic">{{ receiptFooter }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Active Franchise Branches -->
            <div class="settings-card glass-panel mt-20">
              <div class="card-header">
                <h3>Franchise Branches</h3>
                <span class="sec-badge">{{ branches.length }} Connected</span>
              </div>

              <div class="branches-list">
                @for (b of branches; track b.id) {
                  <div class="branch-item" [class.current]="b.id === auth.activeBranch().id">
                    <div class="branch-left">
                      <span class="branch-pill">{{ b.branch_code || b.code || 'BR' }}</span>
                      <div>
                        <div class="branch-title">
                          {{ b.branch_name }}
                          @if (b.id === auth.activeBranch().id) {
                            <span class="current-tag">(Active Terminal)</span>
                          }
                        </div>
                        <div class="branch-addr">{{ b.address }} • {{ b.phone }}</div>
                      </div>
                    </div>
                    <span class="status-indicator-dot" title="Online"></span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .settings-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #0B0F19;
    }

    .settings-content {
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

    .save-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .save-toast {
      color: #34D399;
      font-size: 0.9rem;
      font-weight: 700;
      animation: fadeIn 0.3s ease;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
      gap: 20px;
    }

    .settings-col {
      display: flex;
      flex-direction: column;
    }

    .settings-card {
      padding: 24px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: 12px;
    }
    .card-header h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #F8FAFC;
    }
    .sec-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: #94A3B8;
      background: rgba(255, 255, 255, 0.05);
      padding: 3px 8px;
      border-radius: 6px;
    }

    .form-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
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
      padding: 10px 14px;
      color: #F8FAFC;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s ease;
    }
    .input-field:focus {
      border-color: #10B981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
    }
    .textarea-field {
      resize: vertical;
      font-family: inherit;
    }

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .toggle-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #F8FAFC;
    }
    .toggle-desc {
      font-size: 0.75rem;
      color: #94A3B8;
    }
    .toggle-check {
      width: 20px;
      height: 20px;
      accent-color: #10B981;
      cursor: pointer;
    }

    .mt-20 {
      margin-top: 20px;
    }

    /* Mini Receipt Preview */
    .receipt-preview-snippet {
      background: rgba(0, 0, 0, 0.3);
      padding: 16px;
      border-radius: 12px;
      margin-top: 8px;
    }
    .preview-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #94A3B8;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .mini-receipt {
      background: #FDFBF7;
      color: #1E293B;
      font-family: 'JetBrains Mono', monospace;
      padding: 16px;
      border-radius: 8px;
      font-size: 0.8rem;
    }
    .m-center { text-align: center; }
    .m-divider { text-align: center; color: #94A3B8; margin: 6px 0; }
    .m-row { display: flex; justify-content: space-between; margin: 2px 0; }
    .bold { font-weight: 800; }
    .italic { font-style: italic; color: #475569; }

    /* Branches List */
    .branches-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .branch-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
    }
    .branch-item.current {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(16, 185, 129, 0.06);
    }
    .branch-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .branch-pill {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 800;
      font-size: 0.75rem;
      background: rgba(255, 255, 255, 0.08);
      padding: 4px 8px;
      border-radius: 6px;
      color: #F8FAFC;
    }
    .branch-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: #F8FAFC;
    }
    .current-tag {
      font-size: 0.75rem;
      color: #10B981;
      font-weight: 600;
      margin-left: 6px;
    }
    .branch-addr {
      font-size: 0.75rem;
      color: #94A3B8;
    }
    .status-indicator-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    }
  `]
})
export class SettingsComponent implements OnInit {
  private settingService = inject(SettingService);
  public auth = inject(AuthService);

  storeName: string = 'OmniPOS Gourmet Bistro';
  storePhone: string = '(555) 019-2831';
  storeEmail: string = 'contact@omnipos-bistro.com';
  storeAddress: string = '100 Innovation Blvd, Downtown Central';
  currencySymbol: string = '$';
  defaultTaxRate: number = 10;
  autoShowReceipt: boolean = true;
  soundEffects: boolean = true;
  receiptHeader: string = 'Welcome to OmniPOS Dining! We hope you enjoy your meal.';
  receiptFooter: string = 'Thank you for dining with us! Follow us on Instagram @omnipos';

  branches: Branch[] = [];
  saveSuccess: boolean = false;

  ngOnInit(): void {
    this.loadSettings();
    this.loadBranches();
  }

  loadSettings(): void {
    this.settingService.getSettings().subscribe({
      next: res => {
        if (res.success && res.settings) {
          const s = res.settings;
          this.storeName = s.store_name ?? this.storeName;
          this.storePhone = s.store_phone ?? this.storePhone;
          this.storeEmail = s.store_email ?? this.storeEmail;
          this.storeAddress = s.store_address ?? this.storeAddress;
          this.currencySymbol = s.currency_symbol ?? this.currencySymbol;
          this.defaultTaxRate = Number(s.default_tax_rate ?? this.defaultTaxRate);
          this.autoShowReceipt = s.auto_show_receipt !== 'false' && s.auto_show_receipt !== false;
          this.soundEffects = s.sound_effects !== 'false' && s.sound_effects !== false;
          this.receiptHeader = s.receipt_header ?? this.receiptHeader;
          this.receiptFooter = s.receipt_footer ?? this.receiptFooter;
        }
      }
    });
  }

  loadBranches(): void {
    this.settingService.getBranches().subscribe({
      next: res => {
        if (res.success) {
          this.branches = res.branches;
        }
      }
    });
  }

  saveSettings(): void {
    const payload = {
      store_name: this.storeName,
      store_phone: this.storePhone,
      store_email: this.storeEmail,
      store_address: this.storeAddress,
      currency_symbol: this.currencySymbol,
      default_tax_rate: this.defaultTaxRate,
      auto_show_receipt: this.autoShowReceipt,
      sound_effects: this.soundEffects,
      receipt_header: this.receiptHeader,
      receipt_footer: this.receiptFooter
    };

    this.settingService.updateSettings(payload).subscribe({
      next: () => {
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 3000);
      }
    });
  }

  formatCurrency(val: number): string {
    return this.currencySymbol + Number(val || 0).toFixed(2);
  }
}
