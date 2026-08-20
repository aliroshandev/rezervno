import { BaseUseCase, UseCaseDeps } from './base';
import { ApiError } from '../errors';
import type { PrismaClient } from '@prisma/client';

/**
 * نوعِ متادیتای CRUD که هر زیرکلاس مشخص می‌کند:
 *  - `model`       نام delegate پرایسما (مثلاً 'chatThread' — از typeof db).
 *  - `whereId`     فیلترِ یافتنِ یک رکورد با scoping صحیح tenant.
 *  - `tenantScope` فیلترِ اجبارِ جداسازیِ tenant برای لیست/یافتن.
 *  - `listInclude` (اختیاری) include/orderBy/select برای لیست.
 */
export interface CrudMeta<M extends keyof PrismaClient> {
  model: M;
  /** جایی که رکورد با id پیدا شود (همیشه شامل restaurantId/tenant). */
  whereId: (id: string) => Record<string, unknown>;
  /** فیلترِ scope برای عملیاتِ لیست. */
  tenantScope: () => Record<string, unknown>;
  /** فیلد مرتب‌سازیِ پیش‌فرضِ لیست. */
  orderBy: Record<string, unknown>;
  /** include/select اختیاریِ لیست. */
  listInclude?: Record<string, unknown>;
}

/**
 * BaseCrudUseCase — پیاده‌سازی متمرکزِ CRUD برای یک مدل.
 *
 * همه‌ی routeهای CRUD مسیر یکسان دارند: لیست با pagination، یک‌رکورد،
 * ساخت، ویرایش و حذف. این کلاس آن‌ها را یک‌بار می‌نویسد؛ هر دامنه فقط
 * `meta` و (در صورت نیاز) هوک‌های `beforeX` را می‌دهد. یعنی به‌جای ~۱۷۵ خط
 * در هر route، فقط چند خط meta + هوک (DRY).
 *
 * note: Prisma delegate‌ها به استاتیک بودنِ generic تکیه دارند؛ برای مدل‌های
 * بدون delegate (aggregate) از BaseUseCase خالص استفاده می‌شود.
 */
export abstract class BaseCrudUseCase<
  C,
  M extends keyof PrismaClient,
  TCreate,
  TUpdate,
  TListQuery extends { page?: number; limit?: number },
> extends BaseUseCase<C, { action: 'list'; query: TListQuery } | { action: 'get'; id: string } | { action: 'create'; data: TCreate } | { action: 'update'; id: string; data: TUpdate } | { action: 'delete'; id: string }, unknown> {
  protected abstract meta: CrudMeta<M>;

  constructor(deps: UseCaseDeps<C>) {
    super(deps);
  }

  protected async run(input: {
    action: 'list';
    query: TListQuery;
  } | { action: 'get'; id: string } | { action: 'create'; data: TCreate } | { action: 'update'; id: string; data: TUpdate } | { action: 'delete'; id: string }): Promise<unknown> {
    switch (input.action) {
      case 'list':
        return this.list(input.query);
      case 'get':
        return this.get(input.id);
      case 'create':
        return this.create(input.data);
      case 'update':
        return this.update(input.id, input.data);
      case 'delete':
        return this.delete(input.id);
    }
  }

  protected async beforeCreate(_data: TCreate): Promise<TCreate> { return _data; }
  protected async beforeUpdate(_id: string, _data: TUpdate): Promise<TUpdate> { return _data; }
  protected async beforeDelete(_id: string): Promise<void> { return; }

  protected get db(): PrismaClient {
    return this.deps.db;
  }

  protected async list(query: TListQuery): Promise<unknown> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const where = this.meta.tenantScope();
    const delegate = this.db[this.meta.model] as unknown as {
      count: (a: { where: Record<string, unknown> }) => Promise<number>;
      findMany: (a: Record<string, unknown>) => Promise<unknown[]>;
    };
    const [total, items] = await Promise.all([
      delegate.count({ where }),
      delegate.findMany({ where, orderBy: this.meta.orderBy, take: limit, skip: (page - 1) * limit, ...(this.meta.listInclude ?? {}) }),
    ]);
    return { items, total, page, limit };
  }

  protected async get(id: string): Promise<unknown> {
    const delegate = this.db[this.meta.model] as unknown as { findFirst: (a: { where: Record<string, unknown> }) => Promise<unknown | null> };
    const row = await delegate.findFirst({ where: this.meta.whereId(id) });
    if (!row) throw new ApiError('NOT_FOUND', 'منبع پیدا نشد', 404);
    return row;
  }

  protected async create(data: TCreate): Promise<unknown> {
    const prepared = await this.beforeCreate(data);
    const delegate = this.db[this.meta.model] as unknown as { create: (a: { data: unknown }) => Promise<unknown> };
    return delegate.create({ data: prepared });
  }

  protected async update(id: string, data: TUpdate): Promise<unknown> {
    await this.get(id); // موجودیت + scop بودن را تضمین می‌کند
    const prepared = await this.beforeUpdate(id, data);
    const delegate = this.db[this.meta.model] as unknown as { update: (a: { where: { id: string }; data: unknown }) => Promise<unknown> };
    return delegate.update({ where: { id }, data: prepared });
  }

  protected async delete(id: string): Promise<{ ok: boolean }> {
    await this.get(id);
    await this.beforeDelete(id);
    const delegate = this.db[this.meta.model] as unknown as { delete: (a: { where: { id: string } }) => Promise<unknown> };
    await delegate.delete({ where: { id } });
    return { ok: true };
  }
}