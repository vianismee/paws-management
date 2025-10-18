import 'dotenv/config';
import * as authSchema from '../db/schema/auth';
import * as inventorySchema from '../db/schema/inventory';
import * as formulasSchema from '../db/schema/formulas';
import * as cogsSchema from '../db/schema/cogs';

// Only import drizzle on server side
const getDatabaseClient = () => {
  if (typeof window !== 'undefined') {
    // Client-side - return null
    return null;
  }

  // Server-side - import and create database client
  const { drizzle } = require('drizzle-orm/node-postgres');
  return drizzle(process.env.DATABASE_URL!, {
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
};

export const clientDb = getDatabaseClient();

// Re-export all schemas
export * from '../db/schema/auth';
export * from '../db/schema/inventory';
export * from '../db/schema/formulas';
export * from '../db/schema/cogs';

// Helper function for database operations with error handling
export async function executeDbOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<{ success: boolean; data?: T; error?: string }> {
  // Check if we're on client side
  if (typeof window !== 'undefined') {
    console.warn('Database operation attempted on client side. This should use API routes instead.');
    return { success: false, error: 'Database operations not available on client side' };
  }

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