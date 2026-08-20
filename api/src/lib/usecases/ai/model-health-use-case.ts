import { BaseUseCase, type UseCaseDeps } from '../base';
import { fetchNoShowPairs, evaluatePairs, type ProductionEvaluation } from '../../model-evaluation';
import { getActiveNoShowModel } from '../../no-show-model';

// ═══════════════════════════════════════════════════════════════════════
//  UseCase سلامتِ مدل در تولید (فاز ۴) — DRY روی BaseUseCase
//
//  منطقِ سنجشِ واقعی در lib/model-evaluation.ts است (خالص و تست‌پذیر) و
//  لایه‌ی DB (fetchNoShowPairs) هم آنجاست. این کلاس فقط کوئریِ اختیاریِ
//  restaurantId را به آن‌ها می‌دهد و فراداده‌ی مدلِ یادگرفته را کنارِ
//  سنجش می‌چیند — تا route نازک بماند و از بسته‌بندیِ خطا/لاگِ BaseUseCase
//  بهره ببرد. (کنترلِ دسترسیِ admin در route انجام می‌شود؛ این UseCase
//  هیچ اجازه‌ای را فرض نمی‌گیرد.)
//
//  نگاهِ کلانِ پلتفرم (بدونِ restaurantId) و نگاهِ یک رستوران (با آن):
//  هردو از همین یک مسیر. فراخوان‌کننده مسئولِ صدقِ scope است.
// ═══════════════════════════════════════════════════════════════════════

export type ModelHealthCtx = {
  admin: { sub: string; tenantId: string };
};

export interface ModelHealthInput {
  /** اختیاری؛ بدونِ آن نمایِ کلِ پلتفرم داده می‌شود. */
  restaurantId?: string;
  sinceDays?: number;
  limit?: number;
}

export interface ModelHealthResult {
  restaurant: { id: string; name: string } | null;
  evaluation: ProductionEvaluation;
  /** فراداده‌ی مدلِ یادگرفته‌ی همان رستوران (فقط وقتی restaurantId داده شده). */
  model: {
    source: 'learned' | 'heuristic' | 'unavailable';
    version: string | null;
    trained_at: string | null;
    sample_size: number | null;
  } | null;
  latest_training_run: {
    trained_at: string;
    is_active: boolean;
    reason: string | null;
    sample_size: number;
  } | null;
}

export class ModelHealthUseCase extends BaseUseCase<ModelHealthCtx, ModelHealthInput, ModelHealthResult> {
  constructor(deps: UseCaseDeps<ModelHealthCtx>) {
    super(deps);
  }

  protected async run(input: ModelHealthInput): Promise<ModelHealthResult> {
    const restaurant = input.restaurantId
      ? await this.deps.db.restaurant.findUnique({
          where: { id: input.restaurantId },
          select: { id: true, name: true },
        })
      : null;

    const pairs = await fetchNoShowPairs({
      restaurantId: input.restaurantId,
      sinceDays: input.sinceDays,
      limit: input.limit,
    });
    const evaluation = evaluatePairs(pairs);

    if (!input.restaurantId) {
      return {
        restaurant: null,
        evaluation,
        model: null,
        latest_training_run: null,
      };
    }

    const [active, run] = await Promise.all([
      getActiveNoShowModel(input.restaurantId).catch(() => null),
      this.deps.db.modelTrainingRun.findFirst({
        where: { restaurantId: input.restaurantId, kind: 'no_show' },
        orderBy: { trainedAt: 'desc' },
        select: { trainedAt: true, isActive: true, reason: true, sampleSize: true },
      }),
    ]);

    return {
      restaurant,
      evaluation,
      model: active
        ? {
            source: 'learned',
            version: active.trainedAt.toISOString(),
            trained_at: active.trainedAt.toISOString(),
            sample_size: run?.sampleSize ?? null,
          }
        : { source: 'heuristic', version: 'heuristic-v1', trained_at: null, sample_size: run?.sampleSize ?? null },
      latest_training_run: run
        ? { trained_at: run.trainedAt.toISOString(), is_active: run.isActive, reason: run.reason, sample_size: run.sampleSize }
        : null,
    };
  }
}