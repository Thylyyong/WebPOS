import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="splash-container">
      <!-- Background Ambient Glow -->
      <div class="ambient-glow glow-1"></div>
      <div class="ambient-glow glow-2"></div>

      <div class="splash-card glass-panel">
        <!-- Logo & Branding Header -->
        <div class="brand-header">
          <div class="brand-badge">🛒 OMNIPOS ENTERPRISE</div>
          <h1 class="brand-title">Select Your Role</h1>
          <p class="brand-subtitle">Quick PIN authentication for POS frontline, store management & executive oversight</p>
        </div>

        <!-- Role Selection Cards -->
        <div class="roles-grid">
          @for (role of roles(); track role.id) {
            <div class="role-card" [class.selected]="selectedUser()?.id === role.id" (click)="selectRole(role)">
              <div class="role-avatar" [ngClass]="getRoleClass(role.role)">
                {{ getRoleIcon(role.role) }}
              </div>
              <div class="role-info">
                <div class="role-name">{{ role.name }}</div>
                <div class="role-badge">{{ formatRoleName(role.role) }}</div>
                <div class="role-branch">{{ role.branch_name }}</div>
              </div>
              <div class="role-pin-hint">PIN: <strong>{{ getRolePinHint(role.role) }}</strong></div>
            </div>
          }
        </div>

        <!-- Touch Numeric PIN Pad Modal / Drawer -->
        @if (selectedUser()) {
          <div class="pin-pad-container">
            <div class="pin-prompt">
              <span>Authenticating as:</span>
              <strong class="user-highlight">{{ selectedUser()?.name }}</strong>
            </div>

            <!-- PIN Display Dots -->
            <div class="pin-display">
              <div class="pin-dot" [class.filled]="enteredPin().length >= 1"></div>
              <div class="pin-dot" [class.filled]="enteredPin().length >= 2"></div>
              <div class="pin-dot" [class.filled]="enteredPin().length >= 3"></div>
              <div class="pin-dot" [class.filled]="enteredPin().length >= 4"></div>
            </div>

            @if (errorMessage()) {
              <div class="pin-error">{{ errorMessage() }}</div>
            }

            <!-- Touch Numpad -->
            <div class="numpad-grid">
              @for (num of ['1', '2', '3', '4', '5', '6', '7', '8', '9']; track num) {
                <button type="button" class="num-btn" (click)="appendPin(num)">{{ num }}</button>
              }
              <button type="button" class="num-btn action-btn" (click)="clearPin()">C</button>
              <button type="button" class="num-btn" (click)="appendPin('0')">0</button>
              <button type="button" class="num-btn action-btn" (click)="backspacePin()">⌫</button>
            </div>

            <div class="pin-actions">
              <button type="button" class="glow-btn-secondary" (click)="cancelPin()">Change Role</button>
              <button type="button" class="glow-btn-primary" [disabled]="enteredPin().length < 4 || isLoading()" (click)="submitPin()">
                {{ isLoading() ? 'Verifying...' : 'Login to POS' }}
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .splash-container {
      min-height: 100vh;
      width: 100vw;
      background: radial-gradient(circle at 50% 10%, #172554, #0B0F19 60%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }

    .ambient-glow {
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      filter: blur(140px);
      pointer-events: none;
      opacity: 0.25;
    }
    .glow-1 { top: -100px; left: 10%; background: #10B981; }
    .glow-2 { bottom: -100px; right: 10%; background: #6366F1; }

    .splash-card {
      max-width: 820px;
      width: 100%;
      padding: 40px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      z-index: 1;
    }

    .brand-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .brand-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34D399;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      border-radius: 9999px;
      margin-bottom: 12px;
    }

    .brand-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: #F8FAFC;
      letter-spacing: -0.02em;
    }

    .brand-subtitle {
      color: #94A3B8;
      font-size: 0.95rem;
      margin-top: 6px;
    }

    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .role-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
    }
    .role-card:hover {
      background: rgba(30, 41, 59, 0.9);
      border-color: rgba(16, 185, 129, 0.4);
      transform: translateY(-3px);
    }
    .role-card.selected {
      border-color: #10B981;
      background: rgba(16, 185, 129, 0.1);
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
    }

    .role-avatar {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .avatar-boss { background: rgba(245, 158, 11, 0.2); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.4); }
    .avatar-manager { background: rgba(99, 102, 241, 0.2); color: #818CF8; border: 1px solid rgba(99, 102, 241, 0.4); }
    .avatar-cashier { background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .avatar-chef { background: rgba(244, 63, 94, 0.2); color: #FB7185; border: 1px solid rgba(244, 63, 94, 0.4); }

    .role-name {
      font-weight: 700;
      color: #F8FAFC;
      font-size: 1rem;
    }
    .role-badge {
      font-size: 0.75rem;
      color: #94A3B8;
      background: rgba(255, 255, 255, 0.05);
      padding: 2px 8px;
      border-radius: 6px;
      margin-top: 4px;
    }
    .role-branch {
      font-size: 0.8rem;
      color: #64748B;
      margin-top: 4px;
    }
    .role-pin-hint {
      font-size: 0.75rem;
      color: #10B981;
      background: rgba(16, 185, 129, 0.1);
      padding: 4px 10px;
      border-radius: 9999px;
      border: 1px dashed rgba(16, 185, 129, 0.3);
    }

    .pin-pad-container {
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 28px;
      max-width: 360px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: fadeIn 0.25s ease-out;
    }

    .pin-prompt {
      font-size: 0.9rem;
      color: #94A3B8;
      display: flex;
      gap: 6px;
      margin-bottom: 16px;
    }
    .user-highlight {
      color: #34D399;
    }

    .pin-display {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }
    .pin-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.2);
      transition: all 0.15s ease;
    }
    .pin-dot.filled {
      background: #10B981;
      border-color: #10B981;
      box-shadow: 0 0 10px #10B981;
      transform: scale(1.15);
    }

    .pin-error {
      color: #FB7185;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 12px;
      text-align: center;
    }

    .numpad-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      width: 100%;
      margin-bottom: 20px;
    }
    .num-btn {
      height: 54px;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      color: #F8FAFC;
      font-size: 1.3rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .num-btn:hover {
      background: rgba(51, 65, 85, 0.9);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }
    .num-btn:active {
      transform: translateY(0);
      background: #10B981;
      color: white;
    }
    .action-btn {
      color: #94A3B8;
      font-size: 1.1rem;
    }

    .pin-actions {
      display: flex;
      gap: 12px;
      width: 100%;
    }
    .pin-actions button {
      flex: 1;
    }
  `]
})
export class SplashComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  roles = signal<any[]>([]);
  selectedUser = signal<any | null>(null);
  enteredPin = signal<string>('');
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.auth.getRoles().subscribe({
      next: res => {
        if (res.success) {
          this.roles.set(res.roles);
          // Preselect cashier by default
          const cashier = res.roles.find((r: any) => r.role === 'STAFF_CASHIER');
          if (cashier) {
            this.selectedUser.set(cashier);
          }
        }
      },
      error: () => {
        // Fallback default roles if API warming up
        this.roles.set([
          { id: 1, name: 'Owner (Main Boss)', username: 'main_boss', role: 'MAIN_BOSS', branch_name: 'OmniPOS Master HQ' },
          { id: 2, name: 'Sub Boss 1 (Downtown)', username: 'manager_store_a', role: 'SUB_BOSS', branch_name: 'Store A - Downtown' },
          { id: 3, name: 'Sub Boss 2 (Uptown)', username: 'manager_store_b', role: 'SUB_BOSS', branch_name: 'Store B - Uptown' },
          { id: 4, name: 'Staff Cashier 01', username: 'cashier_01', role: 'STAFF_CASHIER', branch_name: 'Store A - Downtown' },
        ]);
        this.selectedUser.set(this.roles()[3]);
      }
    });
  }

  selectRole(role: any): void {
    this.selectedUser.set(role);
    this.enteredPin.set('');
    this.errorMessage.set('');
  }

  appendPin(digit: string): void {
    if (this.enteredPin().length < 4) {
      this.enteredPin.update(p => p + digit);
      if (this.enteredPin().length === 4) {
        this.submitPin();
      }
    }
  }

  backspacePin(): void {
    this.enteredPin.update(p => p.slice(0, -1));
    this.errorMessage.set('');
  }

  clearPin(): void {
    this.enteredPin.set('');
    this.errorMessage.set('');
  }

  cancelPin(): void {
    this.selectedUser.set(null);
    this.enteredPin.set('');
    this.errorMessage.set('');
  }

  submitPin(): void {
    if (this.enteredPin().length < 4) return;
    this.isLoading.set(true);
    this.errorMessage.set('');

    const username = this.selectedUser()?.username;
    this.auth.loginWithPin(this.enteredPin(), username).subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.success) {
          this.router.navigate(['/pos']);
        }
      },
      error: err => {
        this.isLoading.set(false);
        this.enteredPin.set('');
        this.errorMessage.set(err.error?.message || 'Invalid PIN code. Please try again.');
      }
    });
  }

  getRoleClass(role: string): string {
    if (role === 'MAIN_BOSS') return 'avatar-boss';
    if (role === 'SUB_BOSS') return 'avatar-manager';
    if (role === 'CHEF') return 'avatar-chef';
    return 'avatar-cashier';
  }

  getRoleIcon(role: string): string {
    if (role === 'MAIN_BOSS') return '👑';
    if (role === 'SUB_BOSS') return '👔';
    if (role === 'CHEF') return '👨‍🍳';
    return '🏷️';
  }

  formatRoleName(role: string): string {
    if (role === 'MAIN_BOSS') return 'Holding Owner';
    if (role === 'SUB_BOSS') return 'Store Manager';
    if (role === 'CHEF') return 'Head Chef';
    return 'Frontline Cashier';
  }

  getRolePinHint(role: string): string {
    if (role === 'MAIN_BOSS') return '9999';
    if (role === 'SUB_BOSS') return '1111 / 2222';
    if (role === 'CHEF') return '5555';
    return '1234';
  }
}
