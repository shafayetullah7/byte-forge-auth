CREATE TYPE "public"."variant_stock_status_enum" AS ENUM('in_stock', 'low_stock', 'out_of_stock');--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "available_quantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "stock_status" "variant_stock_status_enum" DEFAULT 'out_of_stock' NOT NULL;--> statement-breakpoint
CREATE INDEX "product_variants_available_quantity_idx" ON "product_variants" USING btree ("available_quantity");--> statement-breakpoint
CREATE INDEX "product_variants_stock_status_idx" ON "product_variants" USING btree ("stock_status");