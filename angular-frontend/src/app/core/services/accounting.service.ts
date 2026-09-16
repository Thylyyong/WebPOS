import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private api = inject(ApiService);

  getProfitLoss(branchId: string): Observable<any> {
    return this.api.get<any>('accounting/profit-loss', { branch_id: branchId });
  }

  getExpenses(branchId: string): Observable<any> {
    return this.api.get<any>('accounting/expenses', { branch_id: branchId });
  }

  storeExpense(data: { branch_id: string; category: string; title: string; amount: number; notes?: string }): Observable<any> {
    return this.api.post<any>('accounting/expenses', data);
  }
}
