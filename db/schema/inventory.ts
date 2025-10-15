import { pgTable, text, timestamp, decimal, integer, boolean, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const materialCategories = pgTable("material_categories", {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    codePrefix: text("code_prefix").notNull().unique(), // e.g., 'OIL', 'WAX', 'FRAG'
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const materials = pgTable("materials", {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(), // Auto-generated code like 'OIL-001'
    name: text("name").notNull(),
    description: text("description"),
    categoryId: text("category_id").notNull().references(() => materialCategories.id, { onDelete: "restrict" }),
    unit: text("unit").notNull(), // e.g., 'kg', 'L', 'g'
    currentStock: decimal("current_stock", { precision: 12, scale: 3 }).notNull().default("0"),
    minStockLevel: decimal("min_stock_level", { precision: 12, scale: 3 }).default("0"),
    maxStockLevel: decimal("max_stock_level", { precision: 12, scale: 3 }),
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(), // Cost per unit
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const packagingTypes = pgTable("packaging_types", {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    unit: text("unit").notNull(), // e.g., 'piece', 'box', 'set'
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const labelTypes = pgTable("label_types", {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    dimensions: text("dimensions"), // e.g., '50mm x 30mm'
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const suppliers = pgTable("suppliers", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    contactPerson: text("contact_person"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const materialSuppliers = pgTable("material_suppliers", {
    id: text("id").primaryKey(),
    materialId: text("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
    supplierId: text("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
    supplierMaterialCode: text("supplier_material_code"), // Material code as per supplier
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
    leadTimeDays: integer("lead_time_days").default(0),
    minimumOrderQuantity: decimal("minimum_order_quantity", { precision: 12, scale: 3 }).default("1"),
    isPreferred: boolean("is_preferred").default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const stockMovements = pgTable("stock_movements", {
    id: text("id").primaryKey(),
    materialId: text("material_id").notNull().references(() => materials.id, { onDelete: "restrict" }),
    movementType: text("movement_type").notNull(), // 'IN', 'OUT', 'ADJUSTMENT'
    quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
    remainingStock: decimal("remaining_stock", { precision: 12, scale: 3 }).notNull(),
    reason: text("reason").notNull(),
    reference: text("reference"), // e.g., PO number, Batch number
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }), // Cost at time of movement
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: text("created_by").references(() => materialCategories.id, { onDelete: "set null" }), // User who made the movement
});

// Relations
export const materialCategoriesRelations = relations(materialCategories, ({ many }) => ({
    materials: many(materials),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
    category: one(materialCategories, {
        fields: [materials.categoryId],
        references: [materialCategories.id],
    }),
    suppliers: many(materialSuppliers),
    stockMovements: many(stockMovements),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
    materials: many(materialSuppliers),
}));

export const materialSuppliersRelations = relations(materialSuppliers, ({ one }) => ({
    material: one(materials, {
        fields: [materialSuppliers.materialId],
        references: [materials.id],
    }),
    supplier: one(suppliers, {
        fields: [materialSuppliers.supplierId],
        references: [suppliers.id],
    }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
    material: one(materials, {
        fields: [stockMovements.materialId],
        references: [materials.id],
    }),
}));

// Types
export type MaterialCategory = typeof materialCategories.$inferSelect;
export type NewMaterialCategory = typeof materialCategories.$inferInsert;
export type Material = typeof materials.$inferSelect;
export type NewMaterial = typeof materials.$inferInsert;
export type PackagingType = typeof packagingTypes.$inferSelect;
export type NewPackagingType = typeof packagingTypes.$inferInsert;
export type LabelType = typeof labelTypes.$inferSelect;
export type NewLabelType = typeof labelTypes.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type MaterialSupplier = typeof materialSuppliers.$inferSelect;
export type NewMaterialSupplier = typeof materialSuppliers.$inferInsert;
export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;