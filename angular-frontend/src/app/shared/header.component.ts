import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { RegisterService } from '../core/services/register.service';
import { SettingService } from '../core/services/setting.service';
import { Branch } from '../core/models/pos.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="pos-topbar glass-panel">
      <!-- Left: Logo & Branch Switcher -->
      <div class="topbar-left">
        <div class="brand" routerLink="/pos">
          <span class="brand-icon">🛒</span>
          <div class="brand-text">
            <span class="brand-name">OmniPOS</span>
            <span class="brand-tag">Enterprise</span>
          </div>
        </div>

        <div class="branch-selector">
          <span class="branch-icon">🏬</span>
          <span class="branch-name">{{ auth.activeBranch().name }}</span>
          @if (auth.currentUser()?.is_main_boss) {
            <div class="branch-dropdown-wrapper">
              <select (change)="onBranchChange($event)" class="branch-select">
                @for (b of branches; track b.id) {
                  <option [value]="b.id" [selected]="b.id === auth.activeBranch().id">{{ b.branch_name }}</option>
                }
              </select>
            </div>
          }
        </div>
      </div>

      <!-- Center: Navigation Tabs -->
      <nav class="topbar-nav">
        <a routerLink="/pos" routerLinkActive="active" class="nav-tab">
          <span class="tab-icon">🛒</span>
          <span class="tab-label">POS Terminal</span>
        </a>
        <a routerLink="/tables" routerLinkActive="active" class="nav-tab">
          <span class="tab-icon">🍽️</span>
          <span class="tab-label">Floor Plan</span>
        </a>
        <a routerLink="/register" routerLinkActive="active" class="nav-tab">
          <span class="tab-icon">💵</span>
          <span class="tab-label">Shift Register</span>
        </a>
        <a routerLink="/accounting" routerLinkActive="active" class="nav-tab">
          <span class="tab-icon">📊</span>
          <span class="tab-label">Financials</span>
        </a>
        <a routerLink="/settings" routerLinkActive="active" class="nav-tab">
          <span class="tab-icon">⚙️</span>
          <span class="tab-label">Settings</span>
        </a>
      </nav>

      <!-- Right: Shift Status, Clock & User Avatar -->
      <div class="topbar-right">
        <!-- Register Pill -->
        <div class="status-pill" [class.open]="isRegisterOpen" routerLink="/register">
          <span class="status-dot"></span>
          <span>{{ isRegisterOpen ? 'REGISTER OPEN' : 'REGISTER CLOSED' }}</span>
        </div>

        <!-- Live Clock -->
        <div class="clock-display">
          <span class="clock-time">{{ currentTime }}</span>
        </div>

        <!-- User Badge & Logout -->
        <div class="user-badge" (click)="logout()" title="Click to Logout">
          <div class="user-avatar">{{ getUserIcon() }}</div>
          <div class="user-details">
            <span class="user-name">{{ auth.currentUser()?.name || 'Cashier' }}</span>
            <span class="user-role">{{ formatRole(auth.currentUser()?.role) }}</span>
          </div>
          <span class="logout-icon" title="Logout">🚪</span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .pos-topbar {
      height: 64px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      border-radius: 0;
      border-top: none;
      border-left: none;
      border-right: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(11, 15, 25, 0.88);
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      cursor: pointer;
    }
    .brand-icon {
      font-size: 1.6rem;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
    }
    .brand-name {
      font-weight: 800;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
      color: #F8FAFC;
    }
    .brand-tag {
      font-size: 0.65rem;
      color: #10B981;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: -3px;
    }

    .branch-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 6px 12px;
      border-radius: 10px;
      position: relative;
    }
    .branch-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #E2E8F0;
    }
    .branch-select {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      width: 100%;
      height: 100%;
    }

    .topbar-nav {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .nav-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 10px;
      color: #94A3B8;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .nav-tab:hover {
      color: #F8FAFC;
      background: rgba(255, 255, 255, 0.06);
    }
    .nav-tab.active {
      color: #10B981;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .status-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      background: rgba(244, 63, 94, 0.15);
      color: #FB7185;
      border: 1px solid rgba(244, 63, 94, 0.3);
      cursor: pointer;
    }
    .status-pill.open {
      background: rgba(16, 185, 129, 0.15);
      color: #34D399;
      border-color: rgba(16, 185, 129, 0.3);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }

    .clock-display {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #94A3B8;
      padding: 4px 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
    }

    .user-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 4px 12px 4px 6px;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .user-badge:hover {
      background: rgba(244, 63, 94, 0.1);
      border-color: rgba(244, 63, 94, 0.3);
    }
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }
    .user-details {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: #F8FAFC;
    }
    .user-role {
      font-size: 0.65rem;
      color: #94A3B8;
    }
    .logout-icon {
      font-size: 1rem;
      margin-left: 4px;
      opacity: 0.6;
    }
    .user-badge:hover .logout-icon {
      opacity: 1;
      color: #FB7185;
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  public auth = inject(AuthService);
  private registerService = inject(RegisterService);
  private settingService = inject(SettingService);
  private router = inject(Router);

  branches: Branch[] = [];
  isRegisterOpen: boolean = false;
  currentTime: string = '';
  private timer: any;

  ngOnInit(): void {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);

    // Load branches
    this.settingService.getBranches().subscribe({
      next: res => {
        if (res.success) {
          this.branches = res.branches;
        }
      }
    });

    // Check register session status
    this.registerService.getCurrentSession(this.auth.activeBranch().id).subscribe({
      next: res => {
        this.isRegisterOpen = res.has_active_session;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  updateClock(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  onBranchChange(event: any): void {
    const branchId = event.target.value;
    const branch = this.branches.find(b => b.id === branchId);
    if (branch) {
      this.auth.switchBranch(branch).subscribe();
      window.location.reload();
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getUserIcon(): string {
    const role = this.auth.currentUser()?.role;
    if (role === 'MAIN_BOSS') return '👑';
    if (role === 'SUB_BOSS') return '👔';
    if (role === 'CHEF') return '👨‍🍳';
    return '🏷️';
  }

  formatRole(role?: string): string {
    if (!role) return 'Cashier';
    if (role === 'MAIN_BOSS') return 'Main Boss';
    if (role === 'SUB_BOSS') return 'Sub Boss';
    if (role === 'CHEF') return 'Chef';
    return 'Staff Cashier';
  }
}
