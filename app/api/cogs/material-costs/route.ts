import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { materialCostHistory, materials } from "@/db/schema/formulations";
import { eq, desc, sql } from "drizzle-orm";
import { 
    createMaterialCostHistorySchema,
    materialCostHistoryFilterSchema 
} from "@/lib/validations/cogs";
import { updateMaterialCost } from "@/lib/utils/cogs";
import { generateId } from "better-auth";

// GET /api/cogs/material-costs - Get material cost history
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = materialCostHistoryFilterSchema.parse(Object.fromEntries(searchParams));

        const offset = (filters.page - 1) * filters.limit;

        const whereConditions = [];
        
        if (filters.materialId) {
            whereConditions.push(eq(materialCostHistory.materialId, filters.materialId));
        }
        
        if (filters.dateFrom) {
            whereConditions.push(sql`${materialCostHistory.effectiveDate} >= ${filters.dateFrom}`);
        }
        
        if (filters.dateTo) {
            whereConditions.push(sql`${materialCostHistory.effectiveDate} <= ${filters.dateTo}`);
        }

        const history = await db
            .select({
                id: materialCostHistory.id,
                materialId: materialCostHistory.materialId,
                materialName: materials.name,
                materialCode: materials.code,
                unitCost: materialCostHistory.unitCost,
                effectiveDate: materialCostHistory.effectiveDate,
                supplier: materialCostHistory.supplier,
                reason: materialCostHistory.reason,
                createdAt: materialCostHistory.createdAt,
                costChange: sql<string>`(
                    SELECT ${materialCostHistory.unitCost} - 
                    LAG(${materialCostHistory.unitCost}) OVER (PARTITION BY ${materialCostHistory.materialId} ORDER BY ${materialCostHistory.effectiveDate})
                )`.as('costChange'),
                costChangePercentage: sql<string>`(
                    CASE 
                        WHEN LAG(${materialCostHistory.unitCost}) OVER (PARTITION BY ${materialCostHistory.materialId} ORDER BY ${materialCostHistory.effectiveDate}) > 0
                        THEN ((${materialCostHistory.unitCost} - LAG(${materialCostHistory.unitCost}) OVER (PARTITION BY ${materialCostHistory.materialId} ORDER BY ${materialCostHistory.effectiveDate})) / 
                             LAG(${materialCostHistory.unitCost}) OVER (PARTITION BY ${materialCostHistory.materialId} ORDER BY ${materialCostHistory.effectiveDate})) * 100
                        ELSE 0 
                    END
                )`.as('costChangePercentage'),
            })
            .from(materialCostHistory)
            .leftJoin(materials, eq(materialCostHistory.materialId, materials.id))
            .where(whereConditions.length > 0 ? whereConditions[0] : undefined)
            .orderBy(desc(materialCostHistory.effectiveDate))
            .limit(filters.limit)
            .offset(offset);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(materialCostHistory)
            .where(whereConditions.length > 0 ? whereConditions[0] : undefined);

        return NextResponse.json({
            data: history,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: Number(totalCount[0]?.count || 0),
                totalPages: Math.ceil((totalCount[0]?.count || 0) / filters.limit),
            },
        });
    } catch (error) {
        console.error("Error fetching material cost history:", error);
        return NextResponse.json(
            { error: "Failed to fetch material cost history" },
            { status: 500 }
        );
    }
}

// POST /api/cogs/material-costs - Record a material cost change
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createMaterialCostHistorySchema.parse(body);

        // Update material cost and record in history
        await updateMaterialCost(
            validatedData.materialId,
            validatedData.unitCost,
            validatedData.reason,
            validatedData.supplier
        );

        const newHistoryEntry = {
            id: generateId(),
            ...validatedData,
            unitCost: validatedData.unitCost.toString(),
        };

        return NextResponse.json(newHistoryEntry, { status: 201 });
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

        console.error("Error recording material cost change:", error);
        return NextResponse.json(
            { error: "Failed to record material cost change" },
            { status: 500 }
        );
    }
}