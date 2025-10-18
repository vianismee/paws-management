import { eq, desc, asc, like, sql } from 'drizzle-orm';
import { clientDb, executeDbOperation } from '../client-db';
import { materials, categories, packaging, labels } from '../../db/schema/inventory';

// Type definitions
type Category = typeof categories.$inferSelect;
type Material = typeof materials.$inferSelect;
type Packaging = typeof packaging.$inferSelect;
type Label = typeof labels.$inferSelect;

// Categories
export async function getCategories(): Promise<Category[]> {
  const result = await executeDbOperation(
    () => clientDb.query.categories.findMany({
      orderBy: [asc(categories.name)],
      where: eq(categories.isActive, true)
    }),
    'Failed to fetch categories'
  );

  return result.success ? result.data || [] : [];
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const result = await executeDbOperation(
    () => clientDb.query.categories.findFirst({
      where: eq(categories.id, id)
    }),
    'Failed to fetch category'
  );

  return result.success ? result.data || null : null;
}

export async function createCategory(data: Omit<typeof categories.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category | null> {
  const result = await executeDbOperation(
    async () => {
      const [category] = await clientDb.insert(categories).values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return category;
    },
    'Failed to create category'
  );

  return result.success ? result.data : null;
}

// Materials
export async function getMaterials(options?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  sortBy?: 'name' | 'code' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}): Promise<{ materials: Material[]; total: number }> {
  const { page = 1, limit = 50, search, categoryId, sortBy = 'name', sortOrder = 'asc' } = options || {};

  const result = await executeDbOperation(
    async () => {
      let whereConditions = sql`${materials.isActive} = true`;

      if (search) {
        whereConditions = sql`${whereConditions} AND (${materials.name} ILIKE ${'%' + search + '%'} OR ${materials.code} ILIKE ${'%' + search + '%'} OR ${materials.supplier} ILIKE ${'%' + search + '%'})`;
      }

      if (categoryId) {
        whereConditions = sql`${whereConditions} AND ${materials.categoryId} = ${categoryId}`;
      }

      const orderByField = sortBy === 'code' ? materials.code :
                          sortBy === 'createdAt' ? materials.createdAt :
                          materials.name;

      const orderBy = sortOrder === 'desc' ? desc(orderByField) : asc(orderByField);

      const [materialsData, totalCount] = await Promise.all([
        clientDb.query.materials.findMany({
          where: whereConditions,
          orderBy: [orderBy],
          limit,
          offset: (page - 1) * limit,
          with: {
            category: true
          }
        }),
        clientDb.select({ count: sql<number>`count(*)` }).from(materials).where(whereConditions)
      ]);

      return {
        materials: materialsData,
        total: totalCount[0]?.count || 0
      };
    },
    'Failed to fetch materials'
  );

  return result.success ? result.data || { materials: [], total: 0 } : { materials: [], total: 0 };
}

export async function getMaterialById(id: string): Promise<Material | null> {
  const result = await executeDbOperation(
    () => clientDb.query.materials.findFirst({
      where: eq(materials.id, id),
      with: {
        category: true
      }
    }),
    'Failed to fetch material'
  );

  return result.success ? result.data || null : null;
}

export async function createMaterial(data: Omit<typeof materials.$inferInsert, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Promise<Material | null> {
  const result = await executeDbOperation(
    async () => {
      // Generate auto-code based on category
      const category = await clientDb.query.categories.findFirst({
        where: eq(categories.id, data.categoryId)
      });

      if (!category) {
        throw new Error('Category not found');
      }

      // Get the next number for this category
      const lastMaterial = await clientDb.query.materials.findFirst({
        where: like(materials.code, `${category.codePrefix}%`),
        orderBy: [desc(materials.code)],
        columns: { code: true }
      });

      let nextNumber = 1;
      if (lastMaterial?.code) {
        const lastNumber = parseInt(lastMaterial.code.split('-')[1] || '0');
        nextNumber = lastNumber + 1;
      }

      const code = `${category.codePrefix}-${nextNumber.toString().padStart(3, '0')}`;

      const [material] = await clientDb.insert(materials).values({
        ...data,
        code,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return material;
    },
    'Failed to create material'
  );

  return result.success ? result.data : null;
}

export async function updateMaterial(id: string, data: Partial<Omit<typeof materials.$inferInsert, 'id' | 'code' | 'createdAt' | 'updatedAt'>>): Promise<Material | null> {
  const result = await executeDbOperation(
    async () => {
      const [material] = await clientDb.update(materials).set({
        ...data,
        updatedAt: new Date()
      }).where(eq(materials.id, id)).returning();
      return material;
    },
    'Failed to update material'
  );

  return result.success ? result.data : null;
}

export async function deleteMaterial(id: string): Promise<boolean> {
  const result = await executeDbOperation(
    async () => {
      await clientDb.update(materials).set({
        isActive: false,
        updatedAt: new Date()
      }).where(eq(materials.id, id));
      return true;
    },
    'Failed to delete material'
  );

  return result.success;
}

// Packaging
export async function getPackaging(options?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'code' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}): Promise<{ packaging: Packaging[]; total: number }> {
  const { page = 1, limit = 50, search, sortBy = 'name', sortOrder = 'asc' } = options || {};

  const result = await executeDbOperation(
    async () => {
      let whereConditions = sql`${packaging.isActive} = true`;

      if (search) {
        whereConditions = sql`${whereConditions} AND (${packaging.name} ILIKE ${'%' + search + '%'} OR ${packaging.code} ILIKE ${'%' + search + '%'} OR ${packaging.supplier} ILIKE ${'%' + search + '%'})`;
      }

      const orderByField = sortBy === 'code' ? packaging.code :
                          sortBy === 'createdAt' ? packaging.createdAt :
                          packaging.name;

      const orderBy = sortOrder === 'desc' ? desc(orderByField) : asc(orderByField);

      const [packagingData, totalCount] = await Promise.all([
        clientDb.query.packaging.findMany({
          where: whereConditions,
          orderBy: [orderBy],
          limit,
          offset: (page - 1) * limit
        }),
        clientDb.select({ count: sql<number>`count(*)` }).from(packaging).where(whereConditions)
      ]);

      return {
        packaging: packagingData,
        total: totalCount[0]?.count || 0
      };
    },
    'Failed to fetch packaging'
  );

  return result.success ? result.data || { packaging: [], total: 0 } : { packaging: [], total: 0 };
}

export async function createPackaging(data: Omit<typeof packaging.$inferInsert, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Promise<Packaging | null> {
  const result = await executeDbOperation(
    async () => {
      // Generate auto-code
      const lastPackaging = await clientDb.query.packaging.findFirst({
        orderBy: [desc(packaging.code)],
        columns: { code: true }
      });

      let nextNumber = 1;
      if (lastPackaging?.code) {
        const lastNumber = parseInt(lastPackaging.code.split('-')[1] || '0');
        nextNumber = lastNumber + 1;
      }

      const code = `PKG-${nextNumber.toString().padStart(3, '0')}`;

      const [packagingItem] = await clientDb.insert(packaging).values({
        ...data,
        code,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return packagingItem;
    },
    'Failed to create packaging'
  );

  return result.success ? result.data : null;
}

// Labels
export async function getLabels(options?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'code' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}): Promise<{ labels: Label[]; total: number }> {
  const { page = 1, limit = 50, search, sortBy = 'name', sortOrder = 'asc' } = options || {};

  const result = await executeDbOperation(
    async () => {
      let whereConditions = sql`${labels.isActive} = true`;

      if (search) {
        whereConditions = sql`${whereConditions} AND (${labels.name} ILIKE ${'%' + search + '%'} OR ${labels.code} ILIKE ${'%' + search + '%'} OR ${labels.supplier} ILIKE ${'%' + search + '%'})`;
      }

      const orderByField = sortBy === 'code' ? labels.code :
                          sortBy === 'createdAt' ? labels.createdAt :
                          labels.name;

      const orderBy = sortOrder === 'desc' ? desc(orderByField) : asc(orderByField);

      const [labelsData, totalCount] = await Promise.all([
        clientDb.query.labels.findMany({
          where: whereConditions,
          orderBy: [orderBy],
          limit,
          offset: (page - 1) * limit
        }),
        clientDb.select({ count: sql<number>`count(*)` }).from(labels).where(whereConditions)
      ]);

      return {
        labels: labelsData,
        total: totalCount[0]?.count || 0
      };
    },
    'Failed to fetch labels'
  );

  return result.success ? result.data || { labels: [], total: 0 } : { labels: [], total: 0 };
}

export async function createLabel(data: Omit<typeof labels.$inferInsert, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Promise<Label | null> {
  const result = await executeDbOperation(
    async () => {
      // Generate auto-code
      const lastLabel = await clientDb.query.labels.findFirst({
        orderBy: [desc(labels.code)],
        columns: { code: true }
      });

      let nextNumber = 1;
      if (lastLabel?.code) {
        const lastNumber = parseInt(lastLabel.code.split('-')[1] || '0');
        nextNumber = lastNumber + 1;
      }

      const code = `LBL-${nextNumber.toString().padStart(3, '0')}`;

      const [label] = await clientDb.insert(labels).values({
        ...data,
        code,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return label;
    },
    'Failed to create label'
  );

  return result.success ? result.data : null;
}