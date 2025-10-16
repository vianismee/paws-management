import {
  pgTable,
  text,
  decimal,
  integer,
  timestamp,
  boolean,
  varchar,
  index
} from "drizzle-orm/pg-core";

// Categories table for organizing materials
export const categories = pgTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  description: text("description"),
  codePrefix: text("code_prefix").notNull(), // e.g., 'OIL', 'WAX', 'FRAGRANCE'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("categories_name_idx").on(table.name),
  codePrefixIdx: index("categories_code_prefix_idx").on(table.codePrefix),
}));

// Materials table with auto-generated codes
export const materials = pgTable("materials", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(), // Auto-generated like 'OIL-001'
  name: text("name").notNull(),
  description: text("description"),
  categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
  supplier: text("supplier"),
  supplierCode: text("supplier_code"),
  cost: decimal("cost", { precision: 12, scale: 2 }).notNull(), // Purchase cost (IDR)
  purchaseUnit: text("purchase_unit").notNull(), // Purchase unit (e.g., '100g', '1kg', '500ml')
  purchaseQuantity: decimal("purchase_quantity", { precision: 10, scale: 2 }).notNull(), // Purchase quantity (e.g., 100, 1, 500)
  costPerUnit: decimal("cost_per_unit", { precision: 12, scale: 2 }).notNull(), // Calculated cost per base unit (IDR/g, IDR/ml, IDR/pcs)
  unit: text("unit").notNull(), // Base unit (e.g., 'g', 'ml', 'pcs')
  currency: text("currency").default("IDR").notNull(), // Currency code
  minStockLevel: decimal("min_stock_level", { precision: 10, scale: 2 }).default("0"),
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).default("0"),
  reorderPoint: decimal("reorder_point", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  codeIdx: index("materials_code_idx").on(table.code),
  nameIdx: index("materials_name_idx").on(table.name),
  categoryIdx: index("materials_category_idx").on(table.categoryId),
  supplierIdx: index("materials_supplier_idx").on(table.supplier),
}));

// Packaging table
export const packaging = pgTable("packaging", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(), // Auto-generated like 'PKG-001'
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // e.g., 'bottle', 'jar', 'tube'
  size: text("size").notNull(), // e.g., '30ml', '100g'
  material: text("material"), // e.g., 'glass', 'plastic', 'aluminum'
  cost: decimal("cost", { precision: 12, scale: 2 }).notNull(), // Purchase cost (IDR)
  purchaseQuantity: integer("purchase_quantity").default(1), // Purchase quantity (e.g., 100 units)
  costPerUnit: decimal("cost_per_unit", { precision: 12, scale: 2 }).notNull(), // Calculated cost per unit (IDR/unit)
  currency: text("currency").default("IDR").notNull(), // Currency code
  supplier: text("supplier"),
  supplierCode: text("supplier_code"),
  minOrderQuantity: integer("min_order_quantity").default(1),
  currentStock: integer("current_stock").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  codeIdx: index("packaging_code_idx").on(table.code),
  nameIdx: index("packaging_name_idx").on(table.name),
  typeIdx: index("packaging_type_idx").on(table.type),
}));

// Labels table
export const labels = pgTable("labels", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(), // Auto-generated like 'LBL-001'
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // e.g., 'sticker', 'printed', 'embossed'
  size: text("size").notNull(), // e.g., '2x3', '5x7'
  material: text("material"), // e.g., 'paper', 'vinyl', 'polyester'
  cost: decimal("cost", { precision: 12, scale: 2 }).notNull(), // Purchase cost (IDR)
  purchaseQuantity: integer("purchase_quantity").default(1), // Purchase quantity (e.g., 100 units)
  costPerUnit: decimal("cost_per_unit", { precision: 12, scale: 2 }).notNull(), // Calculated cost per unit (IDR/unit)
  currency: text("currency").default("IDR").notNull(), // Currency code
  supplier: text("supplier"),
  supplierCode: text("supplier_code"),
  minOrderQuantity: integer("min_order_quantity").default(1),
  currentStock: integer("current_stock").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  codeIdx: index("labels_code_idx").on(table.code),
  nameIdx: index("labels_name_idx").on(table.name),
  typeIdx: index("labels_type_idx").on(table.type),
}));