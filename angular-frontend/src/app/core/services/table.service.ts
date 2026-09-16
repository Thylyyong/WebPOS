import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private api = inject(ApiService);

  getTables(branchId: string): Observable<any> {
    return this.api.get<any>('tables', { branch_id: branchId });
  }

  assignTable(id: string, customerName?: string, orderTotal: number = 0): Observable<any> {
    return this.api.post<any>(`tables/${id}/assign`, {
      customer_name: customerName,
      order_total: orderTotal
    });
  }

  transferTable(sourceId: string, targetTableId: string): Observable<any> {
    return this.api.post<any>(`tables/${sourceId}/transfer`, {
      target_table_id: targetTableId
    });
  }

  releaseTable(id: string): Observable<any> {
    return this.api.post<any>(`tables/${id}/release`, {});
  }
}
