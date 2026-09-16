import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Product, CartItem, DiningTable } from '../models/pos.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PosService {
  private api = inject(ApiService);

  public cart = signal<CartItem[]>([]);
  public selectedTable = signal<DiningTable | null>(null);
  public selectedItemIndex = signal<number | null>(null);
  public customerName = signal<string>('Walk-In Guest');

  public subtotal = computed(() => {
    return this.cart().reduce((sum, item) => sum + item.total_price, 0);
  });

  public tax = computed(() => {
    return Math.round(this.subtotal() * 0.10 * 100) / 100;
  });

  public totalDue = computed(() => {
    return Math.round((this.subtotal() + this.tax()) * 100) / 100;
  });

  addToCart(product: Product): void {
    const current = [...this.cart()];
    const existingIndex = current.findIndex(i => i.product.id === product.id);

    if (existingIndex > -1) {
      const item = current[existingIndex];
      const newQty = item.quantity + 1;
      const baseTotal = newQty * item.unit_price;
      const discounted = baseTotal * (1 - item.discount_percent / 100);
      current[existingIndex] = {
        ...item,
        quantity: newQty,
        total_price: Math.round(discounted * 100) / 100
      };
      this.selectedItemIndex.set(existingIndex);
    } else {
      current.push({
        product,
        quantity: 1,
        unit_price: product.price,
        discount_percent: 0,
        total_price: product.price,
      });
      this.selectedItemIndex.set(current.length - 1);
    }

    this.cart.set(current);
  }

  updateQuantity(index: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(index);
      return;
    }
    const current = [...this.cart()];
    if (current[index]) {
      const item = current[index];
      const baseTotal = quantity * item.unit_price;
      const discounted = baseTotal * (1 - item.discount_percent / 100);
      current[index] = {
        ...item,
        quantity,
        total_price: Math.round(discounted * 100) / 100
      };
      this.cart.set(current);
    }
  }

  updateDiscount(index: number, discountPercent: number): void {
    const current = [...this.cart()];
    if (current[index]) {
      const item = current[index];
      const baseTotal = item.quantity * item.unit_price;
      const discounted = baseTotal * (1 - Math.min(100, Math.max(0, discountPercent)) / 100);
      current[index] = {
        ...item,
        discount_percent: discountPercent,
        total_price: Math.round(discounted * 100) / 100
      };
      this.cart.set(current);
    }
  }

  removeItem(index: number): void {
    const current = [...this.cart()];
    current.splice(index, 1);
    this.cart.set(current);
    if (this.selectedItemIndex() === index) {
      this.selectedItemIndex.set(current.length > 0 ? current.length - 1 : null);
    }
  }

  clearCart(): void {
    this.cart.set([]);
    this.selectedItemIndex.set(null);
    this.selectedTable.set(null);
    this.customerName.set('Walk-In Guest');
  }

  checkout(orderData: any): Observable<any> {
    return this.api.post<any>('orders', orderData);
  }

  holdOrder(branchId: string): Observable<any> {
    const payload = {
      branch_id: branchId,
      customer_name: this.customerName(),
      table_number: this.selectedTable()?.table_number,
      subtotal: this.subtotal(),
      total_amount: this.totalDue(),
      items: this.cart().map(i => ({
        product_id: i.product.id,
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price
      }))
    };
    return this.api.post<any>('orders/hold', payload);
  }

  getParkedOrders(branchId: string): Observable<any> {
    return this.api.get<any>('orders/parked', { branch_id: branchId });
  }
}
