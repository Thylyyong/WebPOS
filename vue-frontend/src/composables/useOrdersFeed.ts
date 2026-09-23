import { ordersApi, type OrderListItem } from '../api/orders.api';

/**
 * The backend's GET /orders endpoint has no date-range filter and a fixed
 * page size of 20 (Route::get('/orders', ...) -> OrderController::index,
 * which calls ->paginate(20) with no override). To power the Analytics and
 * History screens (which need "This Month" / "All Time" style views) we
 * page through the real endpoint ourselves, client-side, instead of adding
 * a new backend route.
 *
 * MAX_PAGES caps how far we'll page for a given request so the UI stays
 * responsive; for stores with a very large order history this means
 * "All Time" analytics may reflect only the most recent MAX_PAGES * 20
 * orders rather than the true full history. That limitation is inherent
 * to the existing API contract, not something this frontend can fix
 * without a backend change.
 */
const MAX_PAGES = 15;

export async function fetchAllOrders(params: {
  branch_id?: string;
  status?: string;
  search?: string;
}): Promise<{ orders: OrderListItem[]; truncated: boolean }> {
  const all: OrderListItem[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const res = await ordersApi.getOrders({ ...params, page });
    if (!res.data.success) break;
    const payload = res.data.orders;
    all.push(...payload.data);
    lastPage = payload.last_page;
    page += 1;
  } while (page <= lastPage && page <= MAX_PAGES);

  return { orders: all, truncated: lastPage > MAX_PAGES };
}

export function isSameDay(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function isWithinDays(iso: string, days: number): boolean {
  const d = new Date(iso).getTime();
  const now = Date.now();
  return d >= now - days * 24 * 60 * 60 * 1000;
}

export function isSameMonth(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}
