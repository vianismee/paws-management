import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as authSchema from './schema/auth';
import * as inventorySchema from './schema/inventory';
import * as productsSchema from './schema/products';
import * as formulasSchema from './schema/formulas';
import * as cogsSchema from './schema/cogs';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...authSchema,
    ...inventorySchema,
    ...productsSchema,
    ...formulasSchema,
    ...cogsSchema,
  },
});

// Re-export all schemas
export * from './schema/auth';
export * from './schema/inventory';
export * from './schema/products';
export * from './schema/formulas';
export * from './schema/cogs';