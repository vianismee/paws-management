CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sku" text NOT NULL,
	"category" text,
	"unit" text NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"retail_price" numeric(10, 2),
	"wholesale_price" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
ALTER TABLE "formulas" ALTER COLUMN "status" SET DEFAULT 'Draft';--> statement-breakpoint
ALTER TABLE "labels" ALTER COLUMN "cost" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "materials" ALTER COLUMN "cost" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "packaging" ALTER COLUMN "cost" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "formula_ingredients" ADD COLUMN "qs" numeric(5, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "formula_ingredients" ADD COLUMN "is_qs_ingredient" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "formulas" ADD COLUMN "product_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "formulas" ADD COLUMN "trial_results" text;--> statement-breakpoint
ALTER TABLE "formulas" ADD COLUMN "approved_date" timestamp;--> statement-breakpoint
ALTER TABLE "formulas" ADD COLUMN "approved_by" text;--> statement-breakpoint
ALTER TABLE "labels" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "labels" ADD COLUMN "purchase_quantity" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "labels" ADD COLUMN "cost_per_unit" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "labels" ADD COLUMN "currency" text DEFAULT 'IDR' NOT NULL;--> statement-breakpoint
ALTER TABLE "labels" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "purchase_unit" text NOT NULL;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "purchase_quantity" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "cost_per_unit" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "materials" ADD COLUMN "currency" text DEFAULT 'IDR' NOT NULL;--> statement-breakpoint
ALTER TABLE "packaging" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "packaging" ADD COLUMN "purchase_quantity" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "packaging" ADD COLUMN "cost_per_unit" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "packaging" ADD COLUMN "currency" text DEFAULT 'IDR' NOT NULL;--> statement-breakpoint
ALTER TABLE "packaging" ADD COLUMN "notes" text;--> statement-breakpoint
CREATE INDEX "products_name_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "products_sku_idx" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "products_created_by_idx" ON "products" USING btree ("created_by");--> statement-breakpoint
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "formulas_product_idx" ON "formulas" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "labels_code_idx" ON "labels" USING btree ("code");--> statement-breakpoint
CREATE INDEX "packaging_code_idx" ON "packaging" USING btree ("code");--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_code_unique" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "packaging" ADD CONSTRAINT "packaging_code_unique" UNIQUE("code");