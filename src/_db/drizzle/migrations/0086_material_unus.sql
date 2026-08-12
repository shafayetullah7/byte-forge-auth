CREATE TABLE "plant_ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"usage_date" date NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plant_ai_usage_shop_date_unique" UNIQUE("shop_id","usage_date")
);
--> statement-breakpoint
DROP INDEX "product_variants_inventory_idx";--> statement-breakpoint
ALTER TABLE "plant_ai_usage" ADD CONSTRAINT "plant_ai_usage_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plant_ai_usage_usage_date_idx" ON "plant_ai_usage" USING btree ("usage_date");--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "inventory_count";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "track_inventory";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "low_stock_threshold";