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

  createProduct(data: FormData | Record<string, any>) {
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

  deleteProduct(id: string) {
    return apiClient.delete<{ success: boolean; message: string }>(`/catalog/products/${id}`);
  }
};
