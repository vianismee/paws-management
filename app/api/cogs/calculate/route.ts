import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateCogs, saveCogsCalculation } from "@/lib/utils/cogs";
import { calculateCogsSchema } from "@/lib/validations/cogs";
import Decimal from "decimal.js";

// POST /api/cogs/calculate - Calculate COGS for a formula
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = calculateCogsSchema.parse(body);

        // Prepare calculation input
        const calculationInput = {
            formulaVersionId: validatedData.formulaVersionId,
            batchSize: validatedData.batchSize,
            producedUnits: validatedData.producedUnits,
            packagingCosts: validatedData.packagingCosts,
            labelCosts: validatedData.labelCosts,
            wastePercentage: validatedData.wastePercentage,
            laborHours: validatedData.laborHours,
            laborRatePerHour: validatedData.laborRatePerHour,
            overheadCost: validatedData.overheadCost,
        };

        // Calculate COGS
        const result = await calculateCogs(calculationInput);

        let savedCalculationId = null;
        
        // Save calculation if requested
        if (validatedData.saveCalculation) {
            savedCalculationId = await saveCogsCalculation(
                result,
                "calculated",
                validatedData.notes
            );
        }

        return NextResponse.json({
            calculation: result,
            savedCalculationId,
            timestamp: new Date().toISOString(),
        }, { status: 201 });
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

        console.error("Error calculating COGS:", error);
        return NextResponse.json(
            { error: "Failed to calculate COGS" },
            { status: 500 }
        );
    }
}