import { NextRequest, NextResponse } from 'next/server';
import { db, categories, materials } from '@/db';
import { eq, and, or, sql } from 'drizzle-orm';
import { z } from 'zod';

const UpdateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  codePrefix: z.string().min(1, 'Code prefix is required').max(10, 'Code prefix must be 10 characters or less').optional(),
  isActive: z.boolean().optional(),
});

// GET /api/inventory/categories/[id] - Get a specific category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

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
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!result.length) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: result[0],
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/categories/[id] - Update a specific category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateCategorySchema.parse(body);

    // Check if category exists
    const existingCategory = await db
      .select({ id: categories.id, name: categories.name, codePrefix: categories.codePrefix })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!existingCategory.length) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if new name or code prefix conflicts with other categories (exclude current category)
    if (validatedData.name || validatedData.codePrefix) {
      const conflictCheck = await db
        .select({ id: categories.id })
        .from(categories)
        .where(
          and(
            // Exclude current category from the check
            sql`${categories.id} != ${categoryId}`,
            or(
              validatedData.name ? eq(categories.name, validatedData.name) : undefined,
              validatedData.codePrefix ? eq(categories.codePrefix, validatedData.codePrefix.toUpperCase()) : undefined
            )
          )
        )
        .limit(1);

      if (conflictCheck.length > 0) {
        return NextResponse.json(
          { error: 'Category with this name or code prefix already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only include fields that are provided in the request
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.codePrefix !== undefined) updateData.codePrefix = validatedData.codePrefix.toUpperCase();
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    const [updatedCategory] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, categoryId))
      .returning();

    return NextResponse.json({
      message: 'Category updated successfully',
      data: updatedCategory,
    });
  } catch (error) {
    console.error('Error updating category:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/categories/[id] - Delete a specific category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!existingCategory.length) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has any materials (active or inactive)
    const [{ materialCount }] = await db
      .select({
        materialCount: sql<number>`COUNT(*)`.as('materialCount'),
      })
      .from(materials)
      .where(eq(materials.categoryId, categoryId));

    if (Number(materialCount) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that contains materials. Please reassign or delete the materials first.' },
        { status: 400 }
      );
    }

    // Hard delete - actually remove from database
    const [deletedCategory] = await db
      .delete(categories)
      .where(eq(categories.id, categoryId))
      .returning();

    return NextResponse.json({
      message: 'Category deleted permanently',
      data: deletedCategory,
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}