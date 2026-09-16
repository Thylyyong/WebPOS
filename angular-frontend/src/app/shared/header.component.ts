import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { RegisterService } from '../core/services/register.service';
import { SettingService } from '../core/services/setting.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <header class="pos-topbar glass-panel">
      <!-- Left: Logo & Branch -->
      <div class="topbar-left">
        <div class="brand" routerLink="/pos">
          <div class="brand-icon-wrapper">
            <app-icon name="store" [size]="22"></app-icon>
          </div>
          <div class="brand-text">
            <span class="brand-name">OmniPOS</span>
            <span class="brand-tag">Terminal</span>
          </div>
        </div>

        <div class="branch-pill">
          <app-icon name="store" [size]="14"></app-icon>
          <span>{{ auth.activeBranch().name }}</span>
        </div>
      </div>

      <!-- Center: Navigation Tabs with SVG Icons (No Emojis) -->
      <nav class="topbar-nav">
        <a routerLink="/pos" routerLinkActive="active" class="nav-tab">
          <app-icon name="cart" [size]="18"></app-icon>
          <span class="tab-label">POS Terminal</span>
        </a>
        <a routerLink="/tables" routerLinkActive="active" class="nav-tab">
          <app-icon name="table" [size]="18"></app-icon>
          <span class="tab-label">Floor Plan</span>
        </a>
        <a routerLink="/register" routerLinkActive="active" class="nav-tab">
          <app-icon name="cash" [size]="18"></app-icon>
          <span class="tab-label">Shift Register</span>
        </a>
        <a routerLink="/accounting" routerLinkActive="active" class="nav-tab">
          <app-icon name="chart" [size]="18"></app-icon>
          <span class="tab-label">Financials</span>
        </a>
        <a routerLink="/settings" routerLinkActive="active" class="nav-tab">
          <app-icon name="settings" [size]="18"></app-icon>
          <span class="tab-label">Settings</span>
        </a>
      </nav>

      <!-- Right: Shift Status, Clock & User Avatar -->
      <div class="topbar-right">
        <!-- Register Status Pill -->
        <div class="status-pill" [class.open]="isRegisterOpen" routerLink="/register">
          <span class="status-dot"></span>
          <span>{{ isRegisterOpen ? 'REGISTER OPEN' : 'REGISTER CLOSED' }}</span>
        </div>

        <!-- Live Clock -->
        <div class="clock-display">
          <app-icon name="clock" [size]="14"></app-icon>
          <span class="clock-time">{{ currentTime }}</span>
        </div>

        <!-- User Badge & Logout (Only Boss or Cashier) -->
        <div class="user-badge" (click)="logout()" title="Click to Logout">
          <div class="user-avatar" [class.boss]="isBoss()">
            <app-icon [name]="isBoss() ? 'boss' : 'cashier'" [size]="16"></app-icon>
          </div>
          <div class="user-details">
            <span class="user-name">{{ auth.currentUser()?.name || 'User' }}</span>
            <span class="user-role">{{ isBoss() ? 'Boss / Manager' : 'Cashier' }}</span>
          </div>
          <button type="button" class="btn-logout" title="Logout">
            <app-icon name="logout" [size]="16"></app-icon>
          </button>
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
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      position: sticky;
      top: 0;
      z-index: 50;
      background: #0B0F19;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      cursor: pointer;
    }
    .brand-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10B981;
      display: flex;
      align-items: center;
      justify-content: center;
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

    .branch-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 5px 10px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #94A3B8;
    }

    .topbar-nav {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .nav-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 8px;
      color: #94A3B8;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      transition: all 0.15s ease;
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
      gap: 14px;
    }

    .status-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
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
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #94A3B8;
      padding: 4px 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .user-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 4px 10px 4px 6px;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .user-badge:hover {
      background: rgba(244, 63, 94, 0.08);
      border-color: rgba(244, 63, 94, 0.25);
    }
    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.2);
      color: #10B981;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-avatar.boss {
      background: rgba(245, 158, 11, 0.2);
      color: #F59E0B;
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
    .btn-logout {
      background: transparent;
      border: none;
      color: #94A3B8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin-left: 2px;
    }
    .user-badge:hover .btn-logout {
      color: #FB7185;
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  public auth = inject(AuthService);
  private registerService = inject(RegisterService);
  private router = inject(Router);

  isRegisterOpen: boolean = false;
  currentTime: string = '';
  private timer: any;

  ngOnInit(): void {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);

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

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  isBoss(): boolean {
    const role = this.auth.currentUser()?.role;
    return role === 'BOSS' || role === 'MAIN_BOSS';
  }
}
