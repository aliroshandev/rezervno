import { NextResponse } from 'next/server';
import { enforceRateLimit, clientIp, RULES } from '@/lib/ratelimit';
import { adminAuthFromRequest } from '@/lib/admin-auth';
import { errorResponse } from '@/lib/errors';
import { db } from '@/lib/db';
import { ModelHealthUseCase } from '@/lib/usecases/ai/model-health-use-case';

/**
 * GET /api/v1/admin/ai/model-health — سلامتِ تولیدیِ مدلِ no-show (پنلِ شرکت)
 *
 * خروجیِ «در عمل چقدر درست درآمد»، نه «موقعِ آموزش چقدر خوب بود»: joinِ
 * دفترِ پیش‌بینی و دفترِ نتیجه (migration 055) + طبقه‌بندیِ سلامت + کالیبراسیون.
 *
 * 🔐 امنیت: فقط مدیرِ پلتفرم (staffِ role=owner در tenantِ پلتفرم — JWTِ access)
 * دسترسی دارد؛ بدونِ آن 401/403، و اگر PLATFORM_ADMIN_TENANT_ID تنظیم نشده
 * باشد fail-closed یعنی همه رد می‌شوند (lib/admin-auth.ts). فردِ معمولیِ
 * رستوران نمی‌تواند نمایِ کلِ پلتفرم را ببیند.
 *
 * کوئری‌ها:
 *   restaurantId (اختیاری) — محدودکردنِ سنجش به یک رستوران + فراداده‌ی مدلش.
 *   sinceDays, limit — کران‌بندی (داخل fetchNoShowPairs سفت می‌شود).
 */
export async function GET(req: Request) {
  try {
    await enforceRateLimit(clientIp(req), RULES.search);
    const admin = adminAuthFromRequest(req);

    const url = new URL(req.url);
    const restaurantId = url.searchParams.get('restaurantId') ?? undefined;
    const sinceDays = url.searchParams.get('sinceDays') ? Number(url.searchParams.get('sinceDays')) : undefined;
    const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined;

    const uc = new ModelHealthUseCase({ ctx: { admin }, db, scope: 'model-health' });
    const result = await uc.execute({ restaurantId, sinceDays, limit });

    return NextResponse.json({
      scope: restaurantId ? 'restaurant' : 'platform',
      ...result,
    });
  } catch (e) { return errorResponse(e); }
}