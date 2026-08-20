import { createLogger, currentTraceId } from '../logger';
import { ApiError } from '../errors';
import type { PrismaClient } from '@prisma/client';

/**
 * Context تزریقیِ استفاده‌شده توسط همه‌ی UseCaseها.
 * Route handler (کنترلر) فقط ورودی را می‌سازد و دپ‌ها را تزریق می‌کند؛
 * منطق کسب‌وکار و دستکاریِ db/redis در UseCase می‌ماند — DRY و تست‌پذیر.
 */
export interface UseCaseDeps<C> {
  /** دپ‌های دامنه (prisma, redis, …) یا context احرازِ هویت پردازش‌شده */
  ctx: C;
  /** کلاینت پرایسما برای دسترسی به دیتابیس. */
  db: PrismaClient;
  /** scope برای لاگر (پیش‌فرض: نام کلاس) */
  scope?: string;
}

/**
 * BaseUseCase — کلاس پایه‌ی مشترک برای همه‌ی use caseها.
 *
 * قرارداد:
 *   - هر UseCase فقط `execute(input)` را پیاده می‌کند.
 *   - اجرا به‌صورت متمرکز، لاگ می‌شود (با traceId)، خطاهای ApiError شفاف
 *     عبور می‌کنند و خطای غیرمنتظره به‌عنوان 500 بسته‌بندی می‌شود.
 *   - کدِ تکراریِ (لاگ + trace + بسته‌بندی خطا) یک‌بار اینجا نوشته شده
 *     و همه‌ی use caseها ارث می‌برند — «don't repeat yourself».
 *
 * الگوی استفاده در route:
 *   const uc = new MyUseCase({ ctx, scope: 'x' });
 *   const result = await uc.execute(input);
 */
export abstract class BaseUseCase<C, TInput, TOutput> {
  protected readonly deps: UseCaseDeps<C>;
  protected readonly log: ReturnType<typeof createLogger>;

  constructor(deps: UseCaseDeps<C>) {
    this.deps = deps;
    this.log = createLogger(deps.scope ?? this.constructor.name);
  }

  /**
   * متد عمومیِ اجرا. زیرکلاس‌ها `run()` را پیاده می‌کنند؛ این متد
   * observability و بسته‌بندی خطا را یکجا اضافه می‌کند تا هر use case
   * این تکرار را ننویسد.
   */
  async execute(input: TInput): Promise<TOutput> {
    const started = Date.now();
    this.log.debug('use-case start', { traceId: currentTraceId() });
    try {
      const out = await this.run(input);
      this.log.debug(`use-case ok in ${Date.now() - started}ms`);
      return out;
    } catch (e) {
      if (e instanceof ApiError) throw e; // خطای دامنه — شفاف عبور می‌کند
      this.log.error('use-case failed', e);
      throw new ApiError('INTERNAL', 'خطای داخلی', 500);
    }
  }

  /** پیاده‌سازی منطق استفاده در زیرکلاس. */
  protected abstract run(input: TInput): Promise<TOutput>;
}