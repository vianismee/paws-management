import { NextRequest, NextResponse } from 'next/server';
import { db, materials, categories } from '@/db';
import { eq, ilike, and, desc, asc, sql } from 'drizzle-orm';
import { z } from 'zod';
import Decimal from 'decimal.js';

// Query parameters schema for GET /api/inventory/materials
const MaterialsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'code', 'cost', 'currentStock', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Material creation schema for POST /api/inventory/materials
const CreateMaterialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  supplier: z.string().optional(),
  supplierCode: z.string().optional(),
  cost: z.string().transform((val) => parseFloat(val)).pipe(z.number().min(0, 'Cost must be non-negative')),
  purchaseUnit: z.string().min(1, 'Purchase unit is required'),
  purchaseQuantity: z.string().transform((val) => parseFloat(val)).pipe(z.number().min(0.01, 'Purchase quantity must be greater than 0')),
  unit: z.string().min(1, 'Unit is required'),
  currency: z.string().default('IDR'),
  minStockLevel: z.string().transform((val) => parseFloat(val)).pipe(z.number().min(0).default(0)),
  currentStock: z.string().transform((val) => parseFloat(val)).pipe(z.number().min(0).default(0)),
  reorderPoint: z.string().transform((val) => parseFloat(val)).pipe(z.number().min(0).default(0)),
  notes: z.string().optional(),
});

// Material update schema for PUT /api/inventory/materials/[id]
const UpdateMaterialSchema = CreateMaterialSchema.partial();

// GET /api/inventory/materials - List materials with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Manual parsing to be more lenient
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined;
    const sortBy = ['name', 'code', 'cost', 'currentStock', 'createdAt'].includes(searchParams.get('sortBy') || '') ? searchParams.get('sortBy')! : 'name';
    const sortOrder = ['asc', 'desc'].includes(searchParams.get('sortOrder') || '') ? searchParams.get('sortOrder')! : 'asc';

    const query = {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
      search,
      categoryId,
      isActive,
      sortBy: sortBy as 'name' | 'code' | 'cost' | 'currentStock' | 'createdAt',
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const offset = (query.page - 1) * query.limit;

    // Build the base query
    let whereConditions = [];

    if (query.search) {
      whereConditions.push(
        ilike(materials.name, `%${query.search}%`)
      );
    }

    if (query.categoryId) {
      whereConditions.push(eq(materials.categoryId, query.categoryId));
    }

    if (query.isActive !== undefined) {
      whereConditions.push(eq(materials.isActive, query.isActive));
    }

    // Determine sort column and order
    const sortColumn = {
      name: materials.name,
      code: materials.code,
      cost: materials.cost,
      currentStock: materials.currentStock,
      createdAt: materials.createdAt,
    }[query.sortBy];

    const sortDirection = query.sortOrder === 'desc' ? desc : asc;

    // Execute the query with joins
    const result = await db
      .select({
        id: materials.id,
        code: materials.code,
        name: materials.name,
        description: materials.description,
        categoryId: materials.categoryId,
        category: {
          id: categories.id,
          name: categories.name,
          codePrefix: categories.codePrefix,
        },
        supplier: materials.supplier,
        supplierCode: materials.supplierCode,
        cost: materials.cost,
        purchaseUnit: materials.purchaseUnit,
        purchaseQuantity: materials.purchaseQuantity,
        costPerUnit: materials.costPerUnit,
        unit: materials.unit,
        currency: materials.currency,
        minStockLevel: materials.minStockLevel,
        currentStock: materials.currentStock,
        reorderPoint: materials.reorderPoint,
        isActive: materials.isActive,
        notes: materials.notes,
        createdAt: materials.createdAt,
        updatedAt: materials.updatedAt,
      })
      .from(materials)
      .leftJoin(categories, eq(materials.categoryId, categories.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(sortDirection(sortColumn))
      .limit(query.limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(materials)
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
    console.error('Error fetching materials:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/materials - Create a new material
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateMaterialSchema.parse(body);

    // Generate auto-code based on category
    const category = await db
      .select({ codePrefix: categories.codePrefix })
      .from(categories)
      .where(eq(categories.id, validatedData.categoryId))
      .limit(1);

    if (!category.length) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Generate the next material code for this category
    const lastMaterial = await db
      .select({ code: materials.code })
      .from(materials)
      .where(ilike(materials.code, `${category[0].codePrefix}-%`))
      .orderBy(desc(materials.code))
      .limit(1);

    let nextNumber = 1;
    if (lastMaterial.length > 0) {
      const lastCode = lastMaterial[0].code;
      const lastNumber = parseInt(lastCode.split('-')[1]);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const generatedCode = `${category[0].codePrefix}-${nextNumber.toString().padStart(3, '0')}`;

    // Calculate cost per unit
    const costPerUnit = new Decimal(validatedData.cost).div(validatedData.purchaseQuantity).toFixed(2);

    // Create the material
    const [newMaterial] = await db
      .insert(materials)
      .values({
        id: crypto.randomUUID(),
        code: generatedCode,
        name: validatedData.name,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        supplier: validatedData.supplier,
        supplierCode: validatedData.supplierCode,
        cost: new Decimal(validatedData.cost).toString(),
        purchaseUnit: validatedData.purchaseUnit,
        purchaseQuantity: new Decimal(validatedData.purchaseQuantity).toString(),
        costPerUnit: costPerUnit,
        unit: validatedData.unit,
        currency: validatedData.currency,
        minStockLevel: new Decimal(validatedData.minStockLevel).toString(),
        currentStock: new Decimal(validatedData.currentStock).toString(),
        reorderPoint: new Decimal(validatedData.reorderPoint).toString(),
        isActive: true,
        notes: validatedData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      message: 'Material created successfully',
      data: newMaterial,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating material:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Material with this name or code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    );
  }
}