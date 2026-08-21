FROM postgres:16-alpine

# postgres:alpine از قبل pg_dump و psql و tzdata دارد — هیچ apk لازم نیست.
# ⚠️ عمداً بدون apk: سرور به dl-cdn.alpinelinux.org دسترسی TLS ندارد (خطای build).
# aws-cli هم اختیاری است: backup.sh با command -v aws چک می‌کند و اگر نبود
# فقط بک‌آپ محلی می‌گیرد. برای S3 بعداً می‌توان ایمیج جدا ساخت.


COPY scripts/ /scripts/
RUN chmod +x /scripts/*.sh

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
