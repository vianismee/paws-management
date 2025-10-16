import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as authSchema from './schema/auth';
import * as inventorySchema from './schema/inventory';
import * as formulasSchema from './schema/formulas';
import * as cogsSchema from './schema/cogs';

// Client-side database connection for direct operations
export const clientDb = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...authSchema,
    ...inventorySchema,
    ...formulasSchema,
    ...cogsSchema,
  },
  // Connection pooling configuration for client-side operations
  // Note: In production, this should be configured with proper connection limits
  connection: {
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  }
});

// Re-export all schemas
export * from './schema/auth';
export * from './schema/inventory';
export * from './schema/formulas';
export * from './schema/cogs';

// Helper function for database operations with error handling
export async function executeDbOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    console.error(errorMessage, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}