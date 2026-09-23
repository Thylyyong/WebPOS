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

export interface CreateProductPayload {
  name: string;
  category_id: string;
  subcategory_id?: string | null;
  price: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  description?: string;
  stock_quantity?: number;
  tax_rate?: number;
  image_path?: string;
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
  },

  // Backed by POST /catalog/products (Boss/Sub-boss only)
  createProduct(payload: CreateProductPayload) {
    return apiClient.post<{ success: boolean; message: string; product: Product }>('/catalog/products', payload);
  },

  // Backed by PATCH /catalog/products/{id}/stock (Boss/Sub-boss only) — the
  // only product-level mutation the backend exposes besides creation.
  updateStock(productId: string, stock_quantity: number) {
    return apiClient.patch<{ success: boolean; message: string; product: Product }>(
      `/catalog/products/${productId}/stock`,
      { stock_quantity }
    );
  }
};
