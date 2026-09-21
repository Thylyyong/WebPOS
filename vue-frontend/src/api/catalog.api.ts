import { apiClient } from './client';
import type { Category, Product } from '../types/pos.types';

export interface CategoriesResponse {
  success: boolean;
  categories: Category[];
}

export interface ProductsResponse {
  success: boolean;
  count: number;
  products: Product[];
}

export interface BarcodeResponse {
  success: boolean;
  product: Product;
}

export const catalogApi = {
  getCategories() {
    return apiClient.get<CategoriesResponse>('/catalog/categories');
  },

  getProducts(params?: { category_id?: string; search?: string }) {
    return apiClient.get<ProductsResponse>('/catalog/products', { params });
  },

  lookupBarcode(barcode: string) {
    return apiClient.get<BarcodeResponse>(`/catalog/products/barcode/${encodeURIComponent(barcode)}`);
  }
};
