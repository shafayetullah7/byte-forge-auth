CREATE TYPE "public"."subscription_billing_provider_enum" AS ENUM('NONE', 'COUPON', 'STRIPE', 'ADMIN', 'WALLET');--> statement-breakpoint
CREATE TYPE "public"."subscription_duration_unit_enum" AS ENUM('DAY', 'MONTH');--> statement-breakpoint
CREATE TYPE "public"."subscription_interval_enum" AS ENUM('MONTH', 'YEAR');--> statement-breakpoint
CREATE TYPE "public"."subscription_invoice_provider_enum" AS ENUM('COUPON', 'STRIPE', 'ADMIN', 'WALLET');--> statement-breakpoint
CREATE TYPE "public"."subscription_invoice_status_enum" AS ENUM('PENDING', 'PAID', 'FAILED', 'VOID');--> statement-breakpoint
CREATE TYPE "public"."subscription_status_enum" AS ENUM('NONE', 'ACTIVE', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"interval" "subscription_interval_enum" NOT NULL,
	"price_bdt" numeric(12, 2) NOT NULL,
	"is_active_for_new" boolean DEFAULT true NOT NULL,
	"is_retired" boolean DEFAULT false NOT NULL,
	"stripe_product_id" varchar(255),
	"stripe_price_id" varchar(255),
	"previous_stripe_price_ids" json DEFAULT '[]'::json,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"status" "subscription_status_enum" DEFAULT 'NONE' NOT NULL,
	"current_period_end" timestamp with time zone,
	"billing_provider" "subscription_billing_provider_enum" DEFAULT 'NONE' NOT NULL,
	"plan_id" uuid,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_subscriptions_shop_id_unique" UNIQUE("shop_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_coupon_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"period_end_after" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(64) NOT NULL,
	"duration_value" integer NOT NULL,
	"duration_unit" "subscription_duration_unit_enum" NOT NULL,
	"max_redemptions" integer,
	"redemption_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "subscription_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"plan_id" uuid,
	"amount_bdt" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'BDT' NOT NULL,
	"provider" "subscription_invoice_provider_enum" NOT NULL,
	"status" "subscription_invoice_status_enum" DEFAULT 'PENDING' NOT NULL,
	"external_id" varchar(255),
	"receipt_url" varchar(2048),
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"metadata" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shop_subscriptions" ADD CONSTRAINT "shop_subscriptions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_subscriptions" ADD CONSTRAINT "shop_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_coupon_redemptions" ADD CONSTRAINT "subscription_coupon_redemptions_coupon_id_subscription_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."subscription_coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_coupon_redemptions" ADD CONSTRAINT "subscription_coupon_redemptions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shop_subscriptions_shop_id_idx" ON "shop_subscriptions" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "shop_subscriptions_status_idx" ON "shop_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shop_subscriptions_period_end_idx" ON "shop_subscriptions" USING btree ("current_period_end");--> statement-breakpoint
CREATE INDEX "subscription_coupon_redemptions_shop_id_idx" ON "subscription_coupon_redemptions" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "subscription_coupon_redemptions_coupon_id_idx" ON "subscription_coupon_redemptions" USING btree ("coupon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_coupon_redemptions_shop_coupon_uidx" ON "subscription_coupon_redemptions" USING btree ("shop_id","coupon_id");--> statement-breakpoint
CREATE INDEX "subscription_coupons_code_idx" ON "subscription_coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "subscription_invoices_shop_id_idx" ON "subscription_invoices" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "subscription_invoices_status_idx" ON "subscription_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscription_invoices_external_id_idx" ON "subscription_invoices" USING btree ("external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_invoices_provider_external_uidx" ON "subscription_invoices" USING btree ("provider","external_id");