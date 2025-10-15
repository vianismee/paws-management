import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { formulaIngredients, formulaVersions, materials } from "@/db/schema/formulations";
import { eq, and, sql } from "drizzle-orm";
import { updateFormulaIngredientSchema } from "@/lib/validations/formulations";
import { validateIngredientPercentages } from "@/lib/utils/formulas";

// GET /api/formulas/versions/[versionId]/ingredients/[ingredientId] - Get a specific ingredient
export async function GET(
    request: NextRequest,
    { params }: { params: { versionId: string; ingredientId: string } }
) {
    try {
        const [ingredient] = await db
            .select({
                id: formulaIngredients.id,
                materialId: formulaIngredients.materialId,
                materialName: materials.name,
                materialCode: materials.code,
                percentage: formulaIngredients.percentage,
                quantity: formulaIngredients.quantity,
                unit: formulaIngredients.unit,
                order: formulaIngredients.order,
                notes: formulaIngredients.notes,
                createdAt: formulaIngredients.createdAt,
                updatedAt: formulaIngredients.updatedAt,
                unitCost: materials.unitCost,
            })
            .from(formulaIngredients)
            .leftJoin(materials, eq(formulaIngredients.materialId, materials.id))
            .where(
                and(
                    eq(formulaIngredients.id, params.ingredientId),
                    eq(formulaIngredients.formulaVersionId, params.versionId)
                )
            )
            .limit(1);

        if (!ingredient) {
            return NextResponse.json(
                { error: "Ingredient not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(ingredient);
    } catch (error) {
        console.error("Error fetching formula ingredient:", error);
        return NextResponse.json(
            { error: "Failed to fetch formula ingredient" },
            { status: 500 }
        );
    }
}

// PUT /api/formulas/versions/[versionId]/ingredients/[ingredientId] - Update an ingredient
export async function PUT(
    request: NextRequest,
    { params }: { params: { versionId: string; ingredientId: string } }
) {
    try {
        const body = await request.json();
        const validatedData = updateFormulaIngredientSchema.parse(body);

        const result = await db.transaction(async (tx) => {
            // Get all other ingredients plus the updated one to validate percentages
            const existingIngredients = await tx
                .select({ 
                    id: formulaIngredients.id,
                    percentage: formulaIngredients.percentage 
                })
                .from(formulaIngredients)
                .where(
                    and(
                        eq(formulaIngredients.formulaVersionId, params.versionId),
                        sql`${formulaIngredients.id} != ${params.ingredientId}`
                    )
                );

            const allIngredients = [
                ...existingIngredients,
                { 
                    id: params.ingredientId,
                    percentage: validatedData.percentage || existingIngredients.find(i => i.id === params.ingredientId)?.percentage || "0"
                },
            ];

            const validation = validateIngredientPercentages(allIngredients);
            if (!validation.isValid) {
                throw new Error(`Invalid ingredient percentages: ${validation.errors.join(", ")}`);
            }

            const updateData: any = {
                ...validatedData,
                updatedAt: new Date(),
            };

            if (validatedData.percentage !== undefined) {
                updateData.percentage = validatedData.percentage.toString();
            }
            if (validatedData.quantity !== undefined) {
                updateData.quantity = validatedData.quantity.toString();
            }

            const [updatedIngredient] = await tx
                .update(formulaIngredients)
                .set(updateData)
                .where(
                    and(
                        eq(formulaIngredients.id, params.ingredientId),
                        eq(formulaIngredients.formulaVersionId, params.versionId)
                    )
                )
                .returning();

            if (!updatedIngredient) {
                throw new Error("Ingredient not found");
            }

            return updatedIngredient;
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }

        if (error instanceof Error) {
            if (error.message === "Ingredient not found") {
                return NextResponse.json(
                    { error: error.message },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        console.error("Error updating formula ingredient:", error);
        return NextResponse.json(
            { error: "Failed to update formula ingredient" },
            { status: 500 }
        );
    }
}

// DELETE /api/formulas/versions/[versionId]/ingredients/[ingredientId] - Delete an ingredient
export async function DELETE(
    request: NextRequest,
    { params }: { params: { versionId: string; ingredientId: string } }
) {
    try {
        const result = await db.transaction(async (tx) => {
            // Get remaining ingredients to validate percentages after deletion
            const remainingIngredients = await tx
                .select({ percentage: formulaIngredients.percentage })
                .from(formulaIngredients)
                .where(
                    and(
                        eq(formulaIngredients.formulaVersionId, params.versionId),
                        sql`${formulaIngredients.id} != ${params.ingredientId}`
                    )
                );

            const validation = validateIngredientPercentages(remainingIngredients);
            if (!validation.isValid && remainingIngredients.length > 0) {
                throw new Error(`Cannot delete ingredient: ${validation.errors.join(", ")}`);
            }

            const [deletedIngredient] = await tx
                .delete(formulaIngredients)
                .where(
                    and(
                        eq(formulaIngredients.id, params.ingredientId),
                        eq(formulaIngredients.formulaVersionId, params.versionId)
                    )
                )
                .returning();

            if (!deletedIngredient) {
                throw new Error("Ingredient not found");
            }

            return deletedIngredient;
        });

        return NextResponse.json({ message: "Ingredient deleted successfully" });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Ingredient not found") {
                return NextResponse.json(
                    { error: error.message },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        console.error("Error deleting formula ingredient:", error);
        return NextResponse.json(
            { error: "Failed to delete formula ingredient" },
            { status: 500 }
        );
    }
}