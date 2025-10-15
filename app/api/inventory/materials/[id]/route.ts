import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { materials, materialCategories } from "@/db/schema/inventory";
import { eq } from "drizzle-orm";
import { updateMaterialSchema } from "@/lib/validations/inventory";

// GET /api/inventory/materials/[id] - Get a specific material
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const [material] = await db
            .select({
                id: materials.id,
                code: materials.code,
                name: materials.name,
                description: materials.description,
                categoryId: materials.categoryId,
                category: materialCategories.name,
                unit: materials.unit,
                currentStock: materials.currentStock,
                minStockLevel: materials.minStockLevel,
                maxStockLevel: materials.maxStockLevel,
                unitCost: materials.unitCost,
                isActive: materials.isActive,
                createdAt: materials.createdAt,
                updatedAt: materials.updatedAt,
            })
            .from(materials)
            .leftJoin(materialCategories, eq(materials.categoryId, materialCategories.id))
            .where(eq(materials.id, params.id))
            .limit(1);

        if (!material) {
            return NextResponse.json(
                { error: "Material not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(material);
    } catch (error) {
        console.error("Error fetching material:", error);
        return NextResponse.json(
            { error: "Failed to fetch material" },
            { status: 500 }
        );
    }
}

// PUT /api/inventory/materials/[id] - Update a material
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const validatedData = updateMaterialSchema.parse(body);

        const updateData: any = {
            ...validatedData,
            updatedAt: new Date(),
        };

        // Handle numeric fields
        if (validatedData.currentStock !== undefined) {
            updateData.currentStock = validatedData.currentStock.toString();
        }
        if (validatedData.minStockLevel !== undefined) {
            updateData.minStockLevel = validatedData.minStockLevel.toString();
        }
        if (validatedData.maxStockLevel !== undefined) {
            updateData.maxStockLevel = validatedData.maxStockLevel?.toString() || null;
        }
        if (validatedData.unitCost !== undefined) {
            updateData.unitCost = validatedData.unitCost.toString();
        }

        const [updatedMaterial] = await db
            .update(materials)
            .set(updateData)
            .where(eq(materials.id, params.id))
            .returning();

        if (!updatedMaterial) {
            return NextResponse.json(
                { error: "Material not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedMaterial);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error updating material:", error);
        return NextResponse.json(
            { error: "Failed to update material" },
            { status: 500 }
        );
    }
}

// DELETE /api/inventory/materials/[id] - Delete a material
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const [deletedMaterial] = await db
            .delete(materials)
            .where(eq(materials.id, params.id))
            .returning();

        if (!deletedMaterial) {
            return NextResponse.json(
                { error: "Material not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Material deleted successfully" });
    } catch (error) {
        console.error("Error deleting material:", error);
        
        // Check if it's a foreign key constraint error
        if (error instanceof Error && error.message.includes('violates foreign key constraint')) {
            return NextResponse.json(
                { error: "Cannot delete material that is being used in formulas or has stock movements" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to delete material" },
            { status: 500 }
        );
    }
}