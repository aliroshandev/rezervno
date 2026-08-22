-- Optimistic Lock برای Tenant: ستون version که در schema.prisma بود ولی
-- هرگز به migration اضافه نشده بود → P2022 هنگام seed/insert.
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
