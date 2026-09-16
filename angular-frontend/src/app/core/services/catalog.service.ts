import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private api = inject(ApiService);

  getCategories(): Observable<any> {
    return this.api.get<any>('catalog/categories');
  }

  getProducts(params: { category_id?: string; search?: string } = {}): Observable<any> {
    return this.api.get<any>('catalog/products', params);
  }

  findByBarcode(barcode: string): Observable<any> {
    return this.api.get<any>(`catalog/products/barcode/${barcode}`);
  }
}
