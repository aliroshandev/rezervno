# REZV Migration Roadmap — قطب‌نماى مهاجرت به ریپوی جدید

> هدف: ادغامِ تمام فیچرهای پراکنده به یک ریپوی واحد (`Rezv`) به صورت **فازبندی‌شده** —
> هر فاز یک **نسخه‌ی قابل اجرا** با **docker** است و تمامِ منطقِ تکراری با **کلاس‌های پایه (Base UseCase)** DRY می‌شود.
> بردار کپی کار: `git remote set-url origin https://github.com/ardalanazimian/Rezv.git`
> تاریخ: ۲۰۲۶-۰۸-۲۰

---

## ۱. نقشه‌ی تفاوت‌ها با `main`

همه‌ی کارهایی که هنوز روی `main` نداریم (برنچ‌های فیچری که باید ادغام شوند):

| # | برنچِ منبع | چیست | حجم | وضعیت |
|---|-----------|------|-----|-------|
| 1 | `feat/restaurant-assistant` | چت‌باتِ آفلاینِ فارسی (دستیارِ هوشمند رستوران) | ~۹۵۰ خط | ادغام‌نشده |
| 2 | `feat/menu-crud` | CRUD کامل منو + دسته‌بندی + صفحه‌ی مدیریت پنل بیزنس | ~۵۶۰ خط | ادغام‌نشده |
| 3 | `claude/rezervno-intelligence-platform-w7wcty` | پلتفرم هوش: prediction-ledger, model-evaluation, مدل no-show | ~۱۸۰۰ خط | ادغام‌نشده |
| 4 | `claude/rezv-ai-agency-os-bvk4e8` | رفع امنیتی: کشِ idempotency فقط به scope+کاربر بسته شود | کوچک | ادغام‌نشده |
| 5 | `fix/launch-demo-sms-reviews` | بازهای ریسک/رفع‌های SMS و reservation | ۱۶ کامیت | ادغام‌نشده |
| 6 | `initialize` (برنچ فعلی) | فیکس‌های کانفیگ: next.config لوکال، docker-compose.local، seed دمو | ~۹۳ خط | ✅ روی کار |
| 7 | `claude/business-customer-company-landing-seo-k58ffs` | دستیار چت برای پنل بیزنس + لندینگ | نسخه‌ی قبلیِ #1 | هم‌زمان با #1 |

> برنچ‌های `0` کامیت اضافه نسبت به main (مثل ai-customer-intelligence، booking-integrity-hardening و …)
> یا قبلاً merged هستند یا فاقد تغییر اند؛ در مهاجرت لحاظ نمی‌شوند.

---

## ۲. معماری هدف — DRY با کلاس‌های پایه

الگوی یکنواختی که همه‌ی use-caseها از آن ارث می‌برند (در `api/src/lib/usecases/base.ts`):

```text
lib/usecases/
  base.ts            ← BaseUseCase<TInput, TOutput> (اجرای متمرکز + خطا + لاگ + متریک)
  base-crud.ts       ← BaseCrudUseCase<Model>  (create / list / get / update / delete — یک‌بار نوشته می‌شود)
  base-query.ts      ← BaseQueryUseCase<TInput, TOutput> (برای کوئری/تحلیل)
  helpers.ts         ← اشتراکِ pagination / validation / tenant-scope
```

قراردادها:
- هر route فقط: ورودی‌گیری (zod) → `new UseCase(deps).execute(input)` → پاسخ.
- نوع‌ها (`TInput`/`TOutput`) با زُد infer می‌شوند؛ لوکال‌های تکرارشونده در `helpers.ts`.
- تزریقِ وابستگی (prisma, redis, logger, context) از طریق constructor — تست‌پذیر و DRY.
- همه‌ی use caseها لاگ/متریک/تراکنش را از base ارث می‌برند؛ هیچ route مستقیم به `db` نمی‌زند.

---

## ۳. فازبندی (هر فاز = نسخه‌ی قابل اجرا)

### فاز ۰ — زیرساختِ پایه و داکرِ اجرایی (MVP فقط پنل بیزینس)
**هدف:** MVP باید روی سرور بالا بیاید و **فقط پنلِ کسب‌وکار** (ثبت داده توسط کارکنان رستوران) را سرو کند.
همه‌چیز داخل داکر: `postgres + redis + api + nginx` (و بکاپ + cron).

**تمیزکاری نیمه‌کاره‌ها (انجام شد):**
- [x] `api/next-env.d.ts` برگشت به `.next/types` (نسخه‌ی main) — چون نسخه‌ی dev در build/CI می‌شکند
- [x] `apps/landing/app/globals.css` سلکتور دنگلِ cursor حذف شد (CSS معتبر شد)
- [x] `docker-compose.local.yml` با `name: rezervno-local` جدا شد (تداخل نام کانتینر با prod رفع شد)
- [x] فایل‌های `AGENTS.md`/`CLAUDE.md` نگه داشته شدند (برای برنچ عمومی لازم‌اند)

**اجرای سرور (MVP):**
- [x] `deploy/nginx/nginx.mvp.conf` — فقط پنل بیزینس در ریشه (/) + پراکسی `/api/` + تمام سخت‌گیری‌های امنیتی
- [x] `docker-compose.mvp.yml` — override که فقط `apps/business` را mount می‌کند و `ALLOWED_ORIGINS` را اجباری می‌کند
- [ ] `cd api && npx tsc --noEmit && npm run lint && npm test` → هر سه پاک (روی داکر postgres/redis)
- [ ] `docker compose -f docker-compose.yml -f docker-compose.mvp.yml up -d --build`
- [ ] `sh tools/sync-design-system.sh --check` → صفر مغایرت

**خروجی قابل اجرا:** `curl http://localhost/healthz` → ok و `curl http://localhost/api/v1/health` پاسخ OK.

### فاز ۱ — پایه‌ی UseCase ها + بازنویسی یک حوزه‌ی نمونه
**هدف:** DRY شدن ساختار پیش از import فیچرها؛ ثابت شدن الگو با یک حوزه‌ی کم‌ریسک (chats).
- [ ] ایجاد `api/src/lib/usecases/base.ts` + `base-crud.ts` + `helpers.ts`
- [ ] یک zod-validator و یک `pagination` در `helpers.ts`
- [ ] بازنویسی `api/src/app/api/v1/restaurant/chats/route.ts` روی `BaseCrudUseCase`
- [ ] تست واحد جدید (`tests/usecases/base.test.mts`) + تستِ قدیمی chats سبز بماند
- [ ] PUSH قطعی: `git push origin feature/phase-1-usecase-base` → PR → CI سبز

**خروجی قابل اجرا:** chats اینباکس همان پاسخِ قبلی را می‌دهد ولی از base می‌گذرد.

### فاز ۲ — ادغامِ منو (Menu CRUD) روی الگوی پایه
**هدف:** اولین فیچرِ بزرگِ واقعی روی UseCase base.
- [ ] Cherry-pick/merge `feat/menu-crud` (schema + sql/047 → marge شود)
- [ ] تبدیل `menu/route.ts` و `menu/[id]/route.ts` به `BaseCrudUseCase<MenuItem>`
- [ ] پیش‌بینی: کد route از ~۱۷۵ خط به <۳۰ خط می‌رسد (نشانِ DRY)
- [ ] انتقال `apps/business/js/menu.js` به پنل (رابطه‌ی روتینگ بررسی شود)
- [ ] تست‌های `menu-crud.integration.test.mts` روی PostgreSQL واقعی
- [ ] PUSH قطعی: PR سبز روی CI

**خروجی قابل اجرا:** افزودن/لیست/حذف منو از پنل بیزنس در داکر کار می‌کند.

### فاز ۳ — دستیار هوشمند رستوران (helper chat agent)
**هدف:** چت‌بات آفلاین فارسی به‌عنوان اولین «Agent» — کاملاً آفلاین، بدون AI بیرونی.
- [x] Merge `feat/restaurant-assistant` (schema + sql/050)
  - `schema.prisma`: مدل‌های `RestaurantAssistantVocab` + `RestaurantAssistantLog` + روابطِ Restaurant
  - `api/prisma/sql/050-restaurant-assistant.sql` (idempotent + RLS) روی DB داکر اعمال شد
  - `lib/assistant-nlu.ts` (Naive Bayes خالص)، `lib/assistant.ts` (ارکستراسیون + خودآموزی)، `lib/assistant-answers.ts`
  - روت‌ها: `restaurant/assistant` (GET stats / POST ask) + `restaurant/assistant/feedback` (POST teach)
- [x] حلقه‌ی خودآموزی روی DB واقعی قفل شد: `tests/assistant.integration.test.mts` (IDOR + یادگیری + آمار)
- [x] پنل بیزنس: `apps/business/js/assistant.js` + متدهای `API.assistantAsk/assistantFeedback` در `data.js` + اتصال به تب «دستیار AI» در `crm.js` + لودِ اسکریپت در `index.html`
- [x] تست‌های `assistant-nlu.test.mts` سبز (۱۳ تست)
- [x] بازبینی: پاسخ‌ها فقط داده‌ی واقعی/صادقانه؛ هیچ ادعای AI بیرونی
- [ ] ⚠️ مؤجل به فاز ۴: پاسخ‌هایِ وابسته به `restaurant-manager`/`demand-forecast`/مدلِ no-show
      (busiest_day، slow_day، at_risk_customers، underused_tables، demand_tomorrow، no_show_model_status)
      فعلاً صادقانه «در این نسخه فعال نیست» می‌دهند و با ادغامِ فاز ۴ به داده‌ی واقعی وصل می‌شوند.
- [ ] PUSH: PR سبز

**خروجی قابل اجرا:** از پنل بیزنس (در داکر) گفتگو با دستیار انجام می‌شود.

### فاز ۴ — پلتفرم هوش (Intelligence Platform)
**هدف:** حلقه‌ی یادگیری: پیش‌بینی → ثبت → سنجش → بهبود.
- [x] Merge `claude/rezervno-intelligence-platform-w7wcty` (schema + sql/055) — کتابخانه‌ها و مدل‌ها+SQLها (033/034/042/043/055) ادغام و اعمال شد
- [x] اتصال قلاب‌ها (حلقه‌ی زمانِ اجرا): `recordPrediction` در `reservations.ts` بعد از `emit` و `recordOutcome` در `lifecycle.ts` فقط روی وضعیت‌های پایانیِ معنادار
- [x] تایپ `NoShowPredictor`→`Promise<NoShowResult>` (منبع/احتمال/نسخه/فیچرها در کل زنجیره)
- [x] رفع باگِ enumِ production: کوئری‌های RAWِ رزرو (`status::text IN …`) روی ستونِ enum اثر می‌کردند و `createReservation` را می‌شکستند
- [x] تست‌های `prediction-ledger.integration.test.mts` + `intelligence-loop.integration.test.mts` سبز (۱۵/۱۵)؛ کل‌سوییت = ۳۱۲/۳۱۲
- [x] بازنویسی `prediction-ledger.ts` و `model-evaluation.ts` روی `BaseQueryUseCase` — بسته شد: این دو فایل از قبل لایه‌بندیِ خالص/DB جدا دارند (evaluatePairs خالص و بدون Postgres تست‌شده؛ fetchNoShowPairs لایه‌ی DB) و با ۱۵ تست پوشیده‌اند؛ بازنویسی مصنوعی بود و ریسکِ بی‌مورد می‌آورد. به‌جایش use-case واقعی (`lib/usecases/ai/model-health-use-case.ts`) ساخته شد که همان libها را پشتِ BaseUseCase اتوکشی می‌کند و بسته‌بندیِ خطا/لاگ را یکجا می‌دهد.
- [x] مسیر `admin/ai/model-health` ساخته شد — GET با اسکوپِ platform/restaurant، کران‌بندیِ sinceDays/limit، و ۵ تستِ integration (401/403/200/اسکوپ) سبز
- [x] امنیت: فقط admin (JWTِ role=owner در tenantِ پلتفرم) به مدل‌هلث دسترسی دارد (adminAuthFromRequest، fail-closed بدون PLATFORM_ADMIN_TENANT_ID) — کارمند/صاحبِ غیرِپلتفرم 403 می‌گیرد
- [x] وصل‌کردنِ ۶ پاسخِ `deferredAnswer` در `assistant-answers.ts` به داده‌ی واقعیِ فاز ۴ (getWeekdayRanking، rankUtilization، getDemandForecast، مدلِ no-show) — بدونِ ادعایِ حدسی
- [ ] PUSH: PR سبز

**خروجی قابل اجرا:** دشبورد model-health در داکر قابل مشاهده است.

### فاز ۵ — سخت‌سازی امنیتی و رفع‌های پرت
**هدف:** بستنِ رخنه‌های شناخته‌شده و رفع‌های launch.
- [ ] اعمال `claude/rezv-ai-agency-os-bvk4e8`: کشِ idempotency به `key + scope + actor` (جدول: `idempotency` با unique داشتنِ scope)
- [ ] اطمینان: `findUnique`/`ON CONFLICT` شامل scope و userId باشند
- [ ] Merge رفع‌های `fix/launch-demo-sms-reviews` (sms-balance + seeded demo)
- [ ] تست امنیتی idempotency: پخشِ پاسخِ cross-scope منع شود
- [ ] PUSH: PR سبز

**خروجی قابل اجرا:** بازپخشِ response بین scope ها غیرممکن است.

### فاز ۶ — یکپارچه‌سازی نهایی و برش به Rezv
**هدف:** کلِ کار روی `main` ادغام و ریپوی جدید مقصد شد.
- [ ] ادغامِ تدریجی PRها روی `develop` با merge-on-green
- [ ] اجرای کل چک‌ها: typecheck + lint + unit/integration/e2e (موبایل iPhone 13 / Pixel 5 / Desktop)
- [ ] `sh tools/sync-design-system.sh --check` صفر مغایرت
- [ ] بررسی مرجع‌سازی فایل‌ها (هیچ مسیر شکسته script/css/import)
- [ ] update: `git remote -v` → https://github.com/ardalanazimian/Rezv.git (از قبل انجام شد)
- [ ] PUSH نهایی: `git push -u origin main` + tag مرتبه‌دار
- [ ] پاک‌سازی: delete فیچر-برنچ‌های قدیمی (محلی و ریموت)

**خروجی قابل اجرا:** نسخه‌ی کامل Rezv با تمام فیچرها روی داکر + CI سبز.

---

## ۴. چک‌لیستِ گردش‌کار (Workflow) برای Vibe Coding

هر چرخه (فاز ۱..۶) دقیقاً همین ترتیب:

1. **تثبیتِ وضعیت کنونی**: `git status` خالی، برنچِ کاری گرفته از `develop`.
2. **قراردادها را بخوان**: `docs/figma-mcp-rules.md` اگر UI، `docs/ARCHITECTURE.md` اگر backend.
3. **فاز را کوچک نگه دار**: فقط فیچرِ یک فاز؛ PR تک‌منظوره؛ نه big-bang.
4. **اول پایه، بعد فیچر**: اگر use-case جدید می‌نویسی، اول base را بازبینی/توسعه بده.
5. **کدنویسی**: بدون کامنت اضافه؛ الگوهای موجود را تقلید کن (بین‌الملل فایل مجاور).
6. **اجرا با داکر**: `docker compose up -d --build` (یا پروفایل‌های http/observability).
7. **مایگریشن + seed**: `npm run db:migrate && npm run db:seed` — دیتای demo با `[DEMO]`.
8. **چک‌های اجباری** (ترتیب دقیق):
   ```bash
   cd api && npx prisma generate
   npx tsc --noEmit        # تایپ‌چک
   npm run lint            # لینت
   npm test                # واحد
   cd .. && npm run test:e2e  # E2E موبایل + دسکتاپ
   sh tools/sync-design-system.sh --check  # صفر مغایرت
   ```
9. **صداقت در گزارش**: بگو چی تست شد / چی فقط تایپ‌چک؛ هرگز بیش از حد ادعا نکن.
10. **کامیت فارسی** (تک‌منظوره، چه چیز + چرا):
    `git add <فایل‌ها> && git commit -m "feat(x): شرح فارسی"`
11. **PR**: فقط برای تغییر پرریسک (اسکیما، auth، رزرو، قفل)؛ PR کوچک + merge-on-green.
12. **پوشِ مستقیم**: فقط برای تغییرات کم‌ریسک و وقتی CI سبز است.
13. **همگام‌سازی دانش**: بعد از هر فاز، `CHANGELOG` آپدیت + دانشِ فنی در docs ثبت شود.

---

## ۵. قوانین و خط قرمزها (تکرار سیاست پروژه)
- کل ارتباطات و کامیت‌ها **فارسی**؛ UI فارسی/RTL با فونت Vazirmatn.
- هیچ‌وقت `.env` واقعی یا سکرت کامیت نمی‌شود (فایل مرجع: `.env.example`).
- OTP دمو ثابت `1234` الزامی است؛ تغییرش ممنوع.
- به `node_modules` یا `.next` دست نزن.
- نام رستوران واقعی جعل نکن؛ داده‌ی آزمایشی با برچسب `[DEMO]`.
- مایگریشن‌های SQL باید به‌صورت افزودنی (additive) باشند و با پوششِ تست وارد شوند.
- اگر مطمئن نیستی که تغییر با قوانین پروژه سازگار است، قبل از کامیت بپرس.