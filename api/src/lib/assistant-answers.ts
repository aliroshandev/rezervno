import { Prisma } from '@prisma/client';
import { db } from './db';
import { ACTIVE_RESERVATION_STATUSES, DEMAND_STATUSES_SQL } from './reservation-status';
import type { AssistantIntent } from './assistant-nlu';
import { getWeekdayRanking, rankUtilization, type DowRankingRow, type TableUtilization } from './restaurant-manager';
import { getDemandForecast } from './demand-forecast';

// ⚠️ DEMAND_STATUSES_SQL با Prisma.raw درج می‌شود (نه interpolationِ پیش‌فرضِ
// پارامتریِ تگ‌تمپلیت) — همان قراردادِ restaurant-manager.ts: یک ثابتِ کدیِ
// امن است، نه ورودیِ کاربر، پس ابطالِ quote لازم نیست.
const STATUSES_RAW = Prisma.raw(DEMAND_STATUSES_SQL);

// ═══════════════════════════════════════════════════════════════════════
//  تولیدِ پاسخِ فارسی برای هر نیتِ دستیار — از داده‌ی واقعیِ همین رستوران،
//  نه یک متنِ ثابت یا عددِ حدسی. هرجا داده کافی نبود، همین صادقانه گفته
//  می‌شود («هنوز داده‌ی کافی نداریم») نه یک عددِ ساختگی.
//
//  جایی که منطقِ محاسبه از قبل وجود داشت با همین lib استفاده می‌شود —
//  نه دو کپیِ جدا از همان کوئری (getWeekdayRanking، rankUtilization و
//  getDemandForecast / getActiveNoShowModel از پلتفرمِ هوشِ فاز ۴).
// ═══════════════════════════════════════════════════════════════════════

function fmt(n: number): string { return n.toLocaleString('fa-IR'); }

function dayRange(offsetDays: number): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offsetDays);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

async function answerReservationsForDay(restaurantId: string, offsetDays: number, label: string): Promise<string> {
  const { start, end } = dayRange(offsetDays);
  const count = await db.reservation.count({
    where: { restaurantId, status: { in: ACTIVE_RESERVATION_STATUSES as any }, slotStart: { gte: start, lt: end } },
  });
  if (count === 0) return `برای ${label} فعلاً هیچ رزروِ فعالی ثبت نشده.`;
  return `${label} ${fmt(count)} رزروِ فعال دارید.`;
}

const DAY_NAMES_FA = ['یکشنبه', 'دوشنبه', 'سه‍شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

// ── سه پاسخِ مدیریتیِ فاز ۴: بدونِ حدس، از داده/مدلِ واقعیِ همین رستوران ──

/** رتبه‌بندیِ واقعیِ ۷ روزِ هفته (از lib/restaurant-manager — یک کوئری، نه دوباره‌کاری). */
async function weekdayRanking(restaurantId: string): Promise<DowRankingRow[] | null> {
  return getWeekdayRanking(restaurantId);
}

async function answerBusiestDay(restaurantId: string): Promise<string> {
  const sorted = await weekdayRanking(restaurantId);
  if (!sorted) return 'هنوز داده‌ی کافی (حداقل ۵ روزِ پررزرو در ۶۰ روزِ اخیر) برای رتبه‌بندیِ روزهای هفته نداریم.';
  const strongest = sorted[0];
  return `${DAY_NAMES_FA[strongest.dow]} پرترددترین روزِ هفته‌ی شماست — در ۶۰ روزِ اخیر ${fmt(strongest.count)} رزروِ فعال ثبت کرده.`;
}

async function answerSlowDay(restaurantId: string): Promise<string> {
  const sorted = await weekdayRanking(restaurantId);
  if (!sorted) return 'هنوز داده‌ی کافی برای رتبه‌بندیِ روزهای هفته نداریم.';
  const weakest = sorted[sorted.length - 1];
  return `${DAY_NAMES_FA[weakest.dow]} کم‌تقاضاترین روزِ هفته‌ی شماست (${fmt(weakest.count)} رزرو در ۶۰ روز) — کوپنِ اختصاصی یا تبلیغِ همان روز می‌تواند ترافیک را جابه‌جا کند.`;
}

async function answerAtRiskCustomers(restaurantId: string): Promise<string> {
  const [atRisk, total] = await Promise.all([
    db.customerInsight.count({ where: { restaurantId, segment: 'at_risk' } }),
    db.customerInsight.count({ where: { restaurantId } }),
  ]);
  if (total < 10) return 'هنوز کوهورتِ مشتریِ فعالِ کافی برای سگمنت‌بندیِ ریسکِ ریزش نداریم.';
  if (atRisk === 0) return 'فعلاً هیچ مشتری‌ای در آستانه‌ی ریزش نیست.';
  const pct = Math.round((atRisk / total) * 100);
  return `${fmt(atRisk)} مشتری (${pct}٪ از کوهورتِ فعال) بیش از حدِ معمول غیبت کرده‌اند و در آستانه‌ی ریزش‌اند — یک کمپینِ Win-back با کدِ تخفیف برایِ همین سگمنت امتحان کنید.`;
}

async function answerUnderusedTables(restaurantId: string): Promise<string> {
  const rows = await db.$queryRaw<{ number: number; name: string | null; cnt: bigint }[]>`
    SELECT t.number, t.name, COUNT(r.id)::bigint AS cnt
    FROM tables t
    LEFT JOIN reservations r ON r.table_id = t.id
      AND r.status IN (${STATUSES_RAW}) AND r.slot_start >= CURRENT_DATE - 30
    WHERE t.restaurant_id = ${restaurantId}::uuid AND t.is_active = true
    GROUP BY t.number, t.name
  `;
  if (rows.length < 4) return 'هنوز میزِ کافی (حداقل ۴) برای مقایسه‌ی نسبیِ استفاده نداریم.';
  if (rows.every((r) => Number(r.cnt) === 0)) return 'در ۳۰ روزِ اخیر هیچ رزروی برای مقایسه‌ی استفاده‌ی میزها ثبت نشده.';
  const ranked = rankUtilization(rows.map((r) => ({ number: r.number, name: r.name, bookings_count: Number(r.cnt) })));
  const underused = ranked.filter((t) => t.underutilized);
  if (underused.length === 0) return 'فعلاً میزی به‌وضوح کم‌استفاده نداریم — همه در محدوده‌ی طبیعیِ میانگینِ خودِ رستوران‌اند.';
  const label = (t: TableUtilization) => t.name || `میزِ ${fmt(t.number)}`;
  return `${underused.length} میز به‌وضوح کمتر از بقیه رزرو می‌شوند: ${underused.slice(0, 3).map(label).join('، ')} — وضعیتِ فیزیکی/اولویتِ تخصیص‌شان را بررسی کنید.`;
}

async function answerDemandTomorrow(restaurantId: string): Promise<string> {
  const f = await getDemandForecast(restaurantId, 1);
  if (!f) return 'هنوز تاریخچه‌ی کافی برای آموزشِ پیش‌بینیِ تقاضا نداریم — بعد از چند هفتهِ داده، فردا را پیش‌بینی می‌کنم.';
  const resv = f.reservations.points[0];
  const covers = f.covers.points[0];
  const src = f.reservations.source === 'learned' ? 'با مدلِ یادگرفته‌ی Holt-Winters' : 'با الگویِ ساده‌ی هفتگی (مدلِ یادگرفته هنوز فعال نشده)';
  return `پیش‌بینیِ ما برای فردا ${fmt(Math.round(resv.predicted))} رزرو و حدود ${fmt(Math.round(covers.predicted))} نفر (کاور) است — ${src}.`;
}

async function answerNoShowModelStatus(restaurantId: string): Promise<string> {
  const [model, recentRun] = await Promise.all([
    db.restaurantNoShowModel.findUnique({ where: { restaurantId } }),
    db.modelTrainingRun.findFirst({ where: { restaurantId, kind: 'no_show' }, orderBy: { trainedAt: 'desc' } }),
  ]);
  if (!model && !recentRun) return 'هنوز آموزشِ شبانه‌ی مدلِ no-show انجام نشده — فعلاً از امتیازِ heuristicِ شفاف استفاده می‌کنیم.';
  if (!model) return 'مدلِ no-show هنوز داده‌ی کافی برای آموزشِ معنادار ندارد؛ فعلاً از heuristic استفاده می‌کنیم.';
  const trained = model.trainedAt.toLocaleDateString('fa-IR');
  if (!model.isActive) {
    return `مدلِ no-show روی ${fmt(model.sampleSize)} رزرویِ تاریخی آموزش دیده (${trained}) ولی هنوز جایگزینِ heuristic نشده` +
      ` — Brierِ آن (${model.learnedBrier.toFixed(3)}) از heuristic (${model.staticBrier.toFixed(3)}) بهتر نبوده.`;
  }
  return `مدلِ no-show فعال است: روی ${fmt(model.sampleSize)} رزروِ تاریخی آموزش دیده (${trained}) و` +
    ` ${((model.learnedBrier / model.staticBrier - 1) * 100).toFixed(0)}٪ از heuristic دقیق‌تر است.`;
}

async function answerVipCustomers(restaurantId: string): Promise<string> {
  const vipCount = await db.customerInsight.count({ where: { restaurantId, isVip: true } });
  if (vipCount === 0) return 'فعلاً هیچ مشتری‌ای به سطحِ VIP نرسیده.';
  return `${fmt(vipCount)} مشتریِ VIP دارید. از تبِ «مشتریان» می‌توانید لیستِ کاملشان را ببینید.`;
}

async function answerWaitlistNow(restaurantId: string): Promise<string> {
  const count = await db.waitlistEntry.count({ where: { restaurantId, status: 'waiting' } });
  if (count === 0) return 'الان کسی در لیستِ انتظار نیست.';
  return `الان ${fmt(count)} نفر در لیستِ انتظار هستند.`;
}

async function answerTablesNow(restaurantId: string): Promise<string> {
  const rows = await db.table.groupBy({
    by: ['state'],
    where: { restaurantId, isActive: true },
    _count: { _all: true },
  });
  const total = rows.reduce((s, r) => s + r._count._all, 0);
  if (total === 0) return 'هنوز میزی برای این رستوران ثبت نشده.';
  const byState = Object.fromEntries(rows.map((r) => [r.state, r._count._all]));
  const free = byState.free ?? 0;
  const occupied = byState.occupied ?? 0;
  return `از ${fmt(total)} میزِ فعال، الان ${fmt(free)} میز آزاد و ${fmt(occupied)} میز اشغال است.`;
}

async function answerUpcomingHighRisk(restaurantId: string): Promise<string> {
  const count = await db.reservation.count({
    where: {
      restaurantId,
      status: { in: ['confirmed', 'auto_confirmed', 'pending'] },
      slotStart: { gte: new Date(), lte: new Date(Date.now() + 48 * 3600_000) },
      noShowRiskTier: 'high',
    },
  });
  if (count === 0) return 'در ۴۸ ساعتِ آینده رزروِ پرریسکی (احتمالِ بالای no-show) نداریم.';
  return `${fmt(count)} رزرو در ۴۸ ساعتِ آینده ریسکِ نیامدنِ بالایی دارند. یادآوریِ SMS اضافه یا درخواستِ بیعانه می‌تواند کمک کند.`;
}

function answerGreeting(): string {
  return 'سلام! من دستیارِ هوشمندِ رستورانتون هستم — کاملاً آفلاین کار می‌کنم و از داده‌ی واقعیِ خودِ رستوران جواب می‌دم. یه سؤال درباره‌ی رزروها، مشتری‌ها، میزها یا لیستِ انتظار بپرس.';
}

function answerHelp(exampleQuestions: string[]): string {
  return `می‌تونم به این‌جور سؤال‌ها جواب بدم:\n${exampleQuestions.map((q) => `• ${q}`).join('\n')}\nهرچی بیشتر ازم بپرسی و جوابِ اشتباه رو اصلاح کنی، بهتر یاد می‌گیرم.`;
}

/** تولیدِ متنِ پاسخِ فارسی برای یک نیتِ مشخص. exampleQuestions فقط برایِ help لازم است. */
export async function generateAnswer(
  intent: AssistantIntent,
  restaurantId: string,
  exampleQuestions: string[] = [],
): Promise<string> {
  switch (intent) {
    case 'greeting': return answerGreeting();
    case 'help': return answerHelp(exampleQuestions);
    case 'reservations_today': return answerReservationsForDay(restaurantId, 0, 'امروز');
    case 'reservations_tomorrow': return answerReservationsForDay(restaurantId, 1, 'فردا');
    case 'busiest_day': return answerBusiestDay(restaurantId);
    case 'slow_day': return answerSlowDay(restaurantId);
    case 'at_risk_customers': return answerAtRiskCustomers(restaurantId);
    case 'vip_customers': return answerVipCustomers(restaurantId);
    case 'underused_tables': return answerUnderusedTables(restaurantId);
    case 'waitlist_now': return answerWaitlistNow(restaurantId);
    case 'tables_now': return answerTablesNow(restaurantId);
    case 'upcoming_high_risk': return answerUpcomingHighRisk(restaurantId);
    case 'demand_tomorrow': return answerDemandTomorrow(restaurantId);
    case 'no_show_model_status': return answerNoShowModelStatus(restaurantId);
    default: {
      const _exhaustive: never = intent;
      return _exhaustive;
    }
  }
}
