import {
  pgTable,
  text,
  decimal,
  integer,
  timestamp,
  boolean,
  index
} from "drizzle-orm/pg-core";
import { materials } from "./inventory";
import { products } from "./products";

// Formulas table
export const formulas = pgTable("formulas", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  version: integer("version").default(1).notNull(),
  status: text("status").default("Draft").notNull(), // 'Draft', 'Trials', 'Pre-Production', 'Approved'
  totalWeight: decimal("total_weight", { precision: 10, scale: 2 }).notNull(), // in grams or ml
  unit: text("unit").notNull(), // 'g' for grams, 'ml' for ml
  notes: text("notes"),
  trialResults: text("trial_results"), // Store trial results and observations
  approvedDate: timestamp("approved_date"), // Date when formula was approved
  approvedBy: text("approved_by"), // User who approved the formula
  createdBy: text("created_by").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  productIdx: index("formulas_product_idx").on(table.productId),
  nameIdx: index("formulas_name_idx").on(table.name),
  statusIdx: index("formulas_status_idx").on(table.status),
  createdByIdx: index("formulas_created_by_idx").on(table.createdBy),
}));

// Formula versions for tracking changes
export const formulaVersions = pgTable("formula_versions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  formulaId: text("formula_id").notNull().references(() => formulas.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  totalWeight: decimal("total_weight", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  notes: text("notes"),
  changeReason: text("change_reason"),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  formulaVersionIdx: index("formula_versions_formula_version_idx").on(table.formulaId, table.version),
  createdByIdx: index("formula_versions_created_by_idx").on(table.createdBy),
}));

// Formula ingredients - the actual formula composition
export const formulaIngredients = pgTable("formula_ingredients", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  formulaVersionId: text("formula_version_id").notNull().references(() => formulaVersions.id, { onDelete: "cascade" }),
  materialId: text("material_id").notNull().references(() => materials.id, { onDelete: "restrict" }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(), // Should sum to 100%
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(), // Actual weight in g or ml
  qs: decimal("qs", { precision: 5, scale: 2 }).notNull().default(0), // QS value (100 - sum of all material percentages)
  isQsIngredient: boolean("is_qs_ingredient").default(false).notNull(), // Mark if this is the QS ingredient
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  formulaVersionIdx: index("formula_ingredients_formula_version_idx").on(table.formulaVersionId),
  materialIdx: index("formula_ingredients_material_idx").on(table.materialId),
}));

// Production tracking for when formulas are actually made
export const productionBatches = pgTable("production_batches", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  formulaVersionId: text("formula_version_id").notNull().references(() => formulaVersions.id, { onDelete: "restrict" }),
  batchNumber: text("batch_number").notNull().unique(),
  quantity: integer("quantity").notNull(), // Number of units produced
  actualWeight: decimal("actual_weight", { precision: 10, scale: 2 }).notNull(), // Total weight produced
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(), // Cost per unit
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(), // Total cost for batch
  status: text("status").default("planned").notNull(), // 'planned', 'in_progress', 'completed', 'failed'
  productionDate: timestamp("production_date").notNull(),
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  batchNumberIdx: index("production_batches_batch_number_idx").on(table.batchNumber),
  formulaVersionIdx: index("production_batches_formula_version_idx").on(table.formulaVersionId),
  statusIdx: index("production_batches_status_idx").on(table.status),
  productionDateIdx: index("production_batches_production_date_idx").on(table.productionDate),
}));

// Materials used in production batches
export const productionBatchMaterials = pgTable("production_batch_materials", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  batchId: text("batch_id").notNull().references(() => productionBatches.id, { onDelete: "cascade" }),
  materialId: text("material_id").notNull().references(() => materials.id, { onDelete: "restrict" }),
  plannedWeight: decimal("planned_weight", { precision: 10, scale: 2 }).notNull(),
  actualWeight: decimal("actual_weight", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(), // Cost at time of production
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  batchIdx: index("production_batch_materials_batch_idx").on(table.batchId),
  materialIdx: index("production_batch_materials_material_idx").on(table.materialId),
}));