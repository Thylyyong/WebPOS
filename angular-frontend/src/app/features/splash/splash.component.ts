import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="splash-container">
      <div class="splash-card glass-panel">
        <!-- Brand Header -->
        <div class="brand-header">
          <div class="brand-badge">
            <app-icon name="store" [size]="16"></app-icon>
            <span>OMNIPOS TERMINAL</span>
          </div>
          <h1 class="brand-title">Select User Role</h1>
          <p class="brand-subtitle">Choose account to begin shift session</p>
        </div>

        <!-- 2 Clean Options: Boss and Cashier -->
        <div class="roles-grid">
          <!-- Boss Option -->
          <div 
            class="role-card" 
            [class.selected]="selectedRole() === 'boss'" 
            (click)="selectRoleByName('boss')">
            <div class="role-icon-box boss">
              <app-icon name="boss" [size]="32"></app-icon>
            </div>
            <div class="role-info">
              <div class="role-name">Boss</div>
              <div class="role-badge">Owner / Manager</div>
              <div class="role-branch">OmniPOS Main Store</div>
            </div>
            <div class="role-pin-hint">PIN: <strong>9999</strong></div>
          </div>

          <!-- Cashier Option -->
          <div 
            class="role-card" 
            [class.selected]="selectedRole() === 'cashier'" 
            (click)="selectRoleByName('cashier')">
            <div class="role-icon-box cashier">
              <app-icon name="cashier" [size]="32"></app-icon>
            </div>
            <div class="role-info">
              <div class="role-name">Cashier</div>
              <div class="role-badge">Frontline Cashier</div>
              <div class="role-branch">OmniPOS Main Store</div>
            </div>
            <div class="role-pin-hint">PIN: <strong>1234</strong></div>
          </div>
        </div>

        <!-- Touch Numeric PIN Pad -->
        <div class="pin-pad-container">
          <div class="pin-prompt">
            <span>Enter PIN for</span>
            <strong class="user-highlight">{{ selectedRole() === 'boss' ? 'Boss' : 'Cashier' }}</strong>
          </div>

          <!-- Masked PIN Display Dots -->
          <div class="pin-display">
            <div class="pin-dot" [class.filled]="enteredPin().length >= 1"></div>
            <div class="pin-dot" [class.filled]="enteredPin().length >= 2"></div>
            <div class="pin-dot" [class.filled]="enteredPin().length >= 3"></div>
            <div class="pin-dot" [class.filled]="enteredPin().length >= 4"></div>
          </div>

          @if (errorMessage()) {
            <div class="pin-error">{{ errorMessage() }}</div>
          }

          <!-- Touch Numpad Grid -->
          <div class="numpad-grid">
            @for (num of ['1', '2', '3', '4', '5', '6', '7', '8', '9']; track num) {
              <button type="button" class="num-btn" (click)="appendPin(num)">{{ num }}</button>
            }
            <button type="button" class="num-btn action-btn" (click)="clearPin()">C</button>
            <button type="button" class="num-btn" (click)="appendPin('0')">0</button>
            <button type="button" class="num-btn action-btn" (click)="backspacePin()">
              <app-icon name="close" [size]="18"></app-icon>
            </button>
          </div>

          <div class="pin-actions">
            <button 
              type="button" 
              class="glow-btn-primary" 
              [disabled]="enteredPin().length < 4 || isLoading()" 
              (click)="submitPin()">
              <app-icon name="lock" [size]="16"></app-icon>
              <span>{{ isLoading() ? 'Verifying...' : 'Login to POS' }}</span>
            </button>
          </div>

          <!-- Quick Test Credentials Buttons -->
          <div class="quick-credentials">
            <span class="quick-lbl">Quick Login:</span>
            <button type="button" class="quick-pill" (click)="quickLogin('boss', '9999')">
              <app-icon name="boss" [size]="14"></app-icon>
              <span>Boss (9999)</span>
            </button>
            <button type="button" class="quick-pill" (click)="quickLogin('cashier', '1234')">
              <app-icon name="cashier" [size]="14"></app-icon>
              <span>Cashier (1234)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .splash-container {
      min-height: 100vh;
      width: 100vw;
      background: #0B0F19;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
    }

    .splash-card {
      max-width: 580px;
      width: 100%;
      padding: 36px;
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }

    .brand-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #10B981;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #F8FAFC;
      letter-spacing: -0.02em;
    }
    .brand-subtitle {
      font-size: 0.85rem;
      color: #94A3B8;
      margin-top: 4px;
    }

    /* 2 Options Grid */
    .roles-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .role-card {
      background: rgba(255, 255, 255, 0.03);
      border: 2px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .role-card:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }
    .role-card.selected {
      background: rgba(16, 185, 129, 0.12);
      border-color: #10B981;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
    }

    .role-icon-box {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }
    .role-icon-box.boss {
      background: rgba(245, 158, 11, 0.15);
      color: #F59E0B;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .role-icon-box.cashier {
      background: rgba(16, 185, 129, 0.15);
      color: #10B981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .role-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: #F8FAFC;
    }
    .role-badge {
      font-size: 0.75rem;
      color: #94A3B8;
      font-weight: 600;
      margin-top: 2px;
    }
    .role-branch {
      font-size: 0.7rem;
      color: #64748B;
      margin-top: 4px;
    }
    .role-pin-hint {
      margin-top: 10px;
      font-size: 0.75rem;
      color: #94A3B8;
      background: rgba(0, 0, 0, 0.3);
      padding: 3px 8px;
      border-radius: 6px;
    }

    /* PIN Pad */
    .pin-pad-container {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .pin-prompt {
      font-size: 0.9rem;
      color: #94A3B8;
      margin-bottom: 12px;
    }
    .user-highlight {
      color: #10B981;
      margin-left: 4px;
    }

    .pin-display {
      display: flex;
      gap: 14px;
      margin-bottom: 16px;
    }
    .pin-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.25);
      transition: all 0.2s ease;
    }
    .pin-dot.filled {
      background: #10B981;
      border-color: #10B981;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
    }

    .pin-error {
      color: #FB7185;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .numpad-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      width: 240px;
      margin-bottom: 16px;
    }
    .num-btn {
      height: 52px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #F8FAFC;
      font-size: 1.25rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .num-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.25);
    }
    .num-btn:active {
      transform: scale(0.95);
    }
    .action-btn {
      color: #94A3B8;
      font-size: 1rem;
    }

    .pin-actions {
      width: 100%;
      max-width: 240px;
    }
    .glow-btn-primary {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #10B981;
      color: #041F16;
      border: none;
      padding: 12px;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .glow-btn-primary:hover:not(:disabled) {
      background: #34D399;
    }
    .glow-btn-primary:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .quick-credentials {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .quick-lbl {
      font-size: 0.75rem;
      color: #64748B;
    }
    .quick-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
      padding: 4px 10px;
      color: #94A3B8;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .quick-pill:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #F8FAFC;
    }
  `]
})
export class SplashComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  selectedRole = signal<'boss' | 'cashier'>('boss');
  enteredPin = signal<string>('');
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    // Listen to keyboard digits
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleKeyDown(e: KeyboardEvent): void {
    if (e.key >= '0' && e.key <= '9') {
      this.appendPin(e.key);
    } else if (e.key === 'Backspace') {
      this.backspacePin();
    } else if (e.key === 'Enter') {
      if (this.enteredPin().length >= 4) {
        this.submitPin();
      }
    }
  }

  selectRoleByName(role: 'boss' | 'cashier'): void {
    this.selectedRole.set(role);
    this.enteredPin.set('');
    this.errorMessage.set('');
  }

  appendPin(digit: string): void {
    if (this.enteredPin().length < 6) {
      this.enteredPin.update(p => p + digit);
      this.errorMessage.set('');

      // Auto submit on 4 digits
      if (this.enteredPin().length === 4) {
        setTimeout(() => this.submitPin(), 150);
      }
    }
  }

  backspacePin(): void {
    this.enteredPin.update(p => p.slice(0, -1));
  }

  clearPin(): void {
    this.enteredPin.set('');
    this.errorMessage.set('');
  }

  quickLogin(username: string, pin: string): void {
    this.selectedRole.set(username as 'boss' | 'cashier');
    this.enteredPin.set(pin);
    this.submitPin();
  }

  submitPin(): void {
    const pin = this.enteredPin();
    if (!pin) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.loginWithPin(pin, this.selectedRole()).subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.success) {
          this.router.navigate(['/pos']);
        } else {
          this.errorMessage.set(res.message || 'Invalid PIN code');
          this.enteredPin.set('');
        }
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid PIN. Try again.');
        this.enteredPin.set('');
      }
    });
  }
}
