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
    selectCategory,
    setSearch
  };
});
