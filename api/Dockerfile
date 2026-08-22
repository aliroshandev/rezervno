# ── مرحله ۱: build ──
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
# ── --ignore-scripts: postinstall پروژه (`prisma generate`) را در این مرحله که فقط
#    package.json/lockfile کپی شده‌اند (و schema.prisma هنوز در WORKDIR نیست) اجرا
#    نکن. prisma client با `npx prisma generate` صریحِ پایین و بعد از `COPY . .`
#    ساخته می‌شود. بدون این، هم `npm ci` و هم fallbackِ `npm install` با خطای
#    «schema.prisma not found» شکست می‌خورند. ──
RUN npm ci --ignore-scripts || npm install --ignore-scripts
COPY . .
RUN npx prisma generate
RUN npm run build

# ── مرحله ۲: ایمیج نهایی (سخت‌شده) ──
# ── بیس دبیان (نه آلپاین): engine اسکیمای Prisma 5.20 برای musl به OpenSSL 1.1
#    نیاز دارد که در آلپاین مدرن نیست → «Error in Schema engine». نسخه‌ی دبیانی
#    engine با OpenSSL 3 (از پیش در slim نصب است) کار می‌کند — بدون apt install. ──
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# امنیت: ساخت کاربر non-root اختصاصی (اجرا با root خطرناک است)
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -s /bin/sh nextjs

# ── بهینه‌سازیِ اندازه: به‌جای کپیِ کلِ node_modules (شامل typescript/tsx/@types که
#    فقط برای build لازم بودند)، فقط وابستگی‌های production + prisma CLI نصب می‌شود.
#    prisma CLI در زمان اجرا برای `migrate deploy` در entrypoint لازم است. ──
COPY --chown=nextjs:nodejs package.json package-lock.json* ./
# ── --ignore-scripts در هر دو دستور: چرا؟
#    `npm ci --omit=dev` و `npm install prisma ...` هر دو lifecycle مشترک را اجرا
#    می‌کنند که شامل postinstallِ پروژه (`prisma generate`) است؛ در این مرحله هنوز
#    schema.prisma کپی نشده و آن خطا می‌دهد. برای prisma client هم لازم نیست —
#    خروجی تولیدشده از builder به node_modules/.prisma کپی می‌شود. CLI از build
#    می‌آید و وقتی needed باشد engine را خودش دانلود می‌کند. ──
RUN npm ci --omit=dev --ignore-scripts && \
    npm install prisma@5.20.0 --no-save --ignore-scripts && \
    # دانلودِ پیشینی engineها در زمان build (به‌عنوان root) تا entrypoint با
    # کاربر non-root مجبور به نوشتن در node_modules نشود.
    (npx prisma -v || true) && \
    npm cache clean --force && \
    # مالکیت کامل /app به کاربر اجرایی — وگرنه prisma در runtime با
    # «Can't write to /app/node_modules/@prisma/engines» می‌شکند.
    chown -R nextjs:nodejs /app

# فایل‌های build و اسکیمای لازم برای اجرا
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Prisma Client تولیدشده (در مرحله‌ی build ساخته شد) — تا دوباره generate لازم نشود
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
# ── Engineهای Prisma (query + schema/migration) ──
# در builder موقع `npx prisma generate` دانلود شده‌اند. بدون این کپی، entrypoint
# در runtime سعی می‌کند engine را دانلود کند و روی سروری که به binaries.prisma.sh
# دسترسی ندارد با «Error in Schema engine» کرش می‌کند.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --chown=nextjs:nodejs docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# امنیت: اجرا با کاربر non-root
USER nextjs

EXPOSE 3000
CMD ["/docker-entrypoint.sh"]
