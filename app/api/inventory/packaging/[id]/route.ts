import { NextRequest, NextResponse } from 'next/server';
import { db, packaging } from '@/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import Decimal from 'decimal.js';

// Packaging update schema for PUT /api/inventory/packaging/[id]
const UpdatePackagingSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.string().min(1).optional(),
  size: z.string().min(1).optional(),
  material: z.string().optional(),
  cost: z.string().transform((val) => parseFloat(val)).pipe(z.number().min(0)).optional(),
  purchaseQuantity: z.string().transform((val) => parseInt(val)).pipe(z.number().min(1)).optional(),
  currency: z.string().optional(),
  supplier: z.string().optional(),
  supplierCode: z.string().optional(),
  minOrderQuantity: z.string().transform((val) => parseInt(val)).pipe(z.number().min(1)).optional(),
  currentStock: z.string().transform((val) => parseInt(val)).pipe(z.number().min(0)).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // At least one field should be provided for update
  return Object.keys(data).length > 0;
}, {
  message: "At least one field must be provided for update"
});

// Helper function to calculate cost per unit
function calculateCostPerUnit(cost: number, purchaseQuantity: number): string {
  return new Decimal(cost).div(purchaseQuantity).toFixed(2);
}

// GET /api/inventory/packaging/[id] - Get a single packaging item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: packagingId } = await params;
    const [packagingItem] = await db
      .select()
      .from(packaging)
      .where(eq(packaging.id, packagingId))
      .limit(1);

    if (!packagingItem) {
      return NextResponse.json(
        { error: 'Packaging not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: packagingItem,
    });
  } catch (error) {
    console.error('Error fetching packaging:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packaging' },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/packaging/[id] - Update a packaging item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: packagingId } = await params;
    const body = await request.json();
    const validatedData = UpdatePackagingSchema.parse(body);

    // Check if packaging exists
    const [existingPackaging] = await db
      .select()
      .from(packaging)
      .where(eq(packaging.id, packagingId))
      .limit(1);

    if (!existingPackaging) {
      return NextResponse.json(
        { error: 'Packaging not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };

    // Recalculate cost per unit if cost or purchase quantity is being updated
    if (validatedData.cost !== undefined || validatedData.purchaseQuantity !== undefined) {
      const cost = validatedData.cost ?? Number(existingPackaging.cost);
      const purchaseQuantity = validatedData.purchaseQuantity ?? existingPackaging.purchaseQuantity;
      updateData.costPerUnit = calculateCostPerUnit(cost, purchaseQuantity);

      // Update decimal fields properly
      if (validatedData.cost !== undefined) {
        updateData.cost = new Decimal(validatedData.cost).toString();
      }
    }

    // Update the packaging
    const [updatedPackaging] = await db
      .update(packaging)
      .set(updateData)
      .where(eq(packaging.id, packagingId))
      .returning();

    return NextResponse.json({
      message: 'Packaging updated successfully',
      data: updatedPackaging,
    });
  } catch (error) {
    console.error('Error updating packaging:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Packaging with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update packaging' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/packaging/[id] - Delete a packaging item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: packagingId } = await params;

    // Check if packaging exists
    const [existingPackaging] = await db
      .select()
      .from(packaging)
      .where(eq(packaging.id, packagingId))
      .limit(1);

    if (!existingPackaging) {
      return NextResponse.json(
        { error: 'Packaging not found' },
        { status: 404 }
      );
    }

    // Hard delete - permanently remove from database
    const [deletedPackaging] = await db
      .delete(packaging)
      .where(eq(packaging.id, packagingId))
      .returning();

    return NextResponse.json({
      message: 'Packaging deleted permanently',
      data: deletedPackaging,
    });
  } catch (error) {
    console.error('Error deleting packaging:', error);
    return NextResponse.json(
      { error: 'Failed to delete packaging' },
      { status: 500 }
    );
  }
}