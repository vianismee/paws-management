import { NextRequest, NextResponse } from 'next/server';
import { db, formulas, products, formulaVersions, formulaIngredients, materials } from '@/db';
import { eq, ilike, and, desc, asc, sum, sql } from 'drizzle-orm';
import { z } from 'zod';
import Decimal from 'decimal.js';

// Query parameters schema for GET /api/formulas
const FormulasQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().nullable().optional(),
  status: z.enum(['Draft', 'Trials', 'Pre-Production', 'Approved']).nullable().optional(),
  isActive: z.string().nullable().optional().transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),
  createdBy: z.string().nullable().optional(),
  productId: z.string().nullable().optional(),
  sortBy: z.string().nullable().optional().transform((val) => {
    if (!val || val === 'null') return 'name'
    if (['name', 'version', 'status', 'totalWeight', 'createdAt'].includes(val)) return val
    return 'name'
  }),
  sortOrder: z.string().nullable().optional().transform((val) => {
    if (!val || val === 'null') return 'asc'
    if (['asc', 'desc'].includes(val)) return val
    return 'asc'
  }),
});

// Formula creation schema for POST /api/formulas
const CreateFormulaSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  totalWeight: z.number().min(0, 'Total weight must be non-negative'),
  unit: z.enum(['g', 'ml', 'kg', 'L'], {
    errorMap: (issue, ctx) => {
      if (issue.code === 'invalid_enum_value') {
        return { message: 'Unit must be g, ml, kg, or L' };
      }
      return { message: ctx.defaultError };
    },
  }),
  notes: z.string().optional(),
  createdBy: z.string().min(1, 'Created by is required'),
});

// Formula update schema for PUT /api/formulas/[id]
const UpdateFormulaSchema = CreateFormulaSchema.partial();

// Helper function to get the next version number for a formula
async function getNextVersion(formulaId: string): Promise<number> {
  const [lastVersion] = await db
    .select({ version: formulaVersions.version })
    .from(formulaVersions)
    .where(eq(formulaVersions.formulaId, formulaId))
    .orderBy(desc(formulaVersions.version))
    .limit(1);

  return (lastVersion?.version || 0) + 1;
}

// Helper function to validate that ingredient percentages sum to 100%
function validateIngredientPercentages(ingredients: Array<{ percentage: number }>): { isValid: boolean; total: number } {
  const total = ingredients.reduce((sum, ing) => sum + ing.percentage, 0);
  return {
    isValid: Math.abs(total - 100) < 0.01, // Allow small floating point errors
    total
  };
}

// GET /api/formulas - List formulas with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = FormulasQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      isActive: searchParams.get('isActive'),
      createdBy: searchParams.get('createdBy'),
      productId: searchParams.get('productId'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    const offset = (query.page - 1) * query.limit;

    // Build the base query
    let whereConditions = [];

    if (query.search) {
      whereConditions.push(
        sql`(${formulas.name} ILIKE ${'%' + query.search + '%'} OR ${products.name} ILIKE ${'%' + query.search + '%'})`
      );
    }

    if (query.status) {
      whereConditions.push(eq(formulas.status, query.status));
    }

    if (query.isActive !== undefined) {
      whereConditions.push(eq(formulas.isActive, query.isActive));
    }

    if (query.createdBy) {
      whereConditions.push(eq(formulas.createdBy, query.createdBy));
    }

    if (query.productId) {
      whereConditions.push(eq(formulas.productId, query.productId));
    }

    // Determine sort column and order
    const sortColumn = {
      name: formulas.name,
      version: formulas.version,
      status: formulas.status,
      totalWeight: formulas.totalWeight,
      createdAt: formulas.createdAt,
    }[query.sortBy];

    const sortDirection = query.sortOrder === 'desc' ? desc : asc;

    // Execute the query
    const result = await db
      .select({
        id: formulas.id,
        productId: formulas.productId,
        name: formulas.name,
        productName: products.name,
        description: formulas.description,
        version: formulas.version,
        status: formulas.status,
        totalWeight: formulas.totalWeight,
        unit: formulas.unit,
        notes: formulas.notes,
        trialResults: formulas.trialResults,
        approvedDate: formulas.approvedDate,
        approvedBy: formulas.approvedBy,
        createdBy: formulas.createdBy,
        isActive: formulas.isActive,
        createdAt: formulas.createdAt,
        updatedAt: formulas.updatedAt,
      })
      .from(formulas)
      .leftJoin(products, eq(formulas.productId, products.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(sortDirection(sortColumn))
      .limit(query.limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(formulas)
      .leftJoin(products, eq(formulas.productId, products.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const totalPages = Math.ceil(Number(count) / query.limit);

    return NextResponse.json({
      data: result,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: Number(count),
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching formulas:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch formulas' },
      { status: 500 }
    );
  }
}

// POST /api/formulas - Create a new formula
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateFormulaSchema.parse(body);

    // Create the formula
    const [newFormula] = await db
      .insert(formulas)
      .values({
        id: crypto.randomUUID(),
        productId: validatedData.productId,
        name: validatedData.name,
        description: validatedData.description,
        version: 1,
        status: 'Draft',
        totalWeight: new Decimal(validatedData.totalWeight).toString(),
        unit: validatedData.unit,
        notes: validatedData.notes,
        createdBy: validatedData.createdBy,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      message: 'Formula created successfully',
      data: newFormula,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating formula:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Formula with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create formula' },
      { status: 500 }
    );
  }
}