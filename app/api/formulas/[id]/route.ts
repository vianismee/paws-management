import { NextRequest, NextResponse } from 'next/server';
import { db, formulas, formulaVersions, formulaIngredients } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import Decimal from 'decimal.js';

// Formula update schema for PUT /api/formulas/[id]
const UpdateFormulaSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  totalWeight: z.number().min(0).optional(),
  unit: z.enum(['g', 'ml']).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => {
  // At least one field should be provided for update
  return Object.keys(data).length > 0;
}, {
  message: "At least one field must be provided for update"
});

// GET /api/formulas/[id] - Get a single formula with latest version
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [formula] = await db
      .select()
      .from(formulas)
      .where(eq(formulas.id, params.id))
      .limit(1);

    if (!formula) {
      return NextResponse.json(
        { error: 'Formula not found' },
        { status: 404 }
      );
    }

    // Get the latest version of this formula
    const [latestVersion] = await db
      .select()
      .from(formulaVersions)
      .where(eq(formulaVersions.formulaId, params.id))
      .orderBy(desc(formulaVersions.version))
      .limit(1);

    return NextResponse.json({
      data: {
        ...formula,
        latestVersion,
      },
    });
  } catch (error) {
    console.error('Error fetching formula:', error);
    return NextResponse.json(
      { error: 'Failed to fetch formula' },
      { status: 500 }
    );
  }
}

// PUT /api/formulas/[id] - Update a formula
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = UpdateFormulaSchema.parse(body);

    // Check if formula exists
    const [existingFormula] = await db
      .select()
      .from(formulas)
      .where(eq(formulas.id, params.id))
      .limit(1);

    if (!existingFormula) {
      return NextResponse.json(
        { error: 'Formula not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };

    // Update decimal fields properly
    if (validatedData.totalWeight !== undefined) {
      updateData.totalWeight = new Decimal(validatedData.totalWeight).toString();
    }

    // Update the formula
    const [updatedFormula] = await db
      .update(formulas)
      .set(updateData)
      .where(eq(formulas.id, params.id))
      .returning();

    return NextResponse.json({
      message: 'Formula updated successfully',
      data: updatedFormula,
    });
  } catch (error) {
    console.error('Error updating formula:', error);

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
      { error: 'Failed to update formula' },
      { status: 500 }
    );
  }
}

// DELETE /api/formulas/[id] - Delete a formula (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if formula exists
    const [existingFormula] = await db
      .select()
      .from(formulas)
      .where(eq(formulas.id, params.id))
      .limit(1);

    if (!existingFormula) {
      return NextResponse.json(
        { error: 'Formula not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false and status to archived
    const [deletedFormula] = await db
      .update(formulas)
      .set({
        isActive: false,
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(eq(formulas.id, params.id))
      .returning();

    return NextResponse.json({
      message: 'Formula deleted successfully',
      data: deletedFormula,
    });
  } catch (error) {
    console.error('Error deleting formula:', error);
    return NextResponse.json(
      { error: 'Failed to delete formula' },
      { status: 500 }
    );
  }
}