#!/bin/sh
# صدا زدن endpoint نگهداری با کلید محرمانه
# API_URL و MAINTENANCE_KEY از محیط می‌آیند
JOB="$1"
URL="${API_URL:-http://api:3000}/api/v1/maintenance/${JOB}"
# wget داخلی busybox (بدون curl — apk روی سرور در دسترس نیست)
wget -qO /dev/null -T 30 \
  --header "x-maintenance-key: ${MAINTENANCE_KEY}" \
  --header "Content-Type: application/json" \
  --post-data='{}' "$URL" \
  && echo "[$(date)] ✓ $JOB" \
  || echo "[$(date)] ✗ $JOB failed"
