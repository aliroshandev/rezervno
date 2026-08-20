import { NextResponse } from 'next/server';
import { withRestaurantAuth } from '@/lib/with-restaurant-auth';
import { parseBody, z, zUuid } from '@/lib/schemas';
import { ASSISTANT_INTENTS } from '@/lib/assistant-nlu';
import { TeachAssistantUseCase } from '@/lib/usecases/assistant/assistant-use-case';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════
//  POST /restaurant/assistant/feedback — حلقه‌ی خودآموزی.
//  کارمند نیتِ درستِ یک سؤالِ قبلی را مشخص می‌کند (از چیپ‌های پیشنهاد،
//  وقتی دستیار مطمئن نبود) → واژگانِ همین رستوران آنی تقویت می‌شود.
//  از TeachAssistantUseCase (فاز ۳) می‌گذرد — route فقط ورودی می‌گیرد.
// ═══════════════════════════════════════════════════════════

const feedbackSchema = z.object({
  log_id: zUuid,
  correct_intent: z.enum(ASSISTANT_INTENTS),
});

export const POST = withRestaurantAuth({ rateLimit: 'search', permission: 'canViewAnalytics' }, async (req, ctx) => {
  const b = await parseBody(req, feedbackSchema);
  const result = await new TeachAssistantUseCase({
    db,
    ctx: { restaurantId: ctx.restaurant.id, staffId: ctx.auth.kind === 'staff' ? ctx.auth.sub : null },
  }).execute({ logId: b.log_id, correctIntent: b.correct_intent });
  return NextResponse.json(result);
});