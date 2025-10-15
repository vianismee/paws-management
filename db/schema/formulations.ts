import { pgTable, text, timestamp, decimal, integer, boolean, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { materials } from "./inventory";

export const formulas = pgTable("formulas", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    productType: text("product_type").notNull(), // e.g., 'candle', 'soap', 'perfume'
    targetBatchSize: decimal("target_batch_size", { precision: 12, scale: 3 }).notNull(), // Target production quantity
    batchSizeUnit: text("batch_size_unit").notNull(), // e.g., 'kg', 'L', 'pieces'
    status: text("status").notNull().default('draft'), // 'draft', 'active', 'inactive', 'archived'
    version: integer("version").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const formulaVersions = pgTable("formula_versions", {
    id: text("id").primaryKey(),
    formulaId: text("formula_id").notNull().references(() => formulas.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    targetBatchSize: decimal("target_batch_size", { precision: 12, scale: 3 }).notNull(),
    batchSizeUnit: text("batch_size_unit").notNull(),
    status: text("status").notNull().default('draft'), // 'draft', 'active', 'inactive', 'archived'
    notes: text("notes"),
    isCurrent: boolean("is_current").notNull().default(false),
    effectiveDate: timestamp("effective_date"),
    expiryDate: timestamp("expiry_date"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    formulaVersionKey: primaryKey({ columns: [table.formulaId, table.version] }),
}));

export const formulaIngredients = pgTable("formula_ingredients", {
    id: text("id").primaryKey(),
    formulaVersionId: text("formula_version_id").notNull().references(() => formulaVersions.id, { onDelete: "cascade" }),
    materialId: text("material_id").notNull().references(() => materials.id, { onDelete: "restrict" }),
    percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(), // Percentage of total formula (0-100)
    quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(), // Actual quantity for target batch size
    unit: text("unit").notNull(), // Unit of measurement
    order: integer("order").notNull().default(0), // Order in formula listing
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const formulaPackaging = pgTable("formula_packaging", {
    id: text("id").primaryKey(),
    formulaVersionId: text("formula_version_id").notNull().references(() => formulaVersions.id, { onDelete: "cascade" }),
    packagingTypeId: text("packaging_type_id").notNull(),
    packagingName: text("packaging_name").notNull(), // Custom name if needed
    quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(), // Quantity per unit
    unit: text("unit").notNull(), // e.g., 'pieces', 'sets'
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const formulaLabels = pgTable("formula_labels", {
    id: text("id").primaryKey(),
    formulaVersionId: text("formula_version_id").notNull().references(() => formulaVersions.id, { onDelete: "cascade" }),
    labelTypeId: text("label_type_id").notNull(),
    labelName: text("label_name").notNull(), // Custom name if needed
    quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(), // Quantity per unit
    unit: text("unit").notNull(), // e.g., 'pieces', 'sets'
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const formulaProduction = pgTable("formula_production", {
    id: text("id").primaryKey(),
    formulaVersionId: text("formula_version_id").notNull().references(() => formulaVersions.id, { onDelete: "restrict" }),
    batchNumber: text("batch_number").notNull().unique(),
    actualBatchSize: decimal("actual_batch_size", { precision: 12, scale: 3 }).notNull(),
    producedQuantity: decimal("produced_quantity", { precision: 12, scale: 3 }).notNull(), // Actual units produced
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }), // Calculated actual cost per unit
    status: text("status").notNull().default('planned'), // 'planned', 'in_progress', 'completed', 'cancelled'
    productionDate: timestamp("production_date").notNull(),
    completionDate: timestamp("completion_date"),
    notes: text("notes"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const formulaProductionIngredients = pgTable("formula_production_ingredients", {
    id: text("id").primaryKey(),
    productionId: text("production_id").notNull().references(() => formulaProduction.id, { onDelete: "cascade" }),
    materialId: text("material_id").notNull().references(() => materials.id, { onDelete: "restrict" }),
    plannedQuantity: decimal("planned_quantity", { precision: 12, scale: 3 }).notNull(),
    actualQuantity: decimal("actual_quantity", { precision: 12, scale: 3 }),
    unit: text("unit").notNull(),
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const formulasRelations = relations(formulas, ({ one, many }) => ({
    versions: many(formulaVersions),
    productions: many(formulaProduction),
}));

export const formulaVersionsRelations = relations(formulaVersions, ({ one, many }) => ({
    formula: one(formulas, {
        fields: [formulaVersions.formulaId],
        references: [formulas.id],
    }),
    ingredients: many(formulaIngredients),
    packaging: many(formulaPackaging),
    labels: many(formulaLabels),
    productions: many(formulaProduction),
}));

export const formulaIngredientsRelations = relations(formulaIngredients, ({ one }) => ({
    formulaVersion: one(formulaVersions, {
        fields: [formulaIngredients.formulaVersionId],
        references: [formulaVersions.id],
    }),
    material: one(materials, {
        fields: [formulaIngredients.materialId],
        references: [materials.id],
    }),
}));

export const formulaProductionRelations = relations(formulaProduction, ({ one, many }) => ({
    formulaVersion: one(formulaVersions, {
        fields: [formulaProduction.formulaVersionId],
        references: [formulaVersions.id],
    }),
    ingredients: many(formulaProductionIngredients),
}));

export const formulaProductionIngredientsRelations = relations(formulaProductionIngredients, ({ one }) => ({
    production: one(formulaProduction, {
        fields: [formulaProductionIngredients.productionId],
        references: [formulaProduction.id],
    }),
    material: one(materials, {
        fields: [formulaProductionIngredients.materialId],
        references: [materials.id],
    }),
}));

// Types
export type Formula = typeof formulas.$inferSelect;
export type NewFormula = typeof formulas.$inferInsert;
export type FormulaVersion = typeof formulaVersions.$inferSelect;
export type NewFormulaVersion = typeof formulaVersions.$inferInsert;
export type FormulaIngredient = typeof formulaIngredients.$inferSelect;
export type NewFormulaIngredient = typeof formulaIngredients.$inferInsert;
export type FormulaPackaging = typeof formulaPackaging.$inferSelect;
export type NewFormulaPackaging = typeof formulaPackaging.$inferInsert;
export type FormulaLabel = typeof formulaLabels.$inferSelect;
export type NewFormulaLabel = typeof formulaLabels.$inferInsert;
export type FormulaProduction = typeof formulaProduction.$inferSelect;
export type NewFormulaProduction = typeof formulaProduction.$inferInsert;
export type FormulaProductionIngredient = typeof formulaProductionIngredients.$inferSelect;
export type NewFormulaProductionIngredient = typeof formulaProductionIngredients.$inferInsert;