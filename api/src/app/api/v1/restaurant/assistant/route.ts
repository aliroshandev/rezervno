import { NextResponse } from 'next/server';
import { withRestaurantAuth } from '@/lib/with-restaurant-auth';
import { parseBody, z } from '@/lib/schemas';
import { getAssistantStats } from '@/lib/assistant';
import { AskAssistantUseCase } from '@/lib/usecases/assistant/assistant-use-case';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════
//  GET  /restaurant/assistant  — آمارِ شفافیت (چند سؤال، چقدر یاد گرفته)
//  POST /restaurant/assistant  — پرسیدنِ یک سؤالِ آزادمتنِ فارسی
//
//  کاملاً آفلاین: هیچ فراخوانیِ AI/LLM بیرونی نیست. طبقه‌بندی و پاسخ از
//  lib/assistant.ts (Naive Bayesِ دستی + دادهٔ واقعیِ همین رستوران).
//  POST از AskAssistantUseCase (فاز ۳) می‌گذرد — route فقط ورودی می‌گیرد.
// ═══════════════════════════════════════════════════════════

const askSchema = z.object({
  message: z.string().min(1).max(500),
});

export const GET = withRestaurantAuth({ permission: 'canViewAnalytics' }, async (_req, ctx): Promise<NextResponse> => {
  const stats = await getAssistantStats(ctx.restaurant.id);
  return NextResponse.json(stats);
});

export const POST = withRestaurantAuth({ rateLimit: 'search', permission: 'canViewAnalytics' }, async (req, ctx) => {
  const b = await parseBody(req, askSchema);
  const result = await new AskAssistantUseCase({
    db,
    ctx: { restaurantId: ctx.restaurant.id, staffId: ctx.auth.kind === 'staff' ? ctx.auth.sub : null },
  }).execute({ question: b.message });
  return NextResponse.json(result);
});
