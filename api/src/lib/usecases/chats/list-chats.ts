import { BaseCrudUseCase, type CrudMeta } from '../base-crud';
import type { PrismaClient } from '@prisma/client';

type ChatListQuery = { filter?: 'unread' | 'all'; limit?: number };

type Deps = { db: PrismaClient; ctx: { restaurantId: string } };

/**
 * ListChatsUseCase — لیست گفتگوهای رستوران روی پایه‌ی CRUD.
 *
 * با BaseCrudUseCase فقط meta مشخص می‌شود: مدل، scopingِ tenant، ترتیب و
 * includeها. کلِ منطق list (با سقفِ limit و تضمینِ جداسازیِ tenant) از
 * کلاس پایه ارث می‌رود — یعنی همین «یک بار نوشتن» است، نه تکرار per-route.
 */
export class ListChatsUseCase extends BaseCrudUseCase<
  { restaurantId: string },
  'chatThread',
  never,
  never,
  ChatListQuery
> {
  protected meta: CrudMeta<'chatThread'> = {
    model: 'chatThread',
    whereId: (id: string) => ({ id, restaurantId: this.deps.ctx.restaurantId }),
    tenantScope: () => ({ restaurantId: this.deps.ctx.restaurantId }),
    orderBy: { lastMessageAt: 'desc' },
    listInclude: {
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
        reservation: { select: { code: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, sender: true, createdAt: true } },
      },
    },
  };

  constructor(deps: Deps) {
    super(deps);
  }

  protected override async list(_query: ChatListQuery): Promise<unknown> {
    const query = _query ?? {};
    const limit = Math.min(100, Math.max(1, query.limit ?? 50));
    const where: Record<string, unknown> = { restaurantId: this.deps.ctx.restaurantId };
    if (query.filter === 'unread') where.unreadForStaff = { gt: 0 };

    const delegate = this.db.chatThread as unknown as {
      findMany: (a: Record<string, unknown>) => Promise<any[]>;
      count: (a: { where: Record<string, unknown> }) => Promise<number>;
    };
    const [threads, unreadTotal] = await Promise.all([
      delegate.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, phone: true } },
          reservation: { select: { code: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, sender: true, createdAt: true } },
        },
      }),
      delegate.count({ where: { restaurantId: this.deps.ctx.restaurantId, unreadForStaff: { gt: 0 } } }),
    ]);

    return {
      unread_threads: unreadTotal,
      items: threads.map((t) => ({
        id: t.id,
        customer: {
          name: [t.user.firstName, t.user.lastName].filter(Boolean).join(' ') || 'مهمان',
          phone: t.user.phone,
        },
        reservation_code: t.reservation?.code ?? null,
        unread: t.unreadForStaff,
        last_message: t.messages[0]
          ? { body: t.messages[0].body, sender: t.messages[0].sender, created_at: t.messages[0].createdAt }
          : null,
        last_message_at: t.lastMessageAt,
      })),
    };
  }
}