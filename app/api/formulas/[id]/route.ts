import { NextRequest, NextResponse } from 'next/server';
import { db, formulas, products, formulaVersions, formulaIngredients, materials } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import Decimal from 'decimal.js';

// Formula update schema for PUT /api/formulas/[id]
const UpdateFormulaSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['Draft', 'Trials', 'Pre-Production', 'Approved']).optional(),
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
    const { id } = await params;

    // Get the formula with product information
    const [formula] = await db
      .select({
        id: formulas.id,
        productId: formulas.productId,
        name: formulas.name,
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
        productName: products.name,
        productDescription: products.description,
      })
      .from(formulas)
      .leftJoin(products, eq(formulas.productId, products.id))
      .where(eq(formulas.id, id))
      .limit(1);

    if (!formula) {
      return NextResponse.json(
        { error: 'Formula not found' },
        { status: 404 }
      );
    }

    // Get ingredients for the formula
    const ingredients = await db
      .select({
        id: formulaIngredients.id,
        materialId: formulaIngredients.materialId,
        materialName: materials.name,
        percentage: formulaIngredients.percentage,
        weight: formulaIngredients.weight,
        qs: formulaIngredients.qs,
        isQsIngredient: formulaIngredients.isQsIngredient,
        notes: formulaIngredients.notes,
      })
      .from(formulaIngredients)
      .leftJoin(materials, eq(formulaIngredients.materialId, materials.id))
      .where(eq(formulaIngredients.formulaVersionId, id)); // Simplified for now

    return NextResponse.json({
      ...formula,
      ingredients: ingredients.map(ing => ({
        id: ing.id,
        materialId: ing.materialId,
        materialName: ing.materialName || 'Unknown Material',
        percentage: parseFloat(ing.percentage?.toString() || '0'),
        weight: parseFloat(ing.weight?.toString() || '0'),
        qs: parseFloat(ing.qs?.toString() || '0'),
        isQsIngredient: ing.isQsIngredient || false,
        notes: ing.notes,
      })),
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
    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateFormulaSchema.parse(body);

    // Check if formula exists
    const [existingFormula] = await db
      .select()
      .from(formulas)
      .where(eq(formulas.id, id))
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
      .where(eq(formulas.id, id))
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
    const { id } = await params;

    // Check if formula exists
    const [existingFormula] = await db
      .select()
      .from(formulas)
      .where(eq(formulas.id, id))
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
      .where(eq(formulas.id, id))
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