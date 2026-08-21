FROM alpine:3.19
# ⚠️ عمداً بدون apk: سرور به dl-cdn.alpinelinux.org دسترسی TLS ندارد.
# run.sh به‌جای curl از wget داخلیِ busybox استفاده می‌کند.
COPY crontab /etc/crontabs/root
COPY run.sh /run.sh
RUN chmod +x /run.sh
# اجرا با کاربر non-root
RUN adduser -D -u 1001 cronuser
USER cronuser
CMD ["crond", "-f", "-l", "8"]
