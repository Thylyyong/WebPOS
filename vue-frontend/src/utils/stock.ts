import type { Category, Product } from '../types/pos.types';

/**
 * Stock tracking rule, based on the product's category:
 * Coffee and Drink categories have no stock amount; every other category (Food, Bakery,
 * Other, ...) keeps the existing stock functionality.
 * Matches category names such as "Coffee", "Drink", "Drinks" or "Coffee & Drinks".
 */
const STOCKLESS_CATEGORY = /\b(coffee|drinks?)\b/i;

export function isStocklessCategoryName(name?: string | null): boolean {
  return !!name && STOCKLESS_CATEGORY.test(name);
}

/** True when the category (by id) tracks a stock amount. Unknown/empty category keeps stock. */
export function categoryTracksStock(categoryId: string | null | undefined, categories: Category[]): boolean {
  if (!categoryId) return true;
  const cat = categories.find((c) => c.id === categoryId);
  return !isStocklessCategoryName(cat?.name);
}

/** True when this product's stock amount should be shown/edited. */
export function productTracksStock(product: Product, categories: Category[] = []): boolean {
  const name = product.category?.name ?? categories.find((c) => c.id === product.category_id)?.name;
  return !isStocklessCategoryName(name);
}
