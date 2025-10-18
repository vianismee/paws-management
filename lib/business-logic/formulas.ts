import { eq, desc, asc, sql, and } from 'drizzle-orm';
import { Decimal } from 'decimal.js';
import { clientDb, executeDbOperation } from '../client-db';
import {
  formulas,
  formulaVersions,
  formulaIngredients,
  productionBatches
} from '../../db/schema/formulas';
import { materials } from '../../db/schema/inventory';

// Type definitions
type Formula = typeof formulas.$inferSelect;
type FormulaVersion = typeof formulaVersions.$inferSelect;
type FormulaIngredient = typeof formulaIngredients.$inferSelect;
type ProductionBatch = typeof productionBatches.$inferSelect;
type Material = typeof materials.$inferSelect;

// Formulas
export async function getFormulas(options?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'draft' | 'active' | 'archived';
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}): Promise<{ formulas: Formula[]; total: number }> {
  const { page = 1, limit = 50, search, status, sortBy = 'name', sortOrder = 'desc' } = options || {};

  const result = await executeDbOperation(
    async () => {
      let whereConditions = sql`${formulas.isActive} = true`;

      if (search) {
        whereConditions = sql`${whereConditions} AND (${formulas.name} ILIKE ${'%' + search + '%'} OR ${formulas.description} ILIKE ${'%' + search + '%'})`;
      }

      if (status) {
        whereConditions = sql`${whereConditions} AND ${formulas.status} = ${status}`;
      }

      const orderByField = sortBy === 'createdAt' ? formulas.createdAt :
                          sortBy === 'updatedAt' ? formulas.updatedAt :
                          formulas.name;

      const orderBy = sortOrder === 'desc' ? desc(orderByField) : asc(orderByField);

      const [formulasData, totalCount] = await Promise.all([
        clientDb.query.formulas.findMany({
          where: whereConditions,
          orderBy: [orderBy],
          limit,
          offset: (page - 1) * limit
        }),
        clientDb.select({ count: sql<number>`count(*)` }).from(formulas).where(whereConditions)
      ]);

      return {
        formulas: formulasData,
        total: totalCount[0]?.count || 0
      };
    },
    'Failed to fetch formulas'
  );

  return result.success ? result.data || { formulas: [], total: 0 } : { formulas: [], total: 0 };
}

export async function getFormulaById(id: string): Promise<Formula | null> {
  const result = await executeDbOperation(
    () => clientDb.query.formulas.findFirst({
      where: eq(formulas.id, id)
    }),
    'Failed to fetch formula'
  );

  return result.success ? result.data || null : null;
}

export async function createFormula(data: Omit<typeof formulas.$inferInsert, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Formula | null> {
  const result = await executeDbOperation(
    async () => {
      const [formula] = await clientDb.insert(formulas).values({
        ...data,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return formula;
    },
    'Failed to create formula'
  );

  return result.success ? result.data : null;
}

export async function updateFormula(id: string, data: Partial<Omit<typeof formulas.$inferInsert, 'id' | 'version' | 'createdAt' | 'updatedAt'>>): Promise<Formula | null> {
  const result = await executeDbOperation(
    async () => {
      const [formula] = await clientDb.update(formulas).set({
        ...data,
        updatedAt: new Date()
      }).where(eq(formulas.id, id)).returning();
      return formula;
    },
    'Failed to update formula'
  );

  return result.success ? result.data : null;
}

// Formula Versions
export async function getFormulaVersions(formulaId: string): Promise<FormulaVersion[]> {
  const result = await executeDbOperation(
    () => clientDb.query.formulaVersions.findMany({
      where: eq(formulaVersions.formulaId, formulaId),
      orderBy: [desc(formulaVersions.version)]
    }),
    'Failed to fetch formula versions'
  );

  return result.success ? result.data || [] : [];
}

export async function createFormulaVersion(
  formulaId: string,
  data: Omit<typeof formulaVersions.$inferInsert, 'id' | 'formulaId' | 'createdAt'>
): Promise<FormulaVersion | null> {
  const result = await executeDbOperation(
    async () => {
      // Get the next version number
      const lastVersion = await clientDb.query.formulaVersions.findFirst({
        where: eq(formulaVersions.formulaId, formulaId),
        orderBy: [desc(formulaVersions.version)],
        columns: { version: true }
      });

      const nextVersion = (lastVersion?.version || 0) + 1;

      const [version] = await clientDb.insert(formulaVersions).values({
        ...data,
        formulaId,
        version: nextVersion,
        createdAt: new Date()
      }).returning();

      return version;
    },
    'Failed to create formula version'
  );

  return result.success ? result.data : null;
}

export async function getFormulaVersionWithIngredients(versionId: string): Promise<{
  version: FormulaVersion | null;
  ingredients: (FormulaIngredient & { material: Material })[];
}> {
  const result = await executeDbOperation(
    async () => {
      const version = await clientDb.query.formulaVersions.findFirst({
        where: eq(formulaVersions.id, versionId)
      });

      if (!version) {
        return { version: null, ingredients: [] };
      }

      const ingredients = await clientDb.query.formulaIngredients.findMany({
        where: eq(formulaIngredients.formulaVersionId, versionId),
        with: {
          material: true
        }
      });

      return { version, ingredients };
    },
    'Failed to fetch formula version with ingredients'
  );

  return result.success ? result.data || { version: null, ingredients: [] } : { version: null, ingredients: [] };
}

// Formula Ingredients
export async function updateFormulaIngredients(
  versionId: string,
  ingredients: Array<{
    materialId: string;
    percentage: number;
    weight: number;
    notes?: string;
  }>
): Promise<boolean> {
  const result = await executeDbOperation(
    async () => {
      await clientDb.transaction(async (tx) => {
        // Delete existing ingredients
        await tx.delete(formulaIngredients).where(eq(formulaIngredients.formulaVersionId, versionId));

        // Insert new ingredients
        if (ingredients.length > 0) {
          await tx.insert(formulaIngredients).values(
            ingredients.map(ing => ({
              ...ing,
              formulaVersionId: versionId,
              percentage: new Decimal(ing.percentage).toString(),
              weight: new Decimal(ing.weight).toString(),
              createdAt: new Date()
            }))
          );
        }
      });
      return true;
    },
    'Failed to update formula ingredients'
  );

  return result.success;
}

export async function validateFormulaPercentages(ingredients: Array<{ percentage: number }>): Promise<{
  isValid: boolean;
  total: Decimal;
  error?: string;
}> {
  const total = ingredients.reduce((sum, ing) => {
    return sum.plus(new Decimal(ing.percentage));
  }, new Decimal(0));

  const isValid = total.equals(new Decimal(100));

  return {
    isValid,
    total,
    error: isValid ? undefined : `Total percentage must equal 100%. Current total: ${total.toString()}%`
  };
}

// Production Batches
export async function getProductionBatches(options?: {
  page?: number;
  limit?: number;
  formulaId?: string;
  status?: 'planned' | 'in_progress' | 'completed' | 'failed';
  sortBy?: 'productionDate' | 'batchNumber' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}): Promise<{ batches: ProductionBatch[]; total: number }> {
  const { page = 1, limit = 50, formulaId, status, sortBy = 'productionDate', sortOrder = 'desc' } = options || {};

  const result = await executeDbOperation(
    async () => {
      let whereConditions = sql`1=1`;

      if (formulaId) {
        whereConditions = sql`${whereConditions} AND ${productionBatches.formulaVersionId} IN (
          SELECT id FROM formula_versions WHERE formula_id = ${formulaId}
        )`;
      }

      if (status) {
        whereConditions = sql`${whereConditions} AND ${productionBatches.status} = ${status}`;
      }

      const orderByField = sortBy === 'batchNumber' ? productionBatches.batchNumber :
                          sortBy === 'createdAt' ? productionBatches.createdAt :
                          productionBatches.productionDate;

      const orderBy = sortOrder === 'desc' ? desc(orderByField) : asc(orderByField);

      const [batchesData, totalCount] = await Promise.all([
        clientDb.query.productionBatches.findMany({
          where: whereConditions,
          orderBy: [orderBy],
          limit,
          offset: (page - 1) * limit,
          with: {
            formulaVersion: {
              with: {
                formula: true
              }
            }
          }
        }),
        clientDb.select({ count: sql<number>`count(*)` }).from(productionBatches).where(whereConditions)
      ]);

      return {
        batches: batchesData,
        total: totalCount[0]?.count || 0
      };
    },
    'Failed to fetch production batches'
  );

  return result.success ? result.data || { batches: [], total: 0 } : { batches: [], total: 0 };
}

export async function createProductionBatch(data: Omit<typeof productionBatches.$inferInsert, 'id' | 'batchNumber' | 'createdAt' | 'updatedAt'>): Promise<ProductionBatch | null> {
  const result = await executeDbOperation(
    async () => {
      // Generate batch number
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

      const lastBatch = await clientDb.query.productionBatches.findFirst({
        where: sql`${productionBatches.batchNumber} LIKE ${'BATCH-' + dateStr + '%'}`,
        orderBy: [desc(productionBatches.batchNumber)],
        columns: { batchNumber: true }
      });

      let nextNumber = 1;
      if (lastBatch?.batchNumber) {
        const lastNumber = parseInt(lastBatch.batchNumber.split('-')[2] || '0');
        nextNumber = lastNumber + 1;
      }

      const batchNumber = `BATCH-${dateStr}-${nextNumber.toString().padStart(3, '0')}`;

      const [batch] = await clientDb.insert(productionBatches).values({
        ...data,
        batchNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return batch;
    },
    'Failed to create production batch'
  );

  return result.success ? result.data : null;
}