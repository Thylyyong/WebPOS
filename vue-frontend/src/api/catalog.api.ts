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

export interface SingleProductResponse {
  success: boolean;
  message?: string;
  product: Product;
}

export interface UploadImageResponse {
  success: boolean;
  message?: string;
  image_path: string;
  image_url: string;
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

  uploadProductImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post<UploadImageResponse>('/catalog/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  createProduct(data: CreateProductPayload | FormData | Record<string, any>) {
    const isFormData = data instanceof FormData;
    return apiClient.post<SingleProductResponse>('/catalog/products', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },

  updateProduct(id: string, data: FormData | Record<string, any>) {
    const isFormData = data instanceof FormData;
    return apiClient.post<SingleProductResponse>(`/catalog/products/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },

  updateStock(productId: string, stock_quantity: number) {
    return apiClient.patch<{ success: boolean; message: string; product: Product }>(
      `/catalog/products/${productId}/stock`,
      { stock_quantity }
    );
  },

  deleteProduct(id: string) {
    return apiClient.delete<{ success: boolean; message: string }>(`/catalog/products/${id}`);
  },

  createCategory(data: { name: string; color_hex?: string; icon?: string }) {
    return apiClient.post<{ success: boolean; message: string; category: Category }>('/catalog/categories', data);
  },

  updateCategory(id: string, data: { name?: string; color_hex?: string; icon?: string }) {
    return apiClient.put<{ success: boolean; message: string; category: Category }>(`/catalog/categories/${id}`, data);
  },

  deleteCategory(id: string) {
    return apiClient.delete<{ success: boolean; message: string }>(`/catalog/categories/${id}`);
  },

  createSubcategory(categoryId: string, data: { name: string }) {
    return apiClient.post<{ success: boolean; message: string; subcategory: any }>(`/catalog/categories/${categoryId}/subcategories`, data);
  },

  deleteSubcategory(id: string) {
    return apiClient.delete<{ success: boolean; message: string }>(`/catalog/subcategories/${id}`);
  }
};
