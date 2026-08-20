import { BaseUseCase } from '../base';
import { Err } from '../../errors';
import type { PrismaClient } from '@prisma/client';

type Deps = { db: PrismaClient; ctx: { restaurantId: string } };

export type MenuItemInput = {
  name: string;
  price_toman: number;
  emoji?: string | null;
  category?: string | null;
  is_active?: boolean;
};

/**
 * MenuUseCase — مدیریت منو روی BaseUseCase.
 *
 * جدا از CRUDِ ساده، دو قانون دامنه‌ای دارد (DRY: هر دو route از همین یک کلاس):
 *   ۱) نامِ تکراری در همان رستوران ممنوع (create و update هر دو).
 *   ۲) DELETE هوشمند: اگر آیتم سابقه‌ی سفارش دارد، به‌جای حذفِ سخت (که به
 *      خاطرِ onDelete Restrict روی ReservationItem می‌شکند و سابقه‌ی مبلغ/CLV
 *      را نابود می‌کند) فقط بایگانی (غیرفعال) می‌شود و پاسخِ صریح می‌دهد.
 */
export class MenuUseCase extends BaseUseCase<
  { restaurantId: string },
  { action: 'list' }
  | { action: 'create'; data: MenuItemInput }
  | { action: 'update'; id: string; data: Partial<MenuItemInput> }
  | { action: 'delete'; id: string },
  unknown
> {
  constructor(deps: Deps) {
    super(deps);
  }

  protected async run(input: { action: 'list' } | { action: 'create'; data: MenuItemInput } | { action: 'update'; id: string; data: Partial<MenuItemInput> } | { action: 'delete'; id: string }): Promise<unknown> {
    switch (input.action) {
      case 'list':
        return this.list();
      case 'create':
        return this.create(input.data);
      case 'update':
        return this.update(input.id, input.data);
      case 'delete':
        return this.delete(input.id);
    }
  }

  /** یافتنِ آیتمِ متعلق به همین رستوران — جلوگیری از IDOR (هر دو متد از همین استفاده می‌کنند). */
  private async findOwned(id: string) {
    const item = await this.deps.db.menuItem.findUnique({
      where: { id },
      select: { id: true, restaurantId: true, name: true },
    });
    if (!item || item.restaurantId !== this.deps.ctx.restaurantId) throw Err.notFound('آیتمِ منو');
    return item;
  }

  private async assertUniqueName(name: string, excludeId?: string) {
    const dup = await this.deps.db.menuItem.findFirst({
      where: { restaurantId: this.deps.ctx.restaurantId, name, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (dup) throw Err.validation('آیتمی با همین نام در منو هست');
  }

  protected async list() {
    const items = await this.deps.db.menuItem.findMany({
      where: { restaurantId: this.deps.ctx.restaurantId },
      orderBy: [{ category: 'asc' }, { soldCount: 'desc' }, { name: 'asc' }],
      select: { id: true, name: true, emoji: true, priceToman: true, isActive: true, soldCount: true, category: true },
    });
    return {
      items: items.map((m) => ({
        id: m.id, name: m.name, emoji: m.emoji, price_toman: m.priceToman,
        is_active: m.isActive, sold_count: m.soldCount, category: m.category,
      })),
    };
  }

  protected async create(data: MenuItemInput) {
    await this.assertUniqueName(data.name);
    const item = await this.deps.db.menuItem.create({
      data: {
        restaurantId: this.deps.ctx.restaurantId,
        name: data.name,
        priceToman: data.price_toman,
        emoji: data.emoji || null,
        category: data.category || null,
        isActive: data.is_active ?? true,
      },
      select: { id: true, name: true, priceToman: true, category: true, isActive: true },
    });
    return { id: item.id, name: item.name, price_toman: item.priceToman, category: item.category, is_active: item.isActive };
  }

  protected async update(id: string, data: Partial<MenuItemInput>) {
    await this.findOwned(id);
    if (data.name !== undefined) await this.assertUniqueName(data.name, id);

    const d: Record<string, unknown> = {};
    if (data.name !== undefined) d.name = data.name;
    if (data.price_toman !== undefined) d.priceToman = data.price_toman;
    if (data.emoji !== undefined) d.emoji = data.emoji;
    if (data.category !== undefined) d.category = data.category;
    if (data.is_active !== undefined) d.isActive = data.is_active;
    if (Object.keys(d).length === 0) throw Err.validation('چیزی برای تغییر فرستاده نشده');

    const updated = await this.deps.db.menuItem.update({
      where: { id },
      data: d,
      select: { id: true, name: true, priceToman: true, emoji: true, category: true, isActive: true },
    });
    return { id: updated.id, name: updated.name, price_toman: updated.priceToman, emoji: updated.emoji, category: updated.category, is_active: updated.isActive };
  }

  protected async delete(id: string) {
    const item = await this.findOwned(id);
    const usedInOrders = await this.deps.db.reservationItem.count({ where: { menuItemId: id } });

    if (usedInOrders > 0) {
      await this.deps.db.menuItem.update({ where: { id }, data: { isActive: false } });
      return {
        id, archived: true, used_in_orders: usedInOrders,
        message: `«${item.name}» در ${usedInOrders} پیش‌سفارشِ ثبت‌شده به‌کار رفته، پس برایِ حفظِ سابقه حذف نشد و فقط از منو برداشته شد (غیرفعال).`,
      };
    }

    await this.deps.db.menuItem.delete({ where: { id } });
    return { id, archived: false, message: 'آیتم از منو حذف شد.' };
  }
}