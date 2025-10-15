import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { formulas, formulaVersions, formulaIngredients } from "@/db/schema/formulations";
import { eq, and, sql } from "drizzle-orm";
import { updateFormulaSchema } from "@/lib/validations/formulations";

// GET /api/formulas/[id] - Get a specific formula
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const [formula] = await db
            .select({
                id: formulas.id,
                name: formulas.name,
                description: formulas.description,
                productType: formulas.productType,
                targetBatchSize: formulas.targetBatchSize,
                batchSizeUnit: formulas.batchSizeUnit,
                status: formulas.status,
                version: formulas.version,
                isActive: formulas.isActive,
                createdAt: formulas.createdAt,
                updatedAt: formulas.updatedAt,
                currentVersion: {
                    id: formulaVersions.id,
                    version: formulaVersions.version,
                    name: formulaVersions.name,
                    description: formulaVersions.description,
                    targetBatchSize: formulaVersions.targetBatchSize,
                    batchSizeUnit: formulaVersions.batchSizeUnit,
                    status: formulaVersions.status,
                    notes: formulaVersions.notes,
                    isCurrent: formulaVersions.isCurrent,
                    effectiveDate: formulaVersions.effectiveDate,
                    expiryDate: formulaVersions.expiryDate,
                    createdAt: formulaVersions.createdAt,
                    updatedAt: formulaVersions.updatedAt,
                },
                ingredientCount: sql<number>`(
                    SELECT COUNT(*) FROM formula_ingredients 
                    WHERE formula_ingredients.formula_version_id = (
                        SELECT id FROM formula_versions 
                        WHERE formula_versions.formula_id = formulas.id 
                        AND formula_versions.is_current = true 
                        LIMIT 1
                    )
                )`.as('ingredientCount'),
                versionCount: sql<number>`(
                    SELECT COUNT(*) FROM formula_versions 
                    WHERE formula_versions.formula_id = formulas.id
                )`.as('versionCount'),
            })
            .from(formulas)
            .leftJoin(
                formulaVersions,
                and(
                    eq(formulaVersions.formulaId, formulas.id),
                    eq(formulaVersions.isCurrent, true)
                )
            )
            .where(eq(formulas.id, params.id))
            .limit(1);

        if (!formula) {
            return NextResponse.json(
                { error: "Formula not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(formula);
    } catch (error) {
        console.error("Error fetching formula:", error);
        return NextResponse.json(
            { error: "Failed to fetch formula" },
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
        const validatedData = updateFormulaSchema.parse(body);

        const updateData: any = {
            ...validatedData,
            updatedAt: new Date(),
        };

        if (validatedData.targetBatchSize !== undefined) {
            updateData.targetBatchSize = validatedData.targetBatchSize.toString();
        }

        const [updatedFormula] = await db
            .update(formulas)
            .set(updateData)
            .where(eq(formulas.id, params.id))
            .returning();

        if (!updatedFormula) {
            return NextResponse.json(
                { error: "Formula not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedFormula);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error updating formula:", error);
        return NextResponse.json(
            { error: "Failed to update formula" },
            { status: 500 }
        );
    }
}

// DELETE /api/formulas/[id] - Delete a formula
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const [deletedFormula] = await db
            .delete(formulas)
            .where(eq(formulas.id, params.id))
            .returning();

        if (!deletedFormula) {
            return NextResponse.json(
                { error: "Formula not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Formula deleted successfully" });
    } catch (error) {
        console.error("Error deleting formula:", error);
        
        // Check if it's a foreign key constraint error
        if (error instanceof Error && error.message.includes('violates foreign key constraint')) {
            return NextResponse.json(
                { error: "Cannot delete formula that is being used in production or has versions" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to delete formula" },
            { status: 500 }
        );
    }
}