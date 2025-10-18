import { NextRequest, NextResponse } from 'next/server'
import { db, products } from '@/db'
import { eq, ilike, and, desc, asc, sql } from 'drizzle-orm'
import { z } from 'zod'

// Query parameters schema for GET /api/products
const ProductsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().nullable().optional(),
  isActive: z.string().nullable().optional().transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),
  category: z.string().nullable().optional(),
  sortBy: z.string().nullable().optional().transform((val) => {
    if (!val || val === 'null') return 'name'
    if (['name', 'sku', 'createdAt', 'volume'].includes(val)) return val
    return 'name'
  }),
  sortOrder: z.string().nullable().optional().transform((val) => {
    if (!val || val === 'null') return 'asc'
    if (['asc', 'desc'].includes(val)) return val
    return 'asc'
  }),
})

// Product creation schema for POST /api/products
const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  volume: z.number().min(0, 'Volume must be non-negative'),
  priceNotes: z.string().optional(),
  createdBy: z.string().min(1, 'Created by is required'),
})

// Product update schema for PUT /api/products/[id]
const UpdateProductSchema = CreateProductSchema.partial()

// GET /api/products - List products with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Build query object
    const query = ProductsQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      isActive: searchParams.get('isActive'),
      category: searchParams.get('category'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    })

    const offset = (query.page - 1) * query.limit

    // Build the base query
    let whereConditions = []

    if (query.search) {
      whereConditions.push(
        sql`(${products.name} ILIKE ${'%' + query.search + '%'} OR ${products.sku} ILIKE ${'%' + query.search + '%'} OR ${products.description} ILIKE ${'%' + query.search + '%'})`
      )
    }

    if (query.isActive !== undefined) {
      whereConditions.push(eq(products.isActive, query.isActive))
    }

    if (query.category) {
      whereConditions.push(eq(products.category, query.category))
    }

    // Determine sort column and order
    const sortColumn = {
      name: products.name,
      sku: products.sku,
      createdAt: products.createdAt,
      volume: products.volume,
    }[query.sortBy]

    const sortDirection = query.sortOrder === 'desc' ? desc : asc

    // Execute the query
    const result = await db
      .select()
      .from(products)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(sortDirection(sortColumn))
      .limit(query.limit)
      .offset(offset)

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)

    const totalPages = Math.ceil(Number(count) / query.limit)

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
    })
  } catch (error) {
    console.error('Error fetching products:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateProductSchema.parse(body)

    // Create the product with proper volume field
    const [newProduct] = await db
      .insert(products)
      .values({
        id: crypto.randomUUID(),
        name: validatedData.name,
        description: validatedData.description,
        sku: validatedData.sku,
        category: validatedData.category,
        unit: validatedData.unit,
        volume: validatedData.volume.toString(),
        priceNotes: validatedData.priceNotes || 'Price will be calculated based on: production cost + label + packaging + sales margin',
        unitPrice: null, // Will be calculated later
        retailPrice: null, // Will be calculated later
        wholesalePrice: null, // Will be calculated later
        isActive: true,
        createdBy: validatedData.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json({
      message: 'Product created successfully',
      data: newProduct,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    // Check for unique constraint violation (SKU)
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}