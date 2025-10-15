import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { formulaIngredients, formulaVersions, materials } from "@/db/schema/formulations";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
    createFormulaIngredientSchema,
    bulkCreateFormulaIngredientsSchema,
    updateFormulaIngredientSchema 
} from "@/lib/validations/formulations";
import { validateIngredientPercentages } from "@/lib/utils/formulas";
import { generateId } from "better-auth";

// GET /api/formulas/versions/[versionId]/ingredients - Get ingredients for a formula version
export async function GET(
    request: NextRequest,
    { params }: { params: { versionId: string } }
) {
    try {
        const ingredients = await db
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
            .where(eq(formulaIngredients.formulaVersionId, params.versionId))
            .orderBy(formulaIngredients.order);

        // Calculate total percentage
        const totalPercentage = ingredients.reduce(
            (total, ingredient) => total + parseFloat(ingredient.percentage || "0"),
            0
        );

        return NextResponse.json({
            data: ingredients,
            totalPercentage,
        });
    } catch (error) {
        console.error("Error fetching formula ingredients:", error);
        return NextResponse.json(
            { error: "Failed to fetch formula ingredients" },
            { status: 500 }
        );
    }
}

// POST /api/formulas/versions/[versionId]/ingredients - Add ingredients to a formula version
export async function POST(
    request: NextRequest,
    { params }: { params: { versionId: string } }
) {
    try {
        const body = await request.json();
        const isBulk = Array.isArray(body.ingredients);

        let validatedData;
        if (isBulk) {
            validatedData = bulkCreateFormulaIngredientsSchema.parse({
                formulaVersionId: params.versionId,
                ingredients: body.ingredients,
            });
        } else {
            validatedData = createFormulaIngredientSchema.parse({
                ...body,
                formulaVersionId: params.versionId,
            });
        }

        const result = await db.transaction(async (tx) => {
            if (isBulk) {
                // Validate total percentages for bulk create
                const validation = validateIngredientPercentages(validatedData.ingredients);
                if (!validation.isValid) {
                    throw new Error(`Invalid ingredient percentages: ${validation.errors.join(", ")}`);
                }

                // Delete existing ingredients if replacing all
                if (body.replaceExisting) {
                    await tx
                        .delete(formulaIngredients)
                        .where(eq(formulaIngredients.formulaVersionId, params.versionId));
                }

                const newIngredients = validatedData.ingredients.map((ingredient, index) => ({
                    id: generateId(),
                    formulaVersionId: params.versionId,
                    ...ingredient,
                    order: index + 1,
                }));

                const insertedIngredients = await tx
                    .insert(formulaIngredients)
                    .values(newIngredients)
                    .returning();

                return insertedIngredients;
            } else {
                // For single ingredient creation, check if total will exceed 100%
                const existingIngredients = await tx
                    .select({ percentage: formulaIngredients.percentage })
                    .from(formulaIngredients)
                    .where(eq(formulaIngredients.formulaVersionId, params.versionId));

                const allIngredients = [
                    ...existingIngredients,
                    { percentage: validatedData.percentage },
                ];

                const validation = validateIngredientPercentages(allIngredients);
                if (!validation.isValid) {
                    throw new Error(`Invalid ingredient percentages: ${validation.errors.join(", ")}`);
                }

                const newIngredient = {
                    id: generateId(),
                    formulaVersionId: params.versionId,
                    ...validatedData,
                    order: existingIngredients.length + 1,
                };

                const [insertedIngredient] = await tx
                    .insert(formulaIngredients)
                    .values(newIngredient)
                    .returning();

                return [insertedIngredient];
            }
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
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        console.error("Error creating formula ingredient:", error);
        return NextResponse.json(
            { error: "Failed to create formula ingredient" },
            { status: 500 }
        );
    }
}