CREATE TABLE "cogs_calculations" (
	"id" text PRIMARY KEY NOT NULL,
	"formula_version_id" text NOT NULL,
	"material_cost" numeric(10, 2) NOT NULL,
	"packaging_cost" numeric(10, 2) DEFAULT '0',
	"label_cost" numeric(10, 2) DEFAULT '0',
	"labor_cost" numeric(10, 2) DEFAULT '0',
	"overhead_cost" numeric(10, 2) DEFAULT '0',
	"total_cost" numeric(10, 2) NOT NULL,
	"unit_weight" numeric(10, 2) NOT NULL,
	"cost_per_gram" numeric(10, 4) NOT NULL,
	"calculation_date" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formula_labels" (
	"id" text PRIMARY KEY NOT NULL,
	"formula_version_id" text NOT NULL,
	"label_id" text,
	"quantity" integer DEFAULT 1,
	"cost_per_unit" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formula_packaging" (
	"id" text PRIMARY KEY NOT NULL,
	"formula_version_id" text NOT NULL,
	"packaging_id" text,
	"quantity" integer DEFAULT 1,
	"cost_per_unit" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formula_pricing" (
	"id" text PRIMARY KEY NOT NULL,
	"formula_id" text NOT NULL,
	"pricing_rule_id" text,
	"base_cost" numeric(10, 2) NOT NULL,
	"selling_price" numeric(10, 2) NOT NULL,
	"margin" numeric(5, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_cost_breakdown" (
	"id" text PRIMARY KEY NOT NULL,
	"cogs_calculation_id" text NOT NULL,
	"material_id" text NOT NULL,
	"material_cost_at_time" numeric(10, 2) NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"weight_per_unit" numeric(10, 2) NOT NULL,
	"cost_per_unit" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"markup_type" text NOT NULL,
	"markup_value" numeric(5, 2) NOT NULL,
	"target_margin" numeric(5, 2),
	"min_price" numeric(10, 2),
	"max_price" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formula_ingredients" (
	"id" text PRIMARY KEY NOT NULL,
	"formula_version_id" text NOT NULL,
	"material_id" text NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"weight" numeric(10, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formula_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"formula_id" text NOT NULL,
	"version" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"total_weight" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"notes" text,
	"change_reason" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formulas" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_weight" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"notes" text,
	"created_by" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_batch_materials" (
	"id" text PRIMARY KEY NOT NULL,
	"batch_id" text NOT NULL,
	"material_id" text NOT NULL,
	"planned_weight" numeric(10, 2) NOT NULL,
	"actual_weight" numeric(10, 2) NOT NULL,
	"cost" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_batches" (
	"id" text PRIMARY KEY NOT NULL,
	"formula_version_id" text NOT NULL,
	"batch_number" text NOT NULL,
	"quantity" integer NOT NULL,
	"actual_weight" numeric(10, 2) NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"total_cost" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"production_date" timestamp NOT NULL,
	"notes" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "production_batches_batch_number_unique" UNIQUE("batch_number")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"code_prefix" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"size" text NOT NULL,
	"material" text,
	"cost" numeric(10, 2) NOT NULL,
	"supplier" text,
	"supplier_code" text,
	"min_order_quantity" integer DEFAULT 1,
	"current_stock" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" text NOT NULL,
	"supplier" text,
	"supplier_code" text,
	"cost" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"min_stock_level" numeric(10, 2) DEFAULT '0',
	"current_stock" numeric(10, 2) DEFAULT '0',
	"reorder_point" numeric(10, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "materials_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "packaging" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"size" text NOT NULL,
	"material" text,
	"cost" numeric(10, 2) NOT NULL,
	"supplier" text,
	"supplier_code" text,
	"min_order_quantity" integer DEFAULT 1,
	"current_stock" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cogs_calculations" ADD CONSTRAINT "cogs_calculations_formula_version_id_formula_versions_id_fk" FOREIGN KEY ("formula_version_id") REFERENCES "public"."formula_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_labels" ADD CONSTRAINT "formula_labels_formula_version_id_formula_versions_id_fk" FOREIGN KEY ("formula_version_id") REFERENCES "public"."formula_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_labels" ADD CONSTRAINT "formula_labels_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_packaging" ADD CONSTRAINT "formula_packaging_formula_version_id_formula_versions_id_fk" FOREIGN KEY ("formula_version_id") REFERENCES "public"."formula_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_packaging" ADD CONSTRAINT "formula_packaging_packaging_id_packaging_id_fk" FOREIGN KEY ("packaging_id") REFERENCES "public"."packaging"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_pricing" ADD CONSTRAINT "formula_pricing_formula_id_formulas_id_fk" FOREIGN KEY ("formula_id") REFERENCES "public"."formulas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_pricing" ADD CONSTRAINT "formula_pricing_pricing_rule_id_pricing_rules_id_fk" FOREIGN KEY ("pricing_rule_id") REFERENCES "public"."pricing_rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_cost_breakdown" ADD CONSTRAINT "material_cost_breakdown_cogs_calculation_id_cogs_calculations_id_fk" FOREIGN KEY ("cogs_calculation_id") REFERENCES "public"."cogs_calculations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_cost_breakdown" ADD CONSTRAINT "material_cost_breakdown_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_ingredients" ADD CONSTRAINT "formula_ingredients_formula_version_id_formula_versions_id_fk" FOREIGN KEY ("formula_version_id") REFERENCES "public"."formula_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_ingredients" ADD CONSTRAINT "formula_ingredients_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_versions" ADD CONSTRAINT "formula_versions_formula_id_formulas_id_fk" FOREIGN KEY ("formula_id") REFERENCES "public"."formulas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batch_materials" ADD CONSTRAINT "production_batch_materials_batch_id_production_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."production_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batch_materials" ADD CONSTRAINT "production_batch_materials_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_formula_version_id_formula_versions_id_fk" FOREIGN KEY ("formula_version_id") REFERENCES "public"."formula_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cogs_calculations_formula_version_idx" ON "cogs_calculations" USING btree ("formula_version_id");--> statement-breakpoint
CREATE INDEX "cogs_calculations_calculation_date_idx" ON "cogs_calculations" USING btree ("calculation_date");--> statement-breakpoint
CREATE INDEX "formula_labels_formula_version_idx" ON "formula_labels" USING btree ("formula_version_id");--> statement-breakpoint
CREATE INDEX "formula_labels_label_idx" ON "formula_labels" USING btree ("label_id");--> statement-breakpoint
CREATE INDEX "formula_packaging_formula_version_idx" ON "formula_packaging" USING btree ("formula_version_id");--> statement-breakpoint
CREATE INDEX "formula_packaging_packaging_idx" ON "formula_packaging" USING btree ("packaging_id");--> statement-breakpoint
CREATE INDEX "formula_pricing_formula_idx" ON "formula_pricing" USING btree ("formula_id");--> statement-breakpoint
CREATE INDEX "formula_pricing_pricing_rule_idx" ON "formula_pricing" USING btree ("pricing_rule_id");--> statement-breakpoint
CREATE INDEX "formula_pricing_effective_date_idx" ON "formula_pricing" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "material_cost_breakdown_cogs_calculation_idx" ON "material_cost_breakdown" USING btree ("cogs_calculation_id");--> statement-breakpoint
CREATE INDEX "material_cost_breakdown_material_idx" ON "material_cost_breakdown" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "pricing_rules_name_idx" ON "pricing_rules" USING btree ("name");--> statement-breakpoint
CREATE INDEX "formula_ingredients_formula_version_idx" ON "formula_ingredients" USING btree ("formula_version_id");--> statement-breakpoint
CREATE INDEX "formula_ingredients_material_idx" ON "formula_ingredients" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "formula_versions_formula_version_idx" ON "formula_versions" USING btree ("formula_id","version");--> statement-breakpoint
CREATE INDEX "formula_versions_created_by_idx" ON "formula_versions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "formulas_name_idx" ON "formulas" USING btree ("name");--> statement-breakpoint
CREATE INDEX "formulas_status_idx" ON "formulas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "formulas_created_by_idx" ON "formulas" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "production_batch_materials_batch_idx" ON "production_batch_materials" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "production_batch_materials_material_idx" ON "production_batch_materials" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "production_batches_batch_number_idx" ON "production_batches" USING btree ("batch_number");--> statement-breakpoint
CREATE INDEX "production_batches_formula_version_idx" ON "production_batches" USING btree ("formula_version_id");--> statement-breakpoint
CREATE INDEX "production_batches_status_idx" ON "production_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "production_batches_production_date_idx" ON "production_batches" USING btree ("production_date");--> statement-breakpoint
CREATE INDEX "categories_name_idx" ON "categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "categories_code_prefix_idx" ON "categories" USING btree ("code_prefix");--> statement-breakpoint
CREATE INDEX "labels_name_idx" ON "labels" USING btree ("name");--> statement-breakpoint
CREATE INDEX "labels_type_idx" ON "labels" USING btree ("type");--> statement-breakpoint
CREATE INDEX "materials_code_idx" ON "materials" USING btree ("code");--> statement-breakpoint
CREATE INDEX "materials_name_idx" ON "materials" USING btree ("name");--> statement-breakpoint
CREATE INDEX "materials_category_idx" ON "materials" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "materials_supplier_idx" ON "materials" USING btree ("supplier");--> statement-breakpoint
CREATE INDEX "packaging_name_idx" ON "packaging" USING btree ("name");--> statement-breakpoint
CREATE INDEX "packaging_type_idx" ON "packaging" USING btree ("type");