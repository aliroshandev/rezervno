/**
 * helpers مشترکِ UseCaseها — تکرارِ page/limit و ساختِ پاسخِ لیست را یکجا کم می‌کند.
 */

export type PageInput = { page?: number; limit?: number };

/** استخراج امنِ page/limit با سقف (PHP-style نبودنِ مقادیر ورودی). */
export function paginate(query: PageInput): { page: number; limit: number; skip: number } {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(query.limit ?? 20)));
  return { page, limit, skip: (page - 1) * limit };
}

/** پاسخ یکدستِ لیست با pagination — برای همه‌ی endpointهای فهرست. */
export function listResponse(items: unknown[], total: number, page: number, limit: number) {
  return { items, total, page, limit, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
}