import { NextRequest, NextResponse } from 'next/server';
import { db, packaging } from '@/db';
import { eq, ilike, and, desc, asc, sql } from 'drizzle-orm';
import { z } from 'zod';
import Decimal from 'decimal.js';

// Query parameters schema for GET /api/inventory/packaging
const PackagingQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  type: z.string().optional(),
  material: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'code', 'cost', 'currentStock', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Packaging creation schema for POST /api/inventory/packaging
const CreatePackagingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  size: z.string().min(1, 'Size is required'),
  material: z.string().optional(),
  cost: z.string().transform((val) => parseFloat(val)).pipe(z.number().min(0, 'Cost must be non-negative')),
  purchaseQuantity: z.string().transform((val) => parseInt(val)).pipe(z.number().min(1, 'Purchase quantity must be at least 1')),
  currency: z.string().default('IDR'),
  supplier: z.string().optional(),
  supplierCode: z.string().optional(),
  minOrderQuantity: z.string().transform((val) => parseInt(val)).pipe(z.number().min(1).default(1)),
  currentStock: z.string().transform((val) => parseInt(val)).pipe(z.number().min(0).default(0)),
  notes: z.string().optional(),
});

// Packaging update schema for PUT /api/inventory/packaging/[id]
const UpdatePackagingSchema = CreatePackagingSchema.partial();

// Helper function to generate auto-code
async function generatePackagingCode(type: string): Promise<string> {
  const prefix = 'PKG';

  const lastPackaging = await db
    .select({ code: packaging.code })
    .from(packaging)
    .where(ilike(packaging.code, `${prefix}-%`))
    .orderBy(desc(packaging.code))
    .limit(1);

  let nextNumber = 1;
  if (lastPackaging.length > 0) {
    const lastCode = lastPackaging[0].code;
    const lastNumber = parseInt(lastCode.split('-')[1]);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
}

// Helper function to calculate cost per unit
function calculateCostPerUnit(cost: number, purchaseQuantity: number): string {
  return new Decimal(cost).div(purchaseQuantity).toFixed(2);
}

// GET /api/inventory/packaging - List packaging with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Manual parsing to be more lenient
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const material = searchParams.get('material') || undefined;
    const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined;
    const sortBy = ['name', 'code', 'cost', 'currentStock', 'createdAt'].includes(searchParams.get('sortBy') || '') ? searchParams.get('sortBy')! : 'name';
    const sortOrder = ['asc', 'desc'].includes(searchParams.get('sortOrder') || '') ? searchParams.get('sortOrder')! : 'asc';

    const query = {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)),
      search,
      type,
      material,
      isActive,
      sortBy: sortBy as 'name' | 'code' | 'cost' | 'currentStock' | 'createdAt',
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const offset = (query.page - 1) * query.limit;

    // Build the base query
    let whereConditions = [];

    if (query.search) {
      whereConditions.push(
        ilike(packaging.name, `%${query.search}%`)
      );
    }

    if (query.type) {
      whereConditions.push(eq(packaging.type, query.type));
    }

    if (query.material) {
      whereConditions.push(eq(packaging.material, query.material));
    }

    if (query.isActive !== undefined) {
      whereConditions.push(eq(packaging.isActive, query.isActive));
    }

    // Determine sort column and order
    const sortColumn = {
      name: packaging.name,
      code: packaging.code,
      cost: packaging.cost,
      currentStock: packaging.currentStock,
      createdAt: packaging.createdAt,
    }[query.sortBy];

    const sortDirection = query.sortOrder === 'desc' ? desc : asc;

    // Execute the query
    const result = await db
      .select()
      .from(packaging)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(sortDirection(sortColumn))
      .limit(query.limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(packaging)
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
    console.error('Error fetching packaging:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch packaging' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/packaging - Create new packaging
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreatePackagingSchema.parse(body);

    // Generate auto-code
    const generatedCode = await generatePackagingCode(validatedData.type);

    // Calculate cost per unit
    const costPerUnit = calculateCostPerUnit(validatedData.cost, validatedData.purchaseQuantity);

    // Create the packaging
    const [newPackaging] = await db
      .insert(packaging)
      .values({
        id: crypto.randomUUID(),
        code: generatedCode,
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        size: validatedData.size,
        material: validatedData.material,
        cost: new Decimal(validatedData.cost).toString(),
        purchaseQuantity: validatedData.purchaseQuantity,
        costPerUnit: costPerUnit,
        currency: validatedData.currency,
        supplier: validatedData.supplier,
        supplierCode: validatedData.supplierCode,
        minOrderQuantity: validatedData.minOrderQuantity,
        currentStock: validatedData.currentStock,
        isActive: true,
        notes: validatedData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      message: 'Packaging created successfully',
      data: newPackaging,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating packaging:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Packaging with this name or code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create packaging' },
      { status: 500 }
    );
  }
}