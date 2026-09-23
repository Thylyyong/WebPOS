import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { catalogApi } from '../api/catalog.api';
import type { Category, Product } from '../types/pos.types';

export const useCatalogStore = defineStore('catalog', () => {
  const categories = ref<Category[]>([]);
  const products = ref<Product[]>([]);
  const selectedCategoryId = ref<string | null>(null);
  const searchQuery = ref<string>('');
  const isLoading = ref<boolean>(false);

  const filteredProducts = computed(() => {
    let result = products.value;

    if (selectedCategoryId.value) {
      result = result.filter(p => p.category_id === selectedCategoryId.value);
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    return result;
  });

  async function fetchCatalog() {
    isLoading.value = true;
    try {
      const [catRes, prodRes] = await Promise.all([
        catalogApi.getCategories(),
        catalogApi.getProducts()
      ]);
      if (catRes.data.success) {
        categories.value = catRes.data.categories;
      }
      if (prodRes.data.success) {
        products.value = prodRes.data.products;
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function lookupBarcode(barcode: string): Promise<Product | null> {
    try {
      const res = await catalogApi.lookupBarcode(barcode);
      if (res.data.success && res.data.product) {
        return res.data.product;
      }
    } catch (_) {}
    return null;
  }

  async function addProduct(data: FormData | Record<string, any>): Promise<Product> {
    const res = await catalogApi.createProduct(data);
    if (res.data.success && res.data.product) {
      products.value.unshift(res.data.product);
      // update category count
      const cat = categories.value.find(c => c.id === res.data.product.category_id);
      if (cat) cat.products_count = (cat.products_count || 0) + 1;
      return res.data.product;
    }
    throw new Error(res.data.message || 'Failed to add product');
  }

  async function editProduct(id: string, data: FormData | Record<string, any>): Promise<Product> {
    const res = await catalogApi.updateProduct(id, data);
    if (res.data.success && res.data.product) {
      const idx = products.value.findIndex(p => p.id === id);
      if (idx !== -1) {
        products.value[idx] = res.data.product;
      }
      return res.data.product;
    }
    throw new Error(res.data.message || 'Failed to update product');
  }

  async function removeProduct(id: string): Promise<void> {
    const res = await catalogApi.deleteProduct(id);
    if (res.data.success) {
      const prod = products.value.find(p => p.id === id);
      if (prod) {
        const cat = categories.value.find(c => c.id === prod.category_id);
        if (cat && cat.products_count && cat.products_count > 0) {
          cat.products_count--;
        }
      }
      products.value = products.value.filter(p => p.id !== id);
      return;
    }
    throw new Error(res.data.message || 'Failed to delete product');
  }

  async function uploadProductImage(file: File) {
    const res = await catalogApi.uploadProductImage(file);
    if (res.data.success) {
      return res.data;
    }
    throw new Error(res.data.message || 'Failed to upload image');
  }

  function selectCategory(catId: string | null) {
    selectedCategoryId.value = catId;
  }

  function setSearch(query: string) {
    searchQuery.value = query;
  }

  return {
    categories,
    products,
    selectedCategoryId,
    searchQuery,
    isLoading,
    filteredProducts,
    fetchCatalog,
    lookupBarcode,
    addProduct,
    editProduct,
    removeProduct,
    uploadProductImage,
    selectCategory,
    setSearch
  };
});
