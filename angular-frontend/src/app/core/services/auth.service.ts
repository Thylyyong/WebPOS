import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { User, Branch } from '../models/pos.models';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);

  public currentUser = signal<User | null>(null);
  public activeBranch = signal<{ id: string; name: string }>({
    id: 'store_a',
    name: 'Store A - Downtown'
  });

  constructor() {
    const savedUser = localStorage.getItem('pos_user');
    const savedBranch = localStorage.getItem('pos_branch');
    if (savedUser) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch (_) {}
    }
    if (savedBranch) {
      try {
        this.activeBranch.set(JSON.parse(savedBranch));
      } catch (_) {}
    }
  }

  getRoles(): Observable<any> {
    return this.api.get<any>('auth/roles');
  }

  loginWithPin(pin_code: string, username?: string): Observable<any> {
    return this.api.post<any>('auth/login-pin', { pin_code, username }).pipe(
      tap(res => {
        if (res.success && res.user) {
          this.currentUser.set(res.user);
          localStorage.setItem('pos_token', res.token);
          localStorage.setItem('pos_user', JSON.stringify(res.user));

          const branchObj = {
            id: res.user.branch_id || 'store_a',
            name: res.user.branch_name || 'Store A - Downtown'
          };
          this.activeBranch.set(branchObj);
          localStorage.setItem('pos_branch', JSON.stringify(branchObj));
        }
      })
    );
  }

  switchBranch(branch: Branch): Observable<any> {
    return this.api.post<any>('auth/switch-branch', { branch_id: branch.id }).pipe(
      tap(res => {
        if (res.success) {
          const branchObj = { id: branch.id, name: branch.branch_name };
          this.activeBranch.set(branchObj);
          localStorage.setItem('pos_branch', JSON.stringify(branchObj));
        }
      })
    );
  }

  logout(): void {
    this.api.post('auth/logout', {}).subscribe({ error: () => {} });
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    this.currentUser.set(null);
  }
}
