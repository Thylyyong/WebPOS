import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettlementService {
  private api = inject(ApiService);

  getSummary(): Observable<any> {
    return this.api.get<any>('settlement/summary');
  }

  updateConfig(branchId: string, data: { base_rent_amount: number; royalty_percent: number }): Observable<any> {
    return this.api.post<any>(`settlement/config/${branchId}`, data);
  }

  settle(data: { branch_id: string; period_start: string; period_end: string }): Observable<any> {
    return this.api.post<any>('settlement/settle', data);
  }
}
