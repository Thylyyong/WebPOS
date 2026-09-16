import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private api = inject(ApiService);

  getCurrentSession(branchId: string): Observable<any> {
    return this.api.get<any>('register/current', { branch_id: branchId });
  }

  openRegister(data: { branch_id: string; opening_cash: number; opening_notes?: string }): Observable<any> {
    return this.api.post<any>('register/open', data);
  }

  cashMovement(data: { session_id: string; type: 'CASH_IN' | 'CASH_OUT'; amount: number; reason: string; supervisor_pin: string }): Observable<any> {
    return this.api.post<any>('register/cash-movement', data);
  }

  closeRegister(data: { session_id: string; closing_cash_counted: number; closing_notes?: string }): Observable<any> {
    return this.api.post<any>('register/close', data);
  }

  getZReport(sessionId: string): Observable<any> {
    return this.api.get<any>(`register/${sessionId}/z-report`);
  }
}
