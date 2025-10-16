import { NextRequest, NextResponse } from 'next/server';
import { db, materials, categories } from '@/db';
import { eq, and, ilike } from 'drizzle-orm';
import { z } from 'zod';
import Decimal from 'decimal.js';

const UpdateMaterialSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  supplier: z.string().optional(),
  supplierCode: z.string().optional(),
  cost: z.string().transform((val) => parseFloat(val)).pipe(z.number().min(0, 'Cost must be non-negative')).optional(),
  purchaseUnit: z.string().min(1, 'Purchase unit is required').optional(),
  purchaseQuantity: z.string().transform((val) => parseFloat(val)).pipe(z.number().min(0.01, 'Purchase quantity must be greater than 0')).optional(),
  unit: z.string().min(1, 'Unit is required').optional(),
  currency: z.string().default('IDR').optional(),
  minStockLevel: z.string().transform((val) => parseFloat(val)).pipe(z.number().min(0).default(0)).optional(),
  currentStock: z.string().transform((val) => parseFloat(val)).pipe(z.number().min(0).default(0)).optional(),
  reorderPoint: z.string().transform((val) => parseFloat(val)).pipe(z.number().min(0).default(0)).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

// GET /api/inventory/materials/[id] - Get a specific material
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;

    if (!materialId) {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      );
    }

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
        unit: materials.unit,
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
      .where(eq(materials.id, materialId))
      .limit(1);

    if (!result.length) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: result[0],
    });
  } catch (error) {
    console.error('Error fetching material:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material' },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/materials/[id] - Update a specific material
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;

    if (!materialId) {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateMaterialSchema.parse(body);

    // Check if material exists
    const existingMaterial = await db
      .select({ id: materials.id })
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1);

    if (!existingMaterial.length) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // Get current material data for cost calculation
    const [currentMaterial] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1);

    if (!currentMaterial) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only include fields that are provided in the request
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.categoryId !== undefined) updateData.categoryId = validatedData.categoryId;
    if (validatedData.supplier !== undefined) updateData.supplier = validatedData.supplier;
    if (validatedData.supplierCode !== undefined) updateData.supplierCode = validatedData.supplierCode;
    if (validatedData.cost !== undefined) updateData.cost = new Decimal(validatedData.cost).toString();
    if (validatedData.purchaseUnit !== undefined) updateData.purchaseUnit = validatedData.purchaseUnit;
    if (validatedData.purchaseQuantity !== undefined) updateData.purchaseQuantity = new Decimal(validatedData.purchaseQuantity).toString();
    if (validatedData.unit !== undefined) updateData.unit = validatedData.unit;
    if (validatedData.currency !== undefined) updateData.currency = validatedData.currency;
    if (validatedData.minStockLevel !== undefined) updateData.minStockLevel = new Decimal(validatedData.minStockLevel).toString();
    if (validatedData.currentStock !== undefined) updateData.currentStock = new Decimal(validatedData.currentStock).toString();
    if (validatedData.reorderPoint !== undefined) updateData.reorderPoint = new Decimal(validatedData.reorderPoint).toString();
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    // Recalculate cost per unit if cost or purchaseQuantity changed
    const newCost = validatedData.cost !== undefined ? validatedData.cost : parseFloat(currentMaterial.cost);
    const newPurchaseQuantity = validatedData.purchaseQuantity !== undefined ? validatedData.purchaseQuantity : parseFloat(currentMaterial.purchaseQuantity);

    if (validatedData.cost !== undefined || validatedData.purchaseQuantity !== undefined) {
      updateData.costPerUnit = new Decimal(newCost).div(newPurchaseQuantity).toFixed(2);
    }

    const [updatedMaterial] = await db
      .update(materials)
      .set(updateData)
      .where(eq(materials.id, materialId))
      .returning();

    return NextResponse.json({
      message: 'Material updated successfully',
      data: updatedMaterial,
    });
  } catch (error) {
    console.error('Error updating material:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update material' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/materials/[id] - Delete a specific material
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;

    if (!materialId) {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      );
    }

    // Check if material exists
    const existingMaterial = await db
      .select({ id: materials.id })
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1);

    if (!existingMaterial.length) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // Hard delete - permanently remove from database
    const [deletedMaterial] = await db
      .delete(materials)
      .where(eq(materials.id, materialId))
      .returning();

    return NextResponse.json({
      message: 'Material deleted permanently',
      data: deletedMaterial,
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json(
      { error: 'Failed to delete material' },
      { status: 500 }
    );
  }
}