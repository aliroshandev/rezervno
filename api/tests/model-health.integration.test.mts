import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET = 'a'.repeat(32);
process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);

// ═══════════════════════════════════════════════════════════════════════
//  سلامتِ تولیدیِ مدل no-show (فاز ۴) — تستِ integration زنده
//
//  مسیرِ واقعیِ management: GET /admin/ai/model-health پشتِ authِ مدیرِ
//  پلتفرم. ادعاهایِ حساس:
//   ۱) بدونِ توکن → رد (401).
//   ۲) مدیرِ پلتفرم (JWTِ role=owner در tenantِ پلتفرم) → 200 و نمایِ کلِ
//      پلتفرم (evaluation + scope=platform).
//   ۳) کارمندِ معمولی / صاحبِ رستورانِ غیرِپلتفرم → رد (403) — حتی باِِ
//      restaurantId هم به مدل‌هلثِ تولیدی راه ندارد (عایق‌بندیِ tenant).
//   ۴) اسکوپِ یک رستوران → restaurant + فراداده‌ی مدل برمی‌گردد.
// ═══════════════════════════════════════════════════════════════════════

const { db } = await import('../src/lib/db');
const { signAccess } = await import('../src/lib/jwt');
const route = await import('../src/app/api/v1/admin/ai/model-health/route');

const get = (token: string | null, search = '') =>
  new Request(`http://x/api/admin/ai/model-health${search}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

describe('admin/ai/model-health', () => {
  let platformTenant: string;
  let normalTenant: string;
  let adminToken: string;
  let foreignToken: string;
  let normalStaffToken: string;
  let restaurantId: string;
  let restaurantName: string;
  let normalRestaurant: string;

  before(async () => {
    const s = Date.now().toString(36);

    // ── تنتِ پلتفرم + مدیرِ صاحب (role=owner) ──
    const pt = await db.tenant.create({ data: { name: `[DEMO] platform-${s}` } });
    platformTenant = pt.id;
    process.env.PLATFORM_ADMIN_TENANT_ID = pt.id;
    const admin = await db.staff.create({
      data: { tenantId: pt.id, phone: `+9891${Math.floor(Math.random() * 100_000_000)}`.slice(0, 13), role: 'owner', isActive: true },
      select: { id: true },
    });
    adminToken = signAccess({ sub: admin.id, kind: 'staff', tenantId: pt.id, role: 'owner' });

    // ── تنتِ عادی + رستوران + صاحبِ غیرِپلتفرم و کارمندِ معمولی ──
    const nt = await db.tenant.create({ data: { name: `[DEMO] normal-${s}` } });
    normalTenant = nt.id;
    const r = await db.restaurant.create({
      data: { tenantId: nt.id, slug: `zz-mh-${s}`, name: `[DEMO] رستورانِ مدل-هلث ${s}`, clubPrefix: 'MHL' },
      select: { id: true, name: true },
    });
    restaurantId = r.id;
    restaurantName = r.name;
    normalRestaurant = r.id;

    const owner = await db.staff.create({
      data: { tenantId: nt.id, phone: `+9892${Math.floor(Math.random() * 100_000_000)}`.slice(0, 13), role: 'owner', isActive: true },
      select: { id: true },
    });
    foreignToken = signAccess({ sub: owner.id, kind: 'staff', tenantId: nt.id, role: 'owner' });

    const staff = await db.staff.create({
      data: { tenantId: nt.id, phone: `+9893${Math.floor(Math.random() * 100_000_000)}`.slice(0, 13), role: 'manager', isActive: true },
      select: { id: true },
    });
    normalStaffToken = signAccess({ sub: staff.id, kind: 'staff', tenantId: nt.id, role: 'manager' });
  });

  after(async () => {
    await db.modelTrainingRun.deleteMany({ where: { restaurantId } }).catch(() => {});
    await db.modelPrediction.deleteMany({ where: { restaurantId } }).catch(() => {});
    await db.modelOutcome.deleteMany({ where: { restaurantId } }).catch(() => {});
    await db.reservation.deleteMany({ where: { restaurantId } }).catch(() => {});
    await db.restaurantNoShowModel.deleteMany({ where: { restaurantId } }).catch(() => {});
    await db.restaurantDemandForecast.deleteMany({ where: { restaurantId } }).catch(() => {});
    await db.restaurant.deleteMany({ where: { id: restaurantId } }).catch(() => {});
    await db.staff.deleteMany({ where: { tenantId: { in: [platformTenant, normalTenant] } } }).catch(() => {});
    await db.tenant.deleteMany({ where: { id: { in: [platformTenant, normalTenant] } } }).catch(() => {});
    delete process.env.PLATFORM_ADMIN_TENANT_ID;
  });

  test('بدون توکن → 401', async () => {
    const res = await route.GET(get(null));
    assert.equal(res.status, 401);
  });

  test('مدیرِ پلتفرم → نمایِ کلِ پلتفرم (200، evaluation، scope=platform)', async () => {
    const res = await route.GET(get(adminToken));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.scope, 'platform');
    assert.equal(body.restaurant, null);
    assert.ok(body.evaluation, 'evaluation باید برگردد');
    assert.equal(body.evaluation.status, 'insufficient_data'); // هنوز جفتِ سنجشی نداریم
    assert.equal(body.evaluation.sampleSize, 0);
    assert.equal(body.model, null);
  });

  test('صاحبِ رستورانِ غیرِپلتفرم → 403 (عایقِ tenant)', async () => {
    const res = await route.GET(get(foreignToken, `?restaurantId=${normalRestaurant}`));
    assert.equal(res.status, 403);
  });

  test('کارمندِ معمولی (غیرِowner) → 403', async () => {
    const res = await route.GET(get(normalStaffToken));
    assert.equal(res.status, 403);
  });

  test('اسکوپِ یک رستوران → restaurant + فراداده‌ی مدل (منبعِ heuristic چون مدلِ فعالی نیست)', async () => {
    const res = await route.GET(get(adminToken, `?restaurantId=${normalRestaurant}`));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.scope, 'restaurant');
    assert.equal(body.restaurant.id, restaurantId);
    assert.equal(body.restaurant.name, restaurantName);
    assert.equal(body.evaluation.status, 'insufficient_data');
    // مدلی آموزش ندیده → از همان heuristicِ شفاف استفاده می‌شود (صادقانه)
    assert.equal(body.model.source, 'heuristic');
    assert.equal(body.latest_training_run, null);
  });
});