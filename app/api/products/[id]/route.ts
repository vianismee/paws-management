import { NextRequest, NextResponse } from 'next/server'
import { db, products } from '@/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

// Product update schema for PUT /api/products/[id]
const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  sku: z.string().min(1).optional(),
  category: z.string().optional(),
  unit: z.string().min(1).optional(),
  volume: z.number().min(0).optional(),
  priceNotes: z.string().optional(),
  unitPrice: z.number().min(0).optional(),
  retailPrice: z.number().min(0).optional(),
  wholesalePrice: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
}).refine((data) => {
  // At least one field should be provided for update
  return Object.keys(data).length > 0
}, {
  message: "At least one field must be provided for update"
})

// GET /api/products/[id] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: product,
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    const validatedData = UpdateProductSchema.parse(body)

    // Check if product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1)

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    }

    // Convert volume to string for database
    if (validatedData.volume !== undefined) {
      updateData.volume = validatedData.volume.toString()
    }

    // Convert prices to strings for database
    if (validatedData.unitPrice !== undefined) {
      updateData.unitPrice = validatedData.unitPrice.toString()
    }
    if (validatedData.retailPrice !== undefined) {
      updateData.retailPrice = validatedData.retailPrice.toString()
    }
    if (validatedData.wholesalePrice !== undefined) {
      updateData.wholesalePrice = validatedData.wholesalePrice.toString()
    }

    // Update the product
    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning()

    return NextResponse.json({
      message: 'Product updated successfully',
      data: updatedProduct,
    })
  } catch (error) {
    console.error('Error updating product:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete a product (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // Check if product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1)

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting isActive to false
    const [deletedProduct] = await db
      .update(products)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning()

    return NextResponse.json({
      message: 'Product deleted successfully',
      data: deletedProduct,
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}