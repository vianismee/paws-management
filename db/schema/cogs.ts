import { pgTable, text, timestamp, decimal, integer, boolean, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { formulaVersions } from "./formulations";
import { materials } from "./inventory";

export const cogsCalculations = pgTable("cogs_calculations", {
    id: text("id").primaryKey(),
    formulaVersionId: text("formula_version_id").notNull().references(() => formulaVersions.id, { onDelete: "cascade" }),
    calculationDate: timestamp("calculation_date").notNull().defaultNow(),
    batchSize: decimal("batch_size", { precision: 12, scale: 3 }).notNull(),
    batchUnit: text("batch_unit").notNull(),
    
    // Cost breakdowns
    ingredientsCost: decimal("ingredients_cost", { precision: 12, scale: 2 }).notNull(),
    packagingCost: decimal("packaging_cost", { precision: 12, scale: 2 }).notNull().default("0"),
    labelCost: decimal("label_cost", { precision: 12, scale: 2 }).notNull().default("0"),
    laborCost: decimal("labor_cost", { precision: 12, scale: 2 }).notNull().default("0"),
    overheadCost: decimal("overhead_cost", { precision: 12, scale: 2 }).notNull().default("0"),
    
    // Totals
    totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull(),
    costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
    producedUnits: decimal("produced_units", { precision: 12, scale: 3 }).notNull(),
    
    // Additional cost factors
    wastePercentage: decimal("waste_percentage", { precision: 5, scale: 2 }).notNull().default("0"),
    laborHours: decimal("labor_hours", { precision: 8, scale: 2 }).notNull().default("0"),
    laborRatePerHour: decimal("labor_rate_per_hour", { precision: 8, scale: 2 }).notNull().default("0"),
    
    status: text("status").notNull().default('calculated'), // 'calculated', 'approved', 'archived'
    notes: text("notes"),
    calculatedBy: text("calculated_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cogsIngredientCosts = pgTable("cogs_ingredient_costs", {
    id: text("id").primaryKey(),
    cogsCalculationId: text("cogs_calculation_id").notNull().references(() => cogsCalculations.id, { onDelete: "cascade" }),
    materialId: text("material_id").notNull().references(() => materials.id, { onDelete: "restrict" }),
    materialName: text("material_name").notNull(), // Denormalized for historical accuracy
    percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
    quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
    unit: text("unit").notNull(),
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
    totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cogsPackagingCosts = pgTable("cogs_packaging_costs", {
    id: text("id").primaryKey(),
    cogsCalculationId: text("cogs_calculation_id").notNull().references(() => cogsCalculations.id, { onDelete: "cascade" }),
    packagingName: text("packaging_name").notNull(),
    quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
    unit: text("unit").notNull(),
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
    totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cogsLabelCosts = pgTable("cogs_label_costs", {
    id: text("id").primaryKey(),
    cogsCalculationId: text("cogs_calculation_id").notNull().references(() => cogsCalculations.id, { onDelete: "cascade" }),
    labelName: text("label_name").notNull(),
    quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
    unit: text("unit").notNull(),
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
    totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const costTemplates = pgTable("cost_templates", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    productType: text("product_type").notNull(),
    
    // Default cost assumptions
    defaultWastePercentage: decimal("default_waste_percentage", { precision: 5, scale: 2 }).notNull().default("5"),
    defaultLaborHours: decimal("default_labor_hours", { precision: 8, scale: 2 }).notNull().default("1"),
    defaultLaborRatePerHour: decimal("default_labor_rate_per_hour", { precision: 8, scale: 2 }).notNull().default("25"),
    defaultOverheadPercentage: decimal("default_overhead_percentage", { precision: 5, scale: 2 }).notNull().default("10"),
    
    isActive: boolean("is_active").notNull().default(true),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const materialCostHistory = pgTable("material_cost_history", {
    id: text("id").primaryKey(),
    materialId: text("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
    effectiveDate: timestamp("effective_date").notNull().defaultNow(),
    supplier: text("supplier"), // Supplier who provided this cost
    reason: text("reason"), // Reason for cost change
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pricingRules = pgTable("pricing_rules", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    productType: text("product_type"),
    
    // Markup rules
    markupType: text("markup_type").notNull(), // 'percentage', 'fixed_amount', 'target_margin'
    markupValue: decimal("markup_value", { precision: 8, scale: 2 }).notNull(),
    
    // Pricing tiers
    minQuantity: decimal("min_quantity", { precision: 12, scale: 3 }).notNull().default("1"),
    maxQuantity: decimal("max_quantity", { precision: 12, scale: 3 }),
    
    isActive: boolean("is_active").notNull().default(true),
    priority: integer("priority").notNull().default(1), // Higher priority rules applied first
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const cogsCalculationsRelations = relations(cogsCalculations, ({ one, many }) => ({
    formulaVersion: one(formulaVersions, {
        fields: [cogsCalculations.formulaVersionId],
        references: [formulaVersions.id],
    }),
    ingredientCosts: many(cogsIngredientCosts),
    packagingCosts: many(cogsPackagingCosts),
    labelCosts: many(cogsLabelCosts),
}));

export const cogsIngredientCostsRelations = relations(cogsIngredientCosts, ({ one }) => ({
    cogsCalculation: one(cogsCalculations, {
        fields: [cogsIngredientCosts.cogsCalculationId],
        references: [cogsCalculations.id],
    }),
    material: one(materials, {
        fields: [cogsIngredientCosts.materialId],
        references: [materials.id],
    }),
}));

export const materialCostHistoryRelations = relations(materialCostHistory, ({ one }) => ({
    material: one(materials, {
        fields: [materialCostHistory.materialId],
        references: [materials.id],
    }),
}));

// Types
export type CogsCalculation = typeof cogsCalculations.$inferSelect;
export type NewCogsCalculation = typeof cogsCalculations.$inferInsert;
export type CogsIngredientCost = typeof cogsIngredientCosts.$inferSelect;
export type NewCogsIngredientCost = typeof cogsIngredientCosts.$inferInsert;
export type CogsPackagingCost = typeof cogsPackagingCosts.$inferSelect;
export type NewCogsPackagingCost = typeof cogsPackagingCosts.$inferInsert;
export type CogsLabelCost = typeof cogsLabelCosts.$inferSelect;
export type NewCogsLabelCost = typeof cogsLabelCosts.$inferInsert;
export type CostTemplate = typeof costTemplates.$inferSelect;
export type NewCostTemplate = typeof costTemplates.$inferInsert;
export type MaterialCostHistory = typeof materialCostHistory.$inferSelect;
export type NewMaterialCostHistory = typeof materialCostHistory.$inferInsert;
export type PricingRule = typeof pricingRules.$inferSelect;
export type NewPricingRule = typeof pricingRules.$inferInsert;