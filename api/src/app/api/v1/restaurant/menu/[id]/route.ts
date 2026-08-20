import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withRestaurantAuth } from '@/lib/with-restaurant-auth';
import { parseBody, parseParams, zUuid, z } from '@/lib/schemas';
import { MenuUseCase } from '@/lib/usecases/menu/menu-use-case';

const idParamSchema = z.object({ id: zUuid });

const patchSchema = z.object({
  name: z.string().min(1).max(120).trim().optional(),
  price_toman: z.number().int().min(0).max(1_000_000_000).optional(),
  emoji: z.string().max(16).nullable().optional(),
  category: z.string().max(60).trim().nullable().optional(),
  is_active: z.boolean().optional(),
});

// ══ فاز ۲ DRY — منطقِ IDOR/نامِ تکراری/بایگانیِ DELETE به MenuUseCase منتقل شد.
//    اگر خواستی برگردی، بلوکِ P>> را فعال و بلوکِ N>> را غیرفعال کن.
// ═══════════════════════════════════════════════════════════════════════

// --P>> findOwnedItem / PATCH / DELETE قبلی (before فاز ۲) --
// /**
//  * آیتم را با چکِ مالکیت پیدا می‌کند (IDOR). — به MenuUseCase منتقل شد.
//  */
// async function findOwnedItem(id: string, restaurantId: string) {
//   const item = await db.menuItem.findUnique({
//     where: { id },
//     select: { id: true, restaurantId: true, name: true },
//   });
//   if (!item || item.restaurantId !== restaurantId) throw Err.notFound('آیتمِ منو');
//   return item;
// }

// export const PATCH = withRestaurantAuth({ rateLimit: 'auth', permission: 'canManageSettings' }, async (req, ctx, rawParams: { id: string }) => {
//   const { id } = parseParams(rawParams, idParamSchema);
//   await findOwnedItem(id, ctx.restaurant.id);
//   const b = await parseBody(req, patchSchema);
//   const data: Record<string, unknown> = {};
//   if (b.name !== undefined) data.name = b.name;
//   if (b.price_toman !== undefined) data.priceToman = b.price_toman;
//   if (b.emoji !== undefined) data.emoji = b.emoji;
//   if (b.category !== undefined) data.category = b.category;
//   if (b.is_active !== undefined) data.isActive = b.is_active;
//   if (Object.keys(data).length === 0) throw Err.validation('چیزی برای تغییر فرستاده نشده');
//   if (b.name !== undefined) {
//     const dup = await db.menuItem.findFirst({
//       where: { restaurantId: ctx.restaurant.id, name: b.name, id: { not: id } },
//       select: { id: true },
//     });
//     if (dup) throw Err.validation('آیتمِ دیگری با همین نام در منو هست');
//   }
//   const updated = await db.menuItem.update({ where: { id }, data, select: { id: true, name: true, priceToman: true, emoji: true, category: true, isActive: true } });
//   return NextResponse.json({ id: updated.id, name: updated.name, price_toman: updated.priceToman, emoji: updated.emoji, category: updated.category, is_active: updated.isActive });
// });

// export const DELETE = withRestaurantAuth({ rateLimit: 'auth', permission: 'canManageSettings' }, async (_req, ctx, rawParams: { id: string }) => {
//   const { id } = parseParams(rawParams, idParamSchema);
//   const item = await findOwnedItem(id, ctx.restaurant.id);
//   const usedInOrders = await db.reservationItem.count({ where: { menuItemId: id } });
//   if (usedInOrders > 0) {
//     await db.menuItem.update({ where: { id }, data: { isActive: false } });
//     return NextResponse.json({ id, archived: true, used_in_orders: usedInOrders,
//       message: `«${item.name}» در ${usedInOrders} پیش‌سفارشِ ثبت‌شده به‌کار رفته، پس برایِ حفظِ سابقه حذف نشد و فقط از منو برداشته شد (غیرفعال).` });
//   }
//   await db.menuItem.delete({ where: { id } });
//   return NextResponse.json({ id, archived: false, message: 'آیتم از منو حذف شد.' });
// });

// --N>> PATCH جدید (فاز ۲) --
/** PATCH — ویرایشِ آیتمِ منو (نام، قیمت، ایموجی، دسته، فعال/غیرفعال) */
export const PATCH = withRestaurantAuth({ rateLimit: 'auth', permission: 'canManageSettings' }, async (req, ctx, rawParams: { id: string }) => {
  const { id } = parseParams(rawParams, idParamSchema);
  const b = await parseBody(req, patchSchema);
  const result = await new MenuUseCase({ db, ctx: { restaurantId: ctx.restaurant.id } }).execute({ action: 'update', id, data: b });
  return NextResponse.json(result);
});

// --N>> DELETE جدید (فاز ۲) —
/** DELETE — حذفِ آیتمِ منو (یا بایگانی اگر سابقه‌ی سفارش دارد) */
export const DELETE = withRestaurantAuth({ rateLimit: 'auth', permission: 'canManageSettings' }, async (_req, ctx, rawParams: { id: string }) => {
  const { id } = parseParams(rawParams, idParamSchema);
  const result = await new MenuUseCase({ db, ctx: { restaurantId: ctx.restaurant.id } }).execute({ action: 'delete', id });
  return NextResponse.json(result);
});
