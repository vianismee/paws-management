import { NextRequest, NextResponse } from 'next/server';
import { db, labels } from '@/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import Decimal from 'decimal.js';

// Label update schema for PUT /api/inventory/labels/[id]
const UpdateLabelSchema = z.object({
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

// GET /api/inventory/labels/[id] - Get a single label
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: labelId } = await params;
    const [label] = await db
      .select()
      .from(labels)
      .where(eq(labels.id, labelId))
      .limit(1);

    if (!label) {
      return NextResponse.json(
        { error: 'Label not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: label,
    });
  } catch (error) {
    console.error('Error fetching label:', error);
    return NextResponse.json(
      { error: 'Failed to fetch label' },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/labels/[id] - Update a label
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: labelId } = await params;
    const body = await request.json();
    const validatedData = UpdateLabelSchema.parse(body);

    // Check if label exists
    const [existingLabel] = await db
      .select()
      .from(labels)
      .where(eq(labels.id, labelId))
      .limit(1);

    if (!existingLabel) {
      return NextResponse.json(
        { error: 'Label not found' },
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
      const cost = validatedData.cost ?? Number(existingLabel.cost);
      const purchaseQuantity = validatedData.purchaseQuantity ?? existingLabel.purchaseQuantity;
      updateData.costPerUnit = calculateCostPerUnit(cost, purchaseQuantity);

      // Update decimal fields properly
      if (validatedData.cost !== undefined) {
        updateData.cost = new Decimal(validatedData.cost).toString();
      }
    }

    // Update the label
    const [updatedLabel] = await db
      .update(labels)
      .set(updateData)
      .where(eq(labels.id, labelId))
      .returning();

    return NextResponse.json({
      message: 'Label updated successfully',
      data: updatedLabel,
    });
  } catch (error) {
    console.error('Error updating label:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'Label with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update label' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/labels/[id] - Delete a label
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: labelId } = await params;

    // Check if label exists
    const [existingLabel] = await db
      .select()
      .from(labels)
      .where(eq(labels.id, labelId))
      .limit(1);

    if (!existingLabel) {
      return NextResponse.json(
        { error: 'Label not found' },
        { status: 404 }
      );
    }

    // Hard delete - permanently remove from database
    const [deletedLabel] = await db
      .delete(labels)
      .where(eq(labels.id, labelId))
      .returning();

    return NextResponse.json({
      message: 'Label deleted permanently',
      data: deletedLabel,
    });
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json(
      { error: 'Failed to delete label' },
      { status: 500 }
    );
  }
}