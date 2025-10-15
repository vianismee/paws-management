import { z } from "zod";

// Material Categories
export const createMaterialCategorySchema = z.object({
    name: z.string().min(1, "Category name is required"),
    description: z.string().optional(),
    codePrefix: z.string().min(1, "Code prefix is required").max(10, "Code prefix must be 10 characters or less"),
    isActive: z.boolean().default(true),
});

export const updateMaterialCategorySchema = createMaterialCategorySchema.partial();

// Materials
export const createMaterialSchema = z.object({
    name: z.string().min(1, "Material name is required"),
    description: z.string().optional(),
    categoryId: z.string().uuid("Invalid category ID"),
    unit: z.string().min(1, "Unit is required"),
    currentStock: z.string().transform((val) => val || "0"),
    minStockLevel: z.string().transform((val) => val || "0"),
    maxStockLevel: z.string().optional(),
    unitCost: z.string().min(1, "Unit cost is required"),
    isActive: z.boolean().default(true),
});

export const updateMaterialSchema = createMaterialSchema.partial();

// Suppliers
export const createSupplierSchema = z.object({
    name: z.string().min(1, "Supplier name is required"),
    code: z.string().min(1, "Supplier code is required"),
    contactPerson: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    isActive: z.boolean().default(true),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// Material Suppliers
export const createMaterialSupplierSchema = z.object({
    materialId: z.string().uuid("Invalid material ID"),
    supplierId: z.string().uuid("Invalid supplier ID"),
    supplierMaterialCode: z.string().optional(),
    unitCost: z.string().min(1, "Unit cost is required"),
    leadTimeDays: z.number().int().min(0).default(0),
    minimumOrderQuantity: z.string().transform((val) => val || "1"),
    isPreferred: z.boolean().default(false),
});

export const updateMaterialSupplierSchema = createMaterialSupplierSchema.partial();

// Stock Movements
export const createStockMovementSchema = z.object({
    materialId: z.string().uuid("Invalid material ID"),
    movementType: z.enum(["IN", "OUT", "ADJUSTMENT"]),
    quantity: z.string().min(1, "Quantity is required"),
    reason: z.string().min(1, "Reason is required"),
    reference: z.string().optional(),
    unitCost: z.string().optional(),
});

// Packaging Types
export const createPackagingTypeSchema = z.object({
    name: z.string().min(1, "Packaging name is required"),
    description: z.string().optional(),
    unit: z.string().min(1, "Unit is required"),
    unitCost: z.string().min(1, "Unit cost is required"),
    isActive: z.boolean().default(true),
});

export const updatePackagingTypeSchema = createPackagingTypeSchema.partial();

// Label Types
export const createLabelTypeSchema = z.object({
    name: z.string().min(1, "Label name is required"),
    description: z.string().optional(),
    dimensions: z.string().optional(),
    unitCost: z.string().min(1, "Unit cost is required"),
    isActive: z.boolean().default(true),
});

export const updateLabelTypeSchema = createLabelTypeSchema.partial();

// Query schemas
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const materialFilterSchema = paginationSchema.extend({
    categoryId: z.string().uuid().optional(),
    search: z.string().optional(),
    isActive: z.boolean().optional(),
    lowStock: z.boolean().optional(),
});

export const categoryFilterSchema = paginationSchema.extend({
    search: z.string().optional(),
    isActive: z.boolean().optional(),
});

// Types
export type CreateMaterialCategoryInput = z.infer<typeof createMaterialCategorySchema>;
export type UpdateMaterialCategoryInput = z.infer<typeof updateMaterialCategorySchema>;
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreateMaterialSupplierInput = z.infer<typeof createMaterialSupplierSchema>;
export type UpdateMaterialSupplierInput = z.infer<typeof updateMaterialSupplierSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type CreatePackagingTypeInput = z.infer<typeof createPackagingTypeSchema>;
export type UpdatePackagingTypeInput = z.infer<typeof updatePackagingTypeSchema>;
export type CreateLabelTypeInput = z.infer<typeof createLabelTypeSchema>;
export type UpdateLabelTypeInput = z.infer<typeof updateLabelTypeSchema>;

export type PaginationParams = z.infer<typeof paginationSchema>;
export type MaterialFilterParams = z.infer<typeof materialFilterSchema>;
export type CategoryFilterParams = z.infer<typeof categoryFilterSchema>;