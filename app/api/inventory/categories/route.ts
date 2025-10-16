import { NextRequest, NextResponse } from 'next/server';
import { db, categories, materials } from '@/db';
import { eq, ilike, and, or, desc, asc, sql } from 'drizzle-orm';
import { z } from 'zod';

// Query parameters schema for GET /api/inventory/categories
const CategoriesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.union([z.coerce.boolean(), z.string().transform(() => undefined)]).optional(),
  sortBy: z.enum(['name', 'codePrefix', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Category creation schema for POST /api/inventory/categories
const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  codePrefix: z.string().min(1, 'Code prefix is required').max(10, 'Code prefix must be 10 characters or less'),
  isActive: z.boolean().default(true),
});

// Category update schema for PUT /api/inventory/categories/[id]
const UpdateCategorySchema = CreateCategorySchema.partial();

// GET /api/inventory/categories - List categories with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Manual parsing to be more lenient
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const search = searchParams.get('search') || undefined;
    const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined;
    const sortBy = ['name', 'codePrefix', 'createdAt'].includes(searchParams.get('sortBy') || '') ? searchParams.get('sortBy')! : 'name';
    const sortOrder = ['asc', 'desc'].includes(searchParams.get('sortOrder') || '') ? searchParams.get('sortOrder')! : 'asc';

    const query = {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
      search,
      isActive,
      sortBy: sortBy as 'name' | 'codePrefix' | 'createdAt',
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const offset = (query.page - 1) * query.limit;

    // Build the base query
    let whereConditions = [];

    if (query.search) {
      whereConditions.push(
        ilike(categories.name, `%${query.search}%`)
      );
    }

    if (query.isActive !== undefined) {
      whereConditions.push(eq(categories.isActive, query.isActive));
    }

    // Determine sort column and order
    const sortColumn = {
      name: categories.name,
      codePrefix: categories.codePrefix,
      createdAt: categories.createdAt,
    }[query.sortBy];

    const sortDirection = query.sortOrder === 'desc' ? desc : asc;

    // Execute the query with material count
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        codePrefix: categories.codePrefix,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        materialCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${materials}
          WHERE ${materials.categoryId} = ${categories.id} AND ${materials.isActive} = true
        )`.as('materialCount'),
      })
      .from(categories)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(sortDirection(sortColumn))
      .limit(query.limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(categories)
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
    console.error('Error fetching categories:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateCategorySchema.parse(body);

    // Check if category name or code prefix already exists
    const existingCategory = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          or(eq(categories.name, validatedData.name), eq(categories.codePrefix, validatedData.codePrefix.toUpperCase()))
        )
      )
      .limit(1);

    if (existingCategory.length > 0) {
      return NextResponse.json(
        { error: 'Category with this name or code prefix already exists' },
        { status: 409 }
      );
    }

    // Create the category
    const [newCategory] = await db
      .insert(categories)
      .values({
        id: crypto.randomUUID(),
        name: validatedData.name,
        description: validatedData.description,
        codePrefix: validatedData.codePrefix.toUpperCase(),
        isActive: validatedData.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      message: 'Category created successfully',
      data: newCategory,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}