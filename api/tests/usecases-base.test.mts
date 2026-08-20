import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BaseUseCase, type UseCaseDeps } from '../src/lib/usecases/base.ts';
import { paginate, listResponse } from '../src/lib/usecases/helpers.ts';
import { ApiError } from '../src/lib/errors.ts';

// یک <TInput/TOutput> ساده برای تستِ قرارداد اجرا/لاگ/خطا
class Echo extends BaseUseCase<{ marker: string }, string, string> {
  run(input: string): Promise<string> {
    return Promise.resolve(`echo:${input}:${this.deps.ctx.marker}`);
  }
}

class Boom extends BaseUseCase<{}, void, void> {
  run(_input: void): Promise<void> {
    throw new Error('boom raw');
  }
}

class DomainError extends BaseUseCase<{}, void, void> {
  run(_input: void): Promise<void> {
    throw new ApiError('DOMAIN', 'مشکل دامنه', 422);
  }
}

// db فیک — برای این تست‌ها هیچ کوئری‌ای نمایش داده نمی‌شود؛ فقط باید تایپِ deps پر شود.
const fakeDb = {} as unknown as typeof import('@prisma/client').PrismaClient;

const makeDeps = (): UseCaseDeps<unknown> => ({ ctx: {}, db: fakeDb });

describe('BaseUseCase', () => {
  test('execute → result و دپ‌های تزریق‌شده در دسترس هستند (DI کار می‌کند)', async () => {
    const deps: UseCaseDeps<{ marker: string }> = { ctx: { marker: 'M' }, db: fakeDb, scope: 'echo' };
    const out = await new Echo(deps).execute('x');
    assert.equal(out, 'echo:x:M');
  });

  test('خطای دامنه (ApiError) شفاف عبور می‌کند — همان status/code/متن', async () => {
    await assert.rejects(
      () => new DomainError(makeDeps()).execute(undefined),
      (e: ApiError) => e instanceof ApiError && e.code === 'DOMAIN' && e.status === 422 && e.message === 'مشکل دامنه',
    );
  });

  test('خطای غیرمنتظره به 500 داخلی بسته‌بندی می‌شود (نه نشتِ raw)', async () => {
    await assert.rejects(
      () => new Boom(makeDeps()).execute(undefined),
      (e: ApiError) => e instanceof ApiError && e.code === 'INTERNAL' && e.status === 500,
    );
  });
});

describe('helpers — paginate / listResponse', () => {
  test('پیش‌فرض page=1 limit=20', () => {
    assert.deepEqual(paginate({}), { page: 1, limit: 20, skip: 0 });
  });
  test('سقفِ limit روی ۱۰۰ و حداقل ۱', () => {
    assert.equal(paginate({ limit: 9999 }).limit, 100);
    assert.equal(paginate({ limit: 0 }).limit, 1);
  });
  test('listResponse تعداد صفحات را درست حساب می‌کند', () => {
    const r = listResponse([1, 2, 3], 50, 1, 20);
    assert.equal(r.totalPages, 3);
    assert.equal(r.total, 50);
  });
});