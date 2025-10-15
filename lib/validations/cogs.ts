import { z } from "zod";

// COGS Calculations
export const createCogsCalculationSchema = z.object({
    formulaVersionId: z.string().uuid("Invalid formula version ID"),
    batchSize: z.string().min(1, "Batch size is required"),
    batchUnit: z.string().min(1, "Batch unit is required"),
    producedUnits: z.string().min(1, "Produced units is required"),
    wastePercentage: z.string().transform((val) => val || "0"),
    laborHours: z.string().transform((val) => val || "0"),
    laborRatePerHour: z.string().transform((val) => val || "0"),
    overheadCost: z.string().transform((val) => val || "0"),
    status: z.enum(["calculated", "approved", "archived"]).default("calculated"),
    notes: z.string().optional(),
});

export const updateCogsCalculationSchema = createCogsCalculationSchema.partial();

// COGS Calculation Request (for on-demand calculations)
export const calculateCogsSchema = z.object({
    formulaVersionId: z.string().uuid("Invalid formula version ID"),
    batchSize: z.string().min(1, "Batch size is required"),
    producedUnits: z.string().min(1, "Produced units are required"),
    packagingCosts: z.array(z.object({
        name: z.string(),
        quantity: z.string(),
        unitCost: z.string(),
    })).optional(),
    labelCosts: z.array(z.object({
        name: z.string(),
        quantity: z.string(),
        unitCost: z.string(),
    })).optional(),
    wastePercentage: z.string().transform((val) => val || "0"),
    laborHours: z.string().transform((val) => val || "0"),
    laborRatePerHour: z.string().transform((val) => val || "0"),
    overheadCost: z.string().transform((val) => val || "0"),
    saveCalculation: z.boolean().default(true),
    notes: z.string().optional(),
});

// Cost Templates
export const createCostTemplateSchema = z.object({
    name: z.string().min(1, "Template name is required"),
    description: z.string().optional(),
    productType: z.string().min(1, "Product type is required"),
    defaultWastePercentage: z.string().transform((val) => val || "5"),
    defaultLaborHours: z.string().transform((val) => val || "1"),
    defaultLaborRatePerHour: z.string().transform((val) => val || "25"),
    defaultOverheadPercentage: z.string().transform((val) => val || "10"),
    isActive: z.boolean().default(true),
});

export const updateCostTemplateSchema = createCostTemplateSchema.partial();

// Material Cost History
export const createMaterialCostHistorySchema = z.object({
    materialId: z.string().uuid("Invalid material ID"),
    unitCost: z.string().min(1, "Unit cost is required"),
    effectiveDate: z.coerce.date().default(() => new Date()),
    supplier: z.string().optional(),
    reason: z.string().optional(),
});

export const updateMaterialCostHistorySchema = createMaterialCostHistorySchema.partial();

// Pricing Rules
export const createPricingRuleSchema = z.object({
    name: z.string().min(1, "Rule name is required"),
    description: z.string().optional(),
    productType: z.string().optional(),
    markupType: z.enum(["percentage", "fixed_amount", "target_margin"]),
    markupValue: z.string().min(1, "Markup value is required"),
    minQuantity: z.string().transform((val) => val || "1"),
    maxQuantity: z.string().optional(),
    isActive: z.boolean().default(true),
    priority: z.number().int().min(1).default(1),
});

export const updatePricingRuleSchema = createPricingRuleSchema.partial();

// Query schemas
export const cogsCalculationFilterSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    formulaVersionId: z.string().uuid().optional(),
    status: z.enum(["calculated", "approved", "archived"]).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
});

export const costTemplateFilterSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    productType: z.string().optional(),
    isActive: z.boolean().optional(),
});

export const materialCostHistoryFilterSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    materialId: z.string().uuid().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
});

export const pricingRuleFilterSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    productType: z.string().optional(),
    isActive: z.boolean().optional(),
    markupType: z.enum(["percentage", "fixed_amount", "target_margin"]).optional(),
});

// Types
export type CreateCogsCalculationInput = z.infer<typeof createCogsCalculationSchema>;
export type UpdateCogsCalculationInput = z.infer<typeof updateCogsCalculationSchema>;
export type CalculateCogsInput = z.infer<typeof calculateCogsSchema>;
export type CreateCostTemplateInput = z.infer<typeof createCostTemplateSchema>;
export type UpdateCostTemplateInput = z.infer<typeof updateCostTemplateSchema>;
export type CreateMaterialCostHistoryInput = z.infer<typeof createMaterialCostHistorySchema>;
export type UpdateMaterialCostHistoryInput = z.infer<typeof updateMaterialCostHistorySchema>;
export type CreatePricingRuleInput = z.infer<typeof createPricingRuleSchema>;
export type UpdatePricingRuleInput = z.infer<typeof updatePricingRuleSchema>;

export type CogsCalculationFilterParams = z.infer<typeof cogsCalculationFilterSchema>;
export type CostTemplateFilterParams = z.infer<typeof costTemplateFilterSchema>;
export type MaterialCostHistoryFilterParams = z.infer<typeof materialCostHistoryFilterSchema>;
export type PricingRuleFilterParams = z.infer<typeof pricingRuleFilterSchema>;