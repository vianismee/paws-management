import {
  pgTable,
  text,
  decimal,
  integer,
  timestamp,
  boolean,
  index
} from "drizzle-orm/pg-core";
import { formulaVersions, formulas } from "./formulas";
import { materials, packaging, labels } from "./inventory";

// COGS calculations for formula versions
export const cogsCalculations = pgTable("cogs_calculations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  formulaVersionId: text("formula_version_id").notNull().references(() => formulaVersions.id, { onDelete: "cascade" }),
  materialCost: decimal("material_cost", { precision: 10, scale: 2 }).notNull(), // Cost of ingredients per unit
  packagingCost: decimal("packaging_cost", { precision: 10, scale: 2 }).default("0"), // Packaging cost per unit
  labelCost: decimal("label_cost", { precision: 10, scale: 2 }).default("0"), // Label cost per unit
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }).default("0"), // Labor cost per unit
  overheadCost: decimal("overhead_cost", { precision: 10, scale: 2 }).default("0"), // Overhead cost per unit
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(), // Total cost per unit
  unitWeight: decimal("unit_weight", { precision: 10, scale: 2 }).notNull(), // Weight per unit
  costPerGram: decimal("cost_per_gram", { precision: 10, scale: 4 }).notNull(), // Cost per gram/ml
  calculationDate: timestamp("calculation_date").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  formulaVersionIdx: index("cogs_calculations_formula_version_idx").on(table.formulaVersionId),
  calculationDateIdx: index("cogs_calculations_calculation_date_idx").on(table.calculationDate),
}));

// Detailed material cost breakdown
export const materialCostBreakdown = pgTable("material_cost_breakdown", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  cogsCalculationId: text("cogs_calculation_id").notNull().references(() => cogsCalculations.id, { onDelete: "cascade" }),
  materialId: text("material_id").notNull().references(() => materials.id, { onDelete: "restrict" }),
  materialCostAtTime: decimal("material_cost_at_time", { precision: 10, scale: 2 }).notNull(), // Cost per unit at calculation time
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(), // Percentage in formula
  weightPerUnit: decimal("weight_per_unit", { precision: 10, scale: 2 }).notNull(), // Weight per unit in g/ml
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(), // Cost contribution per unit
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  cogsCalculationIdx: index("material_cost_breakdown_cogs_calculation_idx").on(table.cogsCalculationId),
  materialIdx: index("material_cost_breakdown_material_idx").on(table.materialId),
}));

// Packaging and label assignments to formulas
export const formulaPackaging = pgTable("formula_packaging", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  formulaVersionId: text("formula_version_id").notNull().references(() => formulaVersions.id, { onDelete: "cascade" }),
  packagingId: text("packaging_id").references(() => packaging.id, { onDelete: "restrict" }),
  quantity: integer("quantity").default(1), // Number of packaging items per unit
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  formulaVersionIdx: index("formula_packaging_formula_version_idx").on(table.formulaVersionId),
  packagingIdx: index("formula_packaging_packaging_idx").on(table.packagingId),
}));

export const formulaLabels = pgTable("formula_labels", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  formulaVersionId: text("formula_version_id").notNull().references(() => formulaVersions.id, { onDelete: "cascade" }),
  labelId: text("label_id").references(() => labels.id, { onDelete: "restrict" }),
  quantity: integer("quantity").default(1), // Number of labels per unit
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  formulaVersionIdx: index("formula_labels_formula_version_idx").on(table.formulaVersionId),
  labelIdx: index("formula_labels_label_idx").on(table.labelId),
}));

// Pricing rules and templates
export const pricingRules = pgTable("pricing_rules", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  markupType: text("markup_type").notNull(), // 'percentage', 'fixed', 'target_margin'
  markupValue: decimal("markup_value", { precision: 5, scale: 2 }).notNull(),
  targetMargin: decimal("target_margin", { precision: 5, scale: 2 }), // For target_margin type
  minPrice: decimal("min_price", { precision: 10, scale: 2 }), // Minimum selling price
  maxPrice: decimal("max_price", { precision: 10, scale: 2 }), // Maximum selling price
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("pricing_rules_name_idx").on(table.name),
}));

// Pricing templates for formulas
export const formulaPricing = pgTable("formula_pricing", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  formulaId: text("formula_id").notNull().references(() => formulas.id, { onDelete: "cascade" }),
  pricingRuleId: text("pricing_rule_id").references(() => pricingRules.id, { onDelete: "restrict" }),
  baseCost: decimal("base_cost", { precision: 10, scale: 2 }).notNull(), // COGS per unit
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  margin: decimal("margin", { precision: 5, scale: 2 }).notNull(), // Actual margin percentage
  isActive: boolean("is_active").default(true).notNull(),
  effectiveDate: timestamp("effective_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  formulaIdx: index("formula_pricing_formula_idx").on(table.formulaId),
  pricingRuleIdx: index("formula_pricing_pricing_rule_idx").on(table.pricingRuleId),
  effectiveDateIdx: index("formula_pricing_effective_date_idx").on(table.effectiveDate),
}));