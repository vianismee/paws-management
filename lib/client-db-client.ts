// Client-safe database exports
// This file exports only types and mock functions for client-side use

// Re-export all schemas
export * from '../db/schema/auth';
export * from '../db/schema/inventory';
export * from '../db/schema/formulas';
export * from '../db/schema/cogs';

// Mock database client for client-side use
export const clientDb = null;

// Mock executeDbOperation function
export const executeDbOperation = async <T,>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<{ success: boolean; data?: T; error?: string }> => {
  console.warn('Database operation attempted on client side. This should use API routes instead.');
  return { success: false, error: 'Database operations not available on client side' };
};