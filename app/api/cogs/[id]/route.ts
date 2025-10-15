import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { 
    cogsCalculations, 
    cogsIngredientCosts, 
    cogsPackagingCosts, 
    cogsLabelCosts 
} from "@/db/schema/formulations";
import { eq, sql } from "drizzle-orm";

// GET /api/cogs/[id] - Get a specific COGS calculation with full details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get main calculation
        const [calculation] = await db
            .select()
            .from(cogsCalculations)
            .where(eq(cogsCalculations.id, params.id))
            .limit(1);

        if (!calculation) {
            return NextResponse.json(
                { error: "COGS calculation not found" },
                { status: 404 }
            );
        }

        // Get ingredient cost details
        const ingredientCosts = await db
            .select()
            .from(cogsIngredientCosts)
            .where(eq(cogsIngredientCosts.cogsCalculationId, params.id));

        // Get packaging cost details
        const packagingCosts = await db
            .select()
            .from(cogsPackagingCosts)
            .where(eq(cogsPackagingCosts.cogsCalculationId, params.id));

        // Get label cost details
        const labelCosts = await db
            .select()
            .from(cogsLabelCosts)
            .where(eq(cogsLabelCosts.cogsCalculationId, params.id));

        // Calculate additional metrics
        const totalVariableCost = new Decimal(calculation.ingredientsCost)
            .plus(new Decimal(calculation.packagingCost))
            .plus(new Decimal(calculation.labelCost));
        
        const totalFixedCost = new Decimal(calculation.laborCost)
            .plus(new Decimal(calculation.overheadCost));
        
        const variableCostPercentage = calculation.totalCost !== "0" 
            ? totalVariableCost.div(new Decimal(calculation.totalCost)).mul(100).toString()
            : "0";
        
        const fixedCostPercentage = calculation.totalCost !== "0"
            ? totalFixedCost.div(new Decimal(calculation.totalCost)).mul(100).toString()
            : "0";

        const response = {
            ...calculation,
            ingredientCosts,
            packagingCosts,
            labelCosts,
            metrics: {
                totalVariableCost: totalVariableCost.toString(),
                totalFixedCost: totalFixedCost.toString(),
                variableCostPercentage,
                fixedCostPercentage,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching COGS calculation:", error);
        return NextResponse.json(
            { error: "Failed to fetch COGS calculation" },
            { status: 500 }
        );
    }
}

// PUT /api/cogs/[id] - Update COGS calculation status or notes
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { status, notes } = body;

        const updateData: any = {
            updatedAt: new Date(),
        };

        if (status && ["calculated", "approved", "archived"].includes(status)) {
            updateData.status = status;
        }

        if (notes !== undefined) {
            updateData.notes = notes;
        }

        const [updatedCalculation] = await db
            .update(cogsCalculations)
            .set(updateData)
            .where(eq(cogsCalculations.id, params.id))
            .returning();

        if (!updatedCalculation) {
            return NextResponse.json(
                { error: "COGS calculation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedCalculation);
    } catch (error) {
        console.error("Error updating COGS calculation:", error);
        return NextResponse.json(
            { error: "Failed to update COGS calculation" },
            { status: 500 }
        );
    }
}

// DELETE /api/cogs/[id] - Delete a COGS calculation
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const result = await db.transaction(async (tx) => {
            // Delete related records first
            await tx
                .delete(cogsIngredientCosts)
                .where(eq(cogsIngredientCosts.cogsCalculationId, params.id));

            await tx
                .delete(cogsPackagingCosts)
                .where(eq(cogsPackagingCosts.cogsCalculationId, params.id));

            await tx
                .delete(cogsLabelCosts)
                .where(eq(cogsLabelCosts.cogsCalculationId, params.id));

            // Delete main calculation
            const [deletedCalculation] = await tx
                .delete(cogsCalculations)
                .where(eq(cogsCalculations.id, params.id))
                .returning();

            return deletedCalculation;
        });

        if (!result) {
            return NextResponse.json(
                { error: "COGS calculation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "COGS calculation deleted successfully" });
    } catch (error) {
        console.error("Error deleting COGS calculation:", error);
        return NextResponse.json(
            { error: "Failed to delete COGS calculation" },
            { status: 500 }
        );
    }
}