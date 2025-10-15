import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { materialCategories } from "@/db/schema/inventory";
import { eq } from "drizzle-orm";
import { updateMaterialCategorySchema } from "@/lib/validations/inventory";

// GET /api/inventory/categories/[id] - Get a specific category
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const [category] = await db
            .select()
            .from(materialCategories)
            .where(eq(materialCategories.id, params.id))
            .limit(1);

        if (!category) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error fetching category:", error);
        return NextResponse.json(
            { error: "Failed to fetch category" },
            { status: 500 }
        );
    }
}

// PUT /api/inventory/categories/[id] - Update a category
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const validatedData = updateMaterialCategorySchema.parse(body);

        const [updatedCategory] = await db
            .update(materialCategories)
            .set({
                ...validatedData,
                updatedAt: new Date(),
            })
            .where(eq(materialCategories.id, params.id))
            .returning();

        if (!updatedCategory) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedCategory);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error updating category:", error);
        return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
        );
    }
}

// DELETE /api/inventory/categories/[id] - Delete a category
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const [deletedCategory] = await db
            .delete(materialCategories)
            .where(eq(materialCategories.id, params.id))
            .returning();

        if (!deletedCategory) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        
        // Check if it's a foreign key constraint error
        if (error instanceof Error && error.message.includes('violates foreign key constraint')) {
            return NextResponse.json(
                { error: "Cannot delete category that is being used by materials" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to delete category" },
            { status: 500 }
        );
    }
}