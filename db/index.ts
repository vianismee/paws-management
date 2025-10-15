import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as authSchema from './schema/auth';
import * as inventorySchema from './schema/inventory';
import * as formulationsSchema from './schema/formulations';
import * as cogsSchema from './schema/cogs';

export const db = drizzle(process.env.DATABASE_URL!, {
    schema: { ...authSchema, ...inventorySchema, ...formulationsSchema, ...cogsSchema },
});

// Export all schemas for convenience
export { authSchema, inventorySchema, formulationsSchema, cogsSchema };

// Re-export main types
export type User = authSchema.user;
export type Session = authSchema.session;
export type Account = authSchema.account;
export type Verification = authSchema.verification;

export type MaterialCategory = inventorySchema.MaterialCategory;
export type Material = inventorySchema.Material;
export type PackagingType = inventorySchema.PackagingType;
export type LabelType = inventorySchema.LabelType;
export type Supplier = inventorySchema.Supplier;
export type MaterialSupplier = inventorySchema.MaterialSupplier;
export type StockMovement = inventorySchema.StockMovement;

export type Formula = formulationsSchema.Formula;
export type FormulaVersion = formulationsSchema.FormulaVersion;
export type FormulaIngredient = formulationsSchema.FormulaIngredient;
export type FormulaPackaging = formulationsSchema.FormulaPackaging;
export type FormulaLabel = formulationsSchema.FormulaLabel;
export type FormulaProduction = formulationsSchema.FormulaProduction;
export type FormulaProductionIngredient = formulationsSchema.FormulaProductionIngredient;

export type CogsCalculation = cogsSchema.CogsCalculation;
export type CogsIngredientCost = cogsSchema.CogsIngredientCost;
export type CogsPackagingCost = cogsSchema.CogsPackagingCost;
export type CogsLabelCost = cogsSchema.CogsLabelCost;
export type CostTemplate = cogsSchema.CostTemplate;
export type MaterialCostHistory = cogsSchema.MaterialCostHistory;
export type PricingRule = cogsSchema.PricingRule;