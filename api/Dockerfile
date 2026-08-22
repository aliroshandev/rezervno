# ── مرحله ۱: build ──
FROM node:20-alpine AS builder
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
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# ── (بدون `apk upgrade` / dumb-init) ──
# `apk` به CDNِ آلپاین (dl-cdn.alpinelinux.org) وابسته است که در شبکه‌ی سرور
# در دسترس نیست (TLS error → exit 99) و build را می‌شکند. dumb-init هم ضروری
# نیست: docker-entrypoint.sh با `exec npm run start` تمام می‌شود، پس node
# خودش PID1 می‌شود و سیگنال‌ها را می‌گیرد. حذفِ apk وابستگی به این CDN را
# کاملاً برمی‌دارد. addgroup/adduser از busyboxِ داخلیِ آلپاین است و به apk
# نیاز ندارد.

# امنیت: ساخت کاربر non-root اختصاصی (اجرا با root خطرناک است)
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

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
COPY --chown=nextjs:nodejs docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# امنیت: اجرا با کاربر non-root
USER nextjs

EXPOSE 3000
CMD ["/docker-entrypoint.sh"]
