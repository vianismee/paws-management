import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { cogsCalculations, formulaVersions, formulas } from "@/db/schema/formulations";
import { eq, desc, sql, and } from "drizzle-orm";
import { 
    cogsCalculationFilterSchema 
} from "@/lib/validations/cogs";

// GET /api/cogs - Get COGS calculations overview
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = cogsCalculationFilterSchema.parse(Object.fromEntries(searchParams));

        const offset = (filters.page - 1) * filters.limit;

        const whereConditions = [];
        
        if (filters.formulaVersionId) {
            whereConditions.push(eq(cogsCalculations.formulaVersionId, filters.formulaVersionId));
        }
        
        if (filters.status) {
            whereConditions.push(eq(cogsCalculations.status, filters.status));
        }
        
        if (filters.dateFrom) {
            whereConditions.push(sql`${cogsCalculations.calculationDate} >= ${filters.dateFrom}`);
        }
        
        if (filters.dateTo) {
            whereConditions.push(sql`${cogsCalculations.calculationDate} <= ${filters.dateTo}`);
        }

        const calculations = await db
            .select({
                id: cogsCalculations.id,
                formulaVersionId: cogsCalculations.formulaVersionId,
                formulaName: formulas.name,
                formulaVersion: formulaVersions.version,
                batchSize: cogsCalculations.batchSize,
                batchUnit: cogsCalculations.batchUnit,
                producedUnits: cogsCalculations.producedUnits,
                ingredientsCost: cogsCalculations.ingredientsCost,
                packagingCost: cogsCalculations.packagingCost,
                labelCost: cogsCalculations.labelCost,
                laborCost: cogsCalculations.laborCost,
                overheadCost: cogsCalculations.overheadCost,
                totalCost: cogsCalculations.totalCost,
                costPerUnit: cogsCalculations.costPerUnit,
                status: cogsCalculations.status,
                calculationDate: cogsCalculations.calculationDate,
                notes: cogsCalculations.notes,
            })
            .from(cogsCalculations)
            .leftJoin(formulaVersions, eq(cogsCalculations.formulaVersionId, formulaVersions.id))
            .leftJoin(formulas, eq(formulaVersions.formulaId, formulas.id))
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(desc(cogsCalculations.calculationDate))
            .limit(filters.limit)
            .offset(offset);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(cogsCalculations)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        // Calculate summary statistics
        const [summary] = await db
            .select({
                totalCalculations: sql<number>`count(*)`,
                averageCostPerUnit: sql<string>`AVG(${cogsCalculations.costPerUnit})`,
                totalValue: sql<string>`SUM(${cogsCalculations.totalCost})`,
                latestCalculation: sql<string>`MAX(${cogsCalculations.calculationDate})`,
            })
            .from(cogsCalculations)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        return NextResponse.json({
            data: calculations,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: Number(totalCount[0]?.count || 0),
                totalPages: Math.ceil((totalCount[0]?.count || 0) / filters.limit),
            },
            summary: {
                totalCalculations: Number(summary?.totalCalculations || 0),
                averageCostPerUnit: summary?.averageCostPerUnit || "0",
                totalValue: summary?.totalValue || "0",
                latestCalculation: summary?.latestCalculation,
            },
        });
    } catch (error) {
        console.error("Error fetching COGS calculations:", error);
        return NextResponse.json(
            { error: "Failed to fetch COGS calculations" },
            { status: 500 }
        );
    }
}