import {
  pgTable,
  text,
  decimal,
  timestamp,
  boolean,
  index
} from "drizzle-orm/pg-core";

// Products table - finished goods that have formulations
export const products = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  sku: text("sku").unique().notNull(),
  category: text("category"),
  unit: text("unit").notNull(), // 'pcs', 'ml', 'g' etc.
  volume: decimal("volume", { precision: 10, scale: 2 }), // volume per product
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }), // final unit price in IDR (optional initially)
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }), // final retail price in IDR (optional)
  wholesalePrice: decimal("wholesale_price", { precision: 10, scale: 2 }), // final wholesale price in IDR (optional)
  priceNotes: text("price_notes"), // notes about pricing calculation
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("products_name_idx").on(table.name),
  skuIdx: index("products_sku_idx").on(table.sku),
  categoryIdx: index("products_category_idx").on(table.category),
  createdByIdx: index("products_created_by_idx").on(table.createdBy),
}));