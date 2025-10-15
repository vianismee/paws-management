import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { materials, stockMovements } from "@/db/schema/inventory";
import { eq, and, desc, sql } from "drizzle-orm";
import { createStockMovementSchema } from "@/lib/validations/inventory";
import { generateId } from "better-auth";
import Decimal from "decimal.js";

// GET /api/inventory/materials/[id]/stock-movements - Get stock movements for a material
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const offset = (page - 1) * limit;

        // First verify the material exists
        const [material] = await db
            .select()
            .from(materials)
            .where(eq(materials.id, params.id))
            .limit(1);

        if (!material) {
            return NextResponse.json(
                { error: "Material not found" },
                { status: 404 }
            );
        }

        const movements = await db
            .select()
            .from(stockMovements)
            .where(eq(stockMovements.materialId, params.id))
            .orderBy(desc(stockMovements.createdAt))
            .limit(limit)
            .offset(offset);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(stockMovements)
            .where(eq(stockMovements.materialId, params.id));

        return NextResponse.json({
            data: movements,
            pagination: {
                page,
                limit,
                total: Number(totalCount[0]?.count || 0),
                totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
            },
            currentStock: material.currentStock,
        });
    } catch (error) {
        console.error("Error fetching stock movements:", error);
        return NextResponse.json(
            { error: "Failed to fetch stock movements" },
            { status: 500 }
        );
    }
}

// POST /api/inventory/materials/[id]/stock-movements - Create a stock movement
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const validatedData = createStockMovementSchema.parse({
            ...body,
            materialId: params.id,
        });

        // Start a transaction to ensure data consistency
        const result = await db.transaction(async (tx) => {
            // Get current material
            const [material] = await tx
                .select({ 
                    currentStock: materials.currentStock,
                    unitCost: materials.unitCost 
                })
                .from(materials)
                .where(eq(materials.id, params.id))
                .for('update')
                .limit(1);

            if (!material) {
                throw new Error("Material not found");
            }

            const currentStock = new Decimal(material.currentStock.toString());
            const movementQuantity = new Decimal(validatedData.quantity);

            let newStock: Decimal;
            let remainingStock: Decimal;

            switch (validatedData.movementType) {
                case 'IN':
                    newStock = currentStock.plus(movementQuantity);
                    remainingStock = newStock;
                    break;
                case 'OUT':
                    if (currentStock.lt(movementQuantity)) {
                        throw new Error("Insufficient stock for this movement");
                    }
                    newStock = currentStock.minus(movementQuantity);
                    remainingStock = newStock;
                    break;
                case 'ADJUSTMENT':
                    newStock = movementQuantity; // For adjustments, the quantity is the new total
                    remainingStock = newStock;
                    break;
                default:
                    throw new Error("Invalid movement type");
            }

            // Update material stock
            await tx
                .update(materials)
                .set({ 
                    currentStock: newStock.toString(),
                    updatedAt: new Date()
                })
                .where(eq(materials.id, params.id));

            // Create stock movement record
            const movementData = {
                id: generateId(),
                materialId: params.id,
                movementType: validatedData.movementType,
                quantity: movementQuantity.toString(),
                remainingStock: remainingStock.toString(),
                reason: validatedData.reason,
                reference: validatedData.reference || null,
                unitCost: validatedData.unitCost 
                    ? validatedData.unitCost.toString() 
                    : material.unitCost.toString(),
                createdAt: new Date(),
            };

            const [movement] = await tx
                .insert(stockMovements)
                .values(movementData)
                .returning();

            return movement;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }

        if (error instanceof Error) {
            if (error.message === "Material not found") {
                return NextResponse.json(
                    { error: error.message },
                    { status: 404 }
                );
            }
            if (error.message === "Insufficient stock for this movement") {
                return NextResponse.json(
                    { error: error.message },
                    { status: 400 }
                );
            }
        }

        console.error("Error creating stock movement:", error);
        return NextResponse.json(
            { error: "Failed to create stock movement" },
            { status: 500 }
        );
    }
}