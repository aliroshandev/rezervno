import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET = 'a'.repeat(32);
process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);

// ═══════════════════════════════════════════════════════════════════════
//  دستیارِ هوشمند رستوران — تستِ integration زنده رویِ Postgresِ واقعی
//
//  چرخه‌ی کاملِ حلقه‌ی خودآموزی را می‌زند، آن هم از طریقِ روت‌هایِ واقعی
//  (نه فقط lib): پرسیدنِ سؤال → ثبتِ log → اصلاحِ نیت (feedback) →
//  یادگیریِ واژگان → آمارِ شفافیت. دو ادعایِ حساس:
//   ۱) جداسازیِ تنانت: کارمندِ رستورانِ B نمی‌تواند سؤالِ A را اصلاح کند (IDOR).
//   ۲) یادگیری واقعاً در DB ذخیره می‌شود (learned_words > 0) — نه فقط در حافظه.
// ═══════════════════════════════════════════════════════════════════════

const { db } = await import('../src/lib/db');
const { redis } = await import('../src/lib/redis');
const { signAccess } = await import('../src/lib/jwt');
const assistantRoute = await import('../src/app/api/v1/restaurant/assistant/route');
const feedbackRoute = await import('../src/app/api/v1/restaurant/assistant/feedback/route');

const json = (token: string, body?: unknown, method = 'POST') =>
  new Request('http://x/api', {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

async function makeTenantWithOwner(label: string) {
  const t = await db.tenant.create({ data: { name: `[DEMO] ${label}` }, select: { id: true } });
  const r = await db.restaurant.create({
    data: {
      tenantId: t.id, slug: `zz-asst-${label}`, name: `[DEMO] ${label}`, clubPrefix: 'AST',
      tables: { create: [{ number: 1, capacity: 4 }] },
    },
    select: { id: true },
  });
  const staff = await db.staff.create({
    data: { tenantId: t.id, phone: `+9891${Math.floor(Math.random() * 100_000_000)}`.slice(0, 13), role: 'owner', isActive: true },
    select: { id: true },
  });
  const token = signAccess({ sub: staff.id, kind: 'staff', tenantId: t.id, role: 'owner' });
  return { tenantId: t.id, restaurantId: r.id, staffId: staff.id, token };
}

describe('دستیارِ هوشمند رستوران', () => {
  let tenantA: string, tenantB: string;
  let restA: string, restB: string;
  let tokenA: string, tokenB: string;

  before(async () => {
    const stale = await redis.keys('*auth*');
    if (stale.length) await redis.del(...stale);

    const s = Date.now().toString(36);
    const a = await makeTenantWithOwner(`asst-a-${s}`);
    const b = await makeTenantWithOwner(`asst-b-${s}`);
    tenantA = a.tenantId; restA = a.restaurantId; tokenA = a.token;
    tenantB = b.tenantId; restB = b.restaurantId; tokenB = b.token;
  });

  after(async () => {
    const rests = [restA, restB];
    await db.restaurantAssistantLog.deleteMany({ where: { restaurantId: { in: rests } } });
    await db.restaurantAssistantVocab.deleteMany({ where: { restaurantId: { in: rests } } });
    await db.table.deleteMany({ where: { restaurantId: { in: rests } } });
    await db.restaurant.deleteMany({ where: { id: { in: rests } } });
    await db.staff.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await db.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB] } } });
  });

  test('GET — آمارِ اولیه صفر است', async () => {
    const res = await assistantRoute.GET(json(tokenA, undefined, 'GET'));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.total_questions, 0);
    assert.equal(body.corrected_count, 0);
    assert.ok(body.example_questions.length > 0, 'راهنما باید جمله‌ی نمونه داشته باشد');
  });

  test('POST — سؤالِ واضحِ «امروز چند رزرو داریم» فهمیده و لاگ می‌شود', async () => {
    const res = await assistantRoute.POST(json(tokenA, { message: 'امروز چند رزرو داریم' }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.understood, true, 'سؤالِ seed باید فهمیده شود');
    assert.equal(body.intent, 'reservations_today');
    assert.ok(body.log_id);
    const log = await db.restaurantAssistantLog.findUnique({ where: { id: body.log_id } });
    assert.ok(log, 'لاگ باید در DB ثبت شود');
    assert.equal(log.restaurantId, restA);
  });

  test('POST — سؤالِ نامفهوم پیشنهاد می‌دهد، نه ادعای کاذب', async () => {
    const res = await assistantRoute.POST(json(tokenA, { message: 'بلاهذقثقوایکس' }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.understood, false);
    assert.ok(body.suggestions.length > 0, 'در عدم‌اطمینان باید چیپِ پیشنهاد داده شود');
  });

  test('Feedback — اصلاحِ نیت، واژگان را یاد می‌گیرد و آمار را بالا می‌برد', async () => {
    const ask = await (await assistantRoute.POST(json(tokenA, { message: 'رزروی فردا چندتاست' }))).json();
    // اصلاحِ دستی به نیتِ درست — حتی اگر طبقه‌بند مطمئن بود
    const res = await feedbackRoute.POST(json(tokenA, { log_id: ask.log_id, correct_intent: 'reservations_tomorrow' }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.intent, 'reservations_tomorrow');

    const vocab = await db.restaurantAssistantVocab.findMany({ where: { restaurantId: restA } });
    assert.ok(vocab.length > 0, 'یادگیری باید در DB ذخیره شود (learned_words > 0)');
    const stats = await (await assistantRoute.GET(json(tokenA, undefined, 'GET'))).json();
    assert.equal(stats.corrected_count, 1);
    assert.equal(stats.learned_words, vocab.length);
  });

  test('IDOR — تنانتِ B نمی‌تواند سؤالِ A را اصلاح کند (۴۰۴ بدونِ افشا)', async () => {
    const ask = await (await assistantRoute.POST(json(tokenA, { message: 'الف' }))).json();
    const res = await feedbackRoute.POST(json(tokenB, { log_id: ask.log_id, correct_intent: 'greeting' }));
    assert.equal(res.status, 404, 'باید «یافت نشد» بدهد — نه ۲۰۰ و نه افشایِ وجودِ id');
  });

  test('Feedback — نیتِ نامعتبر ۴۲۲ می‌دهد', async () => {
    const ask = await (await assistantRoute.POST(json(tokenA, { message: 'الف' }))).json();
    const res = await feedbackRoute.POST(json(tokenA, { log_id: ask.log_id, correct_intent: 'not_a_real_intent' }));
    assert.equal(res.status, 422);
  });
});