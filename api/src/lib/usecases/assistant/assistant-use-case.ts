import { BaseUseCase, type UseCaseDeps } from '../base';
import { askAssistant, teachAssistant, type AskResult } from '../../assistant';
import type { AssistantIntent } from '../../assistant-nlu';

// ═══════════════════════════════════════════════════════════════════════
//  UseCaseهای دستیارِ هوشمند (فاز ۳) — DRY روی BaseUseCase
//
//  منطقِ واقعیِ طبقه‌بندی/یادگیری در lib/assistant.ts و lib/assistant-nlu.ts
//  است (آفلاین، بدون AI بیرونی). این کلاس‌ها فقط لایه‌ی use-case هستند تا
//  route ها نازک بمانند و از بسته‌بندیِ خطا/لاگ/متریکِ BaseUseCase بهره مند
//  شوند — دقیقاً همان قراردادِ فاز ۱/۲ (chats و menu).
// ═══════════════════════════════════════════════════════════════════════

export type AssistantCtx = {
  restaurantId: string;
  staffId?: string | null;
};

/** پرسیدنِ یک سؤالِ آزادمتن — classify + پاسخ + ثبتِ log + پیشنهاد اگر مطمئن نبود. */
export class AskAssistantUseCase extends BaseUseCase<AssistantCtx, { question: string }, AskResult> {
  constructor(deps: UseCaseDeps<AssistantCtx>) {
    super(deps);
  }

  protected run(input: { question: string }): Promise<AskResult> {
    return askAssistant({
      restaurantId: this.deps.ctx.restaurantId,
      staffId: this.deps.ctx.staffId,
      question: input.question,
    });
  }
}

/** حلقه‌ی خودآموزی — اصلاحِ نیتِ یک log قبلی → تقویتِ واژگانِ همین رستوران. */
export class TeachAssistantUseCase extends BaseUseCase<
  AssistantCtx,
  { logId: string; correctIntent: string },
  { answer: string; intent: AssistantIntent }
> {
  constructor(deps: UseCaseDeps<AssistantCtx>) {
    super(deps);
  }

  protected run(input: { logId: string; correctIntent: string }): Promise<{ answer: string; intent: AssistantIntent }> {
    return teachAssistant({
      restaurantId: this.deps.ctx.restaurantId,
      logId: input.logId,
      correctIntent: input.correctIntent,
    });
  }
}