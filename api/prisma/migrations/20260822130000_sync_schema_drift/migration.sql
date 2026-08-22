-- CreateEnum
CREATE TYPE "subscription_plan" AS ENUM ('free', 'starter', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "deposit_status" AS ENUM ('none', 'pending', 'paid', 'refunded', 'failed');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'success', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "staff_role" AS ENUM ('owner', 'manager', 'staff', 'admin');

-- CreateEnum
CREATE TYPE "photo_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "chat_sender" AS ENUM ('user', 'staff');

-- CreateEnum
CREATE TYPE "site_status" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "site_order_kind" AS ENUM ('trial', 'purchase');

-- CreateEnum
CREATE TYPE "site_order_status" AS ENUM ('pending', 'contacted', 'activated', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "site_inquiry_status" AS ENUM ('open', 'in_progress', 'closed');

-- DropForeignKey
ALTER TABLE "staff_permissions" DROP CONSTRAINT "staff_permissions_staff_id_fkey";

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "club_members" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "joined_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "coupon_redemptions" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "redeemed_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "coupons" DROP COLUMN "targetSegment",
ADD COLUMN     "target_segment" "customer_segment",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "valid_from" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "valid_until" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "customer_insights" ADD COLUMN     "intelligence_score" INTEGER,
ADD COLUMN     "intelligence_tier" TEXT,
ALTER COLUMN "first_visit_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "last_visit_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "gift_cards" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "guest_profiles" ALTER COLUMN "last_visit_anywhere" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "idempotency_keys" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "jobs" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "run_after" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "locked_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "marketing_automations" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "last_run_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "category" TEXT,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "otp_codes" ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "points_ledger" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "referrals" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "completed_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "reservation_events" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "block_buffer_minutes" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "deposit_amount_toman" INTEGER,
ADD COLUMN     "deposit_status" "deposit_status" NOT NULL DEFAULT 'none',
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "slot_start" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "slot_end" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "hold_expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "address" TEXT,
ADD COLUMN     "base_min_spend_toman" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'IR',
ADD COLUMN     "district" TEXT,
ADD COLUMN     "last_seen_at" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "online_gating" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "opening_hours" JSONB,
ADD COLUMN     "payment_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "pricing_rules" JSONB,
ADD COLUMN     "sms_balance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sms_total_sent" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "special_events" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "starts_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "ends_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "restaurant_id" UUID,
ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "role",
ADD COLUMN     "role" "staff_role" NOT NULL DEFAULT 'staff';

-- AlterTable
ALTER TABLE "staff_permissions" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tables" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "plan_expires_at" TIMESTAMP(3),
ADD COLUMN     "trial_ends_at" TIMESTAMP(3),
ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "plan",
ADD COLUMN     "plan" "subscription_plan" NOT NULL DEFAULT 'free',
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "waitlist_entries" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "joined_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "offered_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "offer_expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "responded_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "seated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "webhooks" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "events" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "sms_transactions" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "actor_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "user_id" UUID,
    "reservation_id" UUID,
    "rating" SMALLINT NOT NULL,
    "food_rating" SMALLINT,
    "service_rating" SMALLINT,
    "atmosphere_rating" SMALLINT,
    "body" TEXT,
    "reply" TEXT,
    "replied_at" TIMESTAMP(3),
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_photos" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "category" TEXT NOT NULL DEFAULT 'food',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "storage_key" TEXT,
    "mime_type" TEXT,
    "byte_size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "original_name" TEXT,
    "status" "photo_status" NOT NULL DEFAULT 'pending',
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" UUID,
    "rejection_reason" TEXT,
    "uploaded_by_staff_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_notes" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "author_staff_id" UUID,
    "author_name" TEXT,
    "body" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_logs" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "segment" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recipients_count" INTEGER NOT NULL DEFAULT 0,
    "sent_by_staff_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_closures" (
    "restaurant_id" UUID NOT NULL,
    "closure_date" DATE NOT NULL,
    "reason" TEXT,

    CONSTRAINT "restaurant_closures_pkey" PRIMARY KEY ("restaurant_id","closure_date")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'zarinpal',
    "authority" TEXT,
    "ref_id" TEXT,
    "amount_toman" INTEGER NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'pending',
    "fail_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMPTZ,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "chat_threads" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reservation_id" UUID,
    "last_message_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unread_for_user" INTEGER NOT NULL DEFAULT 0,
    "unread_for_staff" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "sender" "chat_sender" NOT NULL,
    "staff_id" UUID,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_events" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ NOT NULL,
    "ingested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID,
    "restaurant_id" UUID,
    "user_id" UUID,
    "staff_id" UUID,
    "session_id" TEXT,
    "correlation_id" TEXT,
    "source" TEXT NOT NULL,
    "device" JSONB,
    "geo" JSONB,
    "payload" JSONB NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "platform_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_pages" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "og_image" TEXT,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "structured_data" JSONB,
    "status" "site_status" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "site_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_articles" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cover_url" TEXT,
    "cover_alt" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "author_name" TEXT NOT NULL DEFAULT 'تیم رزرونو',
    "author_role" TEXT,
    "reading_minutes" SMALLINT NOT NULL DEFAULT 5,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "og_image" TEXT,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "status" "site_status" NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "site_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_faqs" (
    "id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'general',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "site_status" NOT NULL DEFAULT 'published',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "site_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_plans" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "months" SMALLINT NOT NULL,
    "price_toman" INTEGER NOT NULL,
    "compare_at_toman" INTEGER,
    "badge" TEXT,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "tenant_plan" "subscription_plan" NOT NULL DEFAULT 'pro',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "site_status" NOT NULL DEFAULT 'published',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "site_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_testimonials" (
    "id" UUID NOT NULL,
    "quote" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "role" TEXT,
    "company" TEXT,
    "avatar_url" TEXT,
    "rating" SMALLINT NOT NULL DEFAULT 5,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "site_status" NOT NULL DEFAULT 'published',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "site_testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_banners" (
    "id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "cta_label" TEXT,
    "cta_href" TEXT,
    "tone" TEXT NOT NULL DEFAULT 'brand',
    "starts_at" TIMESTAMPTZ,
    "ends_at" TIMESTAMPTZ,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "site_status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "site_banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_release_notes" (
    "id" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "released_at" TIMESTAMPTZ NOT NULL,
    "status" "site_status" NOT NULL DEFAULT 'published',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "site_release_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_orders" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "kind" "site_order_kind" NOT NULL,
    "status" "site_order_status" NOT NULL DEFAULT 'pending',
    "plan_key" TEXT,
    "plan_name" TEXT,
    "months" SMALLINT,
    "amount_toman" INTEGER,
    "business_name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT,
    "branch_count" SMALLINT,
    "note" TEXT,
    "tenant_id" UUID,
    "restaurant_id" UUID,
    "staff_id" UUID,
    "trial_ends_at" TIMESTAMPTZ,
    "activated_at" TIMESTAMPTZ,
    "activated_by" UUID,
    "plan_expires_at" TIMESTAMPTZ,
    "admin_note" TEXT,
    "rejected_reason" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "landing_path" TEXT,
    "referrer" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_inquiries" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "topic" TEXT NOT NULL DEFAULT 'sales',
    "message" TEXT NOT NULL,
    "status" "site_inquiry_status" NOT NULL DEFAULT 'open',
    "admin_note" TEXT,
    "handled_by" UUID,
    "handled_at" TIMESTAMPTZ,
    "utm_source" TEXT,
    "landing_path" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_assistant_vocab" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "intent" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_assistant_vocab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_assistant_logs" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "staff_id" UUID,
    "question" TEXT NOT NULL,
    "detected_intent" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "was_corrected" BOOLEAN NOT NULL DEFAULT false,
    "final_intent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_assistant_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_no_show_models" (
    "restaurant_id" UUID NOT NULL,
    "weights" DOUBLE PRECISION[],
    "sample_size" INTEGER NOT NULL,
    "positive_count" INTEGER NOT NULL,
    "learned_brier" DOUBLE PRECISION NOT NULL,
    "static_brier" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "trained_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_no_show_models_pkey" PRIMARY KEY ("restaurant_id")
);

-- CreateTable
CREATE TABLE "restaurant_demand_forecasts" (
    "restaurant_id" UUID NOT NULL,
    "history_days" INTEGER NOT NULL,
    "count_model" JSONB NOT NULL,
    "covers_model" JSONB NOT NULL,
    "trained_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_demand_forecasts_pkey" PRIMARY KEY ("restaurant_id")
);

-- CreateTable
CREATE TABLE "model_training_runs" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "metrics" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "reason" TEXT,
    "trained_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_training_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_predictions" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "prediction_type" TEXT NOT NULL,
    "subject_type" TEXT NOT NULL,
    "subject_id" UUID NOT NULL,
    "model_source" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "feature_version" INTEGER NOT NULL DEFAULT 1,
    "features" JSONB NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "predicted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horizon_at" TIMESTAMP(3),

    CONSTRAINT "model_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_outcomes" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "prediction_type" TEXT NOT NULL,
    "subject_type" TEXT NOT NULL,
    "subject_id" UUID NOT NULL,
    "outcome_label" DOUBLE PRECISION NOT NULL,
    "outcome_status" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sms_transactions_restaurant_id_created_at_idx" ON "sms_transactions"("restaurant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reviews_restaurant_id_created_at_idx" ON "reviews"("restaurant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "reviews_reservation_id_idx" ON "reviews"("reservation_id");

-- CreateIndex
CREATE INDEX "restaurant_photos_restaurant_id_sort_order_idx" ON "restaurant_photos"("restaurant_id", "sort_order");

-- CreateIndex
CREATE INDEX "restaurant_photos_status_created_at_idx" ON "restaurant_photos"("status", "created_at");

-- CreateIndex
CREATE INDEX "staff_notes_restaurant_id_pinned_created_at_idx" ON "staff_notes"("restaurant_id", "pinned" DESC, "created_at" DESC);

-- CreateIndex
CREATE INDEX "campaign_logs_restaurant_id_created_at_idx" ON "campaign_logs"("restaurant_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "payments_authority_key" ON "payments"("authority");

-- CreateIndex
CREATE INDEX "payments_reservation_id_idx" ON "payments"("reservation_id");

-- CreateIndex
CREATE INDEX "chat_threads_restaurant_id_last_message_at_idx" ON "chat_threads"("restaurant_id", "last_message_at" DESC);

-- CreateIndex
CREATE INDEX "chat_threads_user_id_last_message_at_idx" ON "chat_threads"("user_id", "last_message_at" DESC);

-- CreateIndex
CREATE INDEX "chat_messages_thread_id_created_at_idx" ON "chat_messages"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "platform_events_type_occurred_at_idx" ON "platform_events"("type", "occurred_at");

-- CreateIndex
CREATE INDEX "platform_events_restaurant_id_occurred_at_idx" ON "platform_events"("restaurant_id", "occurred_at");

-- CreateIndex
CREATE INDEX "platform_events_user_id_occurred_at_idx" ON "platform_events"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "platform_events_correlation_id_idx" ON "platform_events"("correlation_id");

-- CreateIndex
CREATE UNIQUE INDEX "site_pages_slug_key" ON "site_pages"("slug");

-- CreateIndex
CREATE INDEX "site_pages_status_slug_idx" ON "site_pages"("status", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "site_articles_slug_key" ON "site_articles"("slug");

-- CreateIndex
CREATE INDEX "site_articles_status_published_at_idx" ON "site_articles"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "site_faqs_status_scope_sort_order_idx" ON "site_faqs"("status", "scope", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "site_plans_key_key" ON "site_plans"("key");

-- CreateIndex
CREATE INDEX "site_plans_status_sort_order_idx" ON "site_plans"("status", "sort_order");

-- CreateIndex
CREATE INDEX "site_testimonials_status_sort_order_idx" ON "site_testimonials"("status", "sort_order");

-- CreateIndex
CREATE INDEX "site_banners_status_sort_order_idx" ON "site_banners"("status", "sort_order");

-- CreateIndex
CREATE INDEX "site_release_notes_status_released_at_idx" ON "site_release_notes"("status", "released_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "site_orders_code_key" ON "site_orders"("code");

-- CreateIndex
CREATE INDEX "site_orders_status_created_at_idx" ON "site_orders"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "site_orders_kind_status_idx" ON "site_orders"("kind", "status");

-- CreateIndex
CREATE INDEX "site_orders_phone_idx" ON "site_orders"("phone");

-- CreateIndex
CREATE INDEX "site_orders_tenant_id_idx" ON "site_orders"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "site_inquiries_code_key" ON "site_inquiries"("code");

-- CreateIndex
CREATE INDEX "site_inquiries_status_created_at_idx" ON "site_inquiries"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "restaurant_assistant_vocab_restaurant_id_idx" ON "restaurant_assistant_vocab"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_assistant_vocab_restaurant_id_intent_word_key" ON "restaurant_assistant_vocab"("restaurant_id", "intent", "word");

-- CreateIndex
CREATE INDEX "restaurant_assistant_logs_restaurant_id_created_at_idx" ON "restaurant_assistant_logs"("restaurant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "model_training_runs_restaurant_id_kind_trained_at_idx" ON "model_training_runs"("restaurant_id", "kind", "trained_at");

-- CreateIndex
CREATE INDEX "model_predictions_restaurant_type_idx" ON "model_predictions"("restaurant_id", "prediction_type", "predicted_at");

-- CreateIndex
CREATE UNIQUE INDEX "model_predictions_subject_version_uidx" ON "model_predictions"("prediction_type", "subject_type", "subject_id", "model_version");

-- CreateIndex
CREATE INDEX "model_outcomes_restaurant_type_idx" ON "model_outcomes"("restaurant_id", "prediction_type", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "model_outcomes_subject_uidx" ON "model_outcomes"("prediction_type", "subject_type", "subject_id");

-- CreateIndex
CREATE INDEX "customer_insights_intelligence_score_idx" ON "customer_insights"("intelligence_score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "jobs_idempotency_key_key" ON "jobs"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_restaurants_city" ON "restaurants"("city");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_permissions" ADD CONSTRAINT "staff_permissions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_profiles" ADD CONSTRAINT "guest_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_transactions" ADD CONSTRAINT "sms_transactions_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_photos" ADD CONSTRAINT "restaurant_photos_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_notes" ADD CONSTRAINT "staff_notes_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_logs" ADD CONSTRAINT "campaign_logs_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_closures" ADD CONSTRAINT "restaurant_closures_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_assistant_vocab" ADD CONSTRAINT "restaurant_assistant_vocab_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_assistant_logs" ADD CONSTRAINT "restaurant_assistant_logs_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_no_show_models" ADD CONSTRAINT "restaurant_no_show_models_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_demand_forecasts" ADD CONSTRAINT "restaurant_demand_forecasts_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_training_runs" ADD CONSTRAINT "model_training_runs_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_predictions" ADD CONSTRAINT "model_predictions_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_outcomes" ADD CONSTRAINT "model_outcomes_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

