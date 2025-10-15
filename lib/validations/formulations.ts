import { z } from "zod";

// Formulas
export const createFormulaSchema = z.object({
    name: z.string().min(1, "Formula name is required"),
    description: z.string().optional(),
    productType: z.string().min(1, "Product type is required"),
    targetBatchSize: z.string().min(1, "Target batch size is required"),
    batchSizeUnit: z.string().min(1, "Batch size unit is required"),
    status: z.enum(["draft", "active", "inactive", "archived"]).default("draft"),
    version: z.number().int().min(1).default(1),
    isActive: z.boolean().default(true),
});

export const updateFormulaSchema = createFormulaSchema.partial();

// Formula Versions
export const createFormulaVersionSchema = z.object({
    formulaId: z.string().uuid("Invalid formula ID"),
    version: z.number().int().min(1),
    name: z.string().min(1, "Version name is required"),
    description: z.string().optional(),
    targetBatchSize: z.string().min(1, "Target batch size is required"),
    batchSizeUnit: z.string().min(1, "Batch size unit is required"),
    status: z.enum(["draft", "active", "inactive", "archived"]).default("draft"),
    notes: z.string().optional(),
    isCurrent: z.boolean().default(false),
    effectiveDate: z.coerce.date().optional(),
    expiryDate: z.coerce.date().optional(),
});

export const updateFormulaVersionSchema = createFormulaVersionSchema.partial();

// Formula Ingredients
export const createFormulaIngredientSchema = z.object({
    formulaVersionId: z.string().uuid("Invalid formula version ID"),
    materialId: z.string().uuid("Invalid material ID"),
    percentage: z.string().min(0, "Percentage must be non-negative").max("100", "Percentage cannot exceed 100"),
    quantity: z.string().min(1, "Quantity is required"),
    unit: z.string().min(1, "Unit is required"),
    order: z.number().int().min(0).default(0),
    notes: z.string().optional(),
});

export const updateFormulaIngredientSchema = createFormulaIngredientSchema.partial();

export const bulkCreateFormulaIngredientsSchema = z.object({
    formulaVersionId: z.string().uuid("Invalid formula version ID"),
    ingredients: z.array(createFormulaIngredientSchema.omit({ formulaVersionId: true })),
});

// Formula Packaging
export const createFormulaPackagingSchema = z.object({
    formulaVersionId: z.string().uuid("Invalid formula version ID"),
    packagingTypeId: z.string().uuid("Invalid packaging type ID"),
    packagingName: z.string().min(1, "Packaging name is required"),
    quantity: z.string().min(1, "Quantity is required"),
    unit: z.string().min(1, "Unit is required"),
    unitCost: z.string().min(1, "Unit cost is required"),
});

export const updateFormulaPackagingSchema = createFormulaPackagingSchema.partial();

// Formula Labels
export const createFormulaLabelSchema = z.object({
    formulaVersionId: z.string().uuid("Invalid formula version ID"),
    labelTypeId: z.string().uuid("Invalid label type ID"),
    labelName: z.string().min(1, "Label name is required"),
    quantity: z.string().min(1, "Quantity is required"),
    unit: z.string().min(1, "Unit is required"),
    unitCost: z.string().min(1, "Unit cost is required"),
});

export const updateFormulaLabelSchema = createFormulaLabelSchema.partial();

// Formula Production
export const createFormulaProductionSchema = z.object({
    formulaVersionId: z.string().uuid("Invalid formula version ID"),
    batchNumber: z.string().min(1, "Batch number is required"),
    actualBatchSize: z.string().min(1, "Actual batch size is required"),
    producedQuantity: z.string().min(1, "Produced quantity is required"),
    status: z.enum(["planned", "in_progress", "completed", "cancelled"]).default("planned"),
    productionDate: z.coerce.date(),
    completionDate: z.coerce.date().optional(),
    notes: z.string().optional(),
});

export const updateFormulaProductionSchema = createFormulaProductionSchema.partial();

// Formula Production Ingredients
export const createFormulaProductionIngredientSchema = z.object({
    productionId: z.string().uuid("Invalid production ID"),
    materialId: z.string().uuid("Invalid material ID"),
    plannedQuantity: z.string().min(1, "Planned quantity is required"),
    actualQuantity: z.string().optional(),
    unit: z.string().min(1, "Unit is required"),
    unitCost: z.string().min(1, "Unit cost is required"),
});

export const updateFormulaProductionIngredientSchema = createFormulaProductionIngredientSchema.partial();

// Query schemas
export const formulaFilterSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    productType: z.string().optional(),
    status: z.enum(["draft", "active", "inactive", "archived"]).optional(),
    isActive: z.boolean().optional(),
});

export const formulaVersionFilterSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    formulaId: z.string().uuid().optional(),
    status: z.enum(["draft", "active", "inactive", "archived"]).optional(),
    isCurrent: z.boolean().optional(),
});

// Formula creation with ingredients
export const createFormulaWithIngredientsSchema = z.object({
    formula: createFormulaSchema,
    version: createFormulaVersionSchema.omit({ formulaId: true }),
    ingredients: z.array(createFormulaIngredientSchema.omit({ formulaVersionId: true })),
});

// Types
export type CreateFormulaInput = z.infer<typeof createFormulaSchema>;
export type UpdateFormulaInput = z.infer<typeof updateFormulaSchema>;
export type CreateFormulaVersionInput = z.infer<typeof createFormulaVersionSchema>;
export type UpdateFormulaVersionInput = z.infer<typeof updateFormulaVersionSchema>;
export type CreateFormulaIngredientInput = z.infer<typeof createFormulaIngredientSchema>;
export type UpdateFormulaIngredientInput = z.infer<typeof updateFormulaIngredientSchema>;
export type BulkCreateFormulaIngredientsInput = z.infer<typeof bulkCreateFormulaIngredientsSchema>;
export type CreateFormulaPackagingInput = z.infer<typeof createFormulaPackagingSchema>;
export type UpdateFormulaPackagingInput = z.infer<typeof updateFormulaPackagingSchema>;
export type CreateFormulaLabelInput = z.infer<typeof createFormulaLabelSchema>;
export type UpdateFormulaLabelInput = z.infer<typeof updateFormulaLabelSchema>;
export type CreateFormulaProductionInput = z.infer<typeof createFormulaProductionSchema>;
export type UpdateFormulaProductionInput = z.infer<typeof updateFormulaProductionSchema>;
export type CreateFormulaProductionIngredientInput = z.infer<typeof createFormulaProductionIngredientSchema>;
export type UpdateFormulaProductionIngredientInput = z.infer<typeof updateFormulaProductionIngredientSchema>;
export type FormulaFilterParams = z.infer<typeof formulaFilterSchema>;
export type FormulaVersionFilterParams = z.infer<typeof formulaVersionFilterSchema>;
export type CreateFormulaWithIngredientsInput = z.infer<typeof createFormulaWithIngredientsSchema>;