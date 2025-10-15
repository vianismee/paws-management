import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { formulas, formulaVersions, formulaIngredients, materials } from "@/db/schema/formulations";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import { 
    createFormulaSchema, 
    formulaFilterSchema 
} from "@/lib/validations/formulations";
import { generateId } from "better-auth";

// GET /api/formulas - Get all formulas
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = formulaFilterSchema.parse(Object.fromEntries(searchParams));

        const offset = (filters.page - 1) * filters.limit;

        const whereConditions = [];
        
        if (filters.search) {
            whereConditions.push(
                ilike(formulas.name, `%${filters.search}%`)
            );
        }
        
        if (filters.productType) {
            whereConditions.push(eq(formulas.productType, filters.productType));
        }
        
        if (filters.status) {
            whereConditions.push(eq(formulas.status, filters.status));
        }
        
        if (filters.isActive !== undefined) {
            whereConditions.push(eq(formulas.isActive, filters.isActive));
        }

        const formulasData = await db
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
                currentVersionId: sql<string>`(
                    SELECT id FROM formula_versions 
                    WHERE formula_versions.formula_id = formulas.id 
                    AND formula_versions.is_current = true 
                    LIMIT 1
                )`.as('currentVersionId'),
                ingredientCount: sql<number>`(
                    SELECT COUNT(*) FROM formula_ingredients 
                    WHERE formula_ingredients.formula_version_id = (
                        SELECT id FROM formula_versions 
                        WHERE formula_versions.formula_id = formulas.id 
                        AND formula_versions.is_current = true 
                        LIMIT 1
                    )
                )`.as('ingredientCount'),
            })
            .from(formulas)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(desc(formulas.updatedAt))
            .limit(filters.limit)
            .offset(offset);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(formulas)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        return NextResponse.json({
            data: formulasData,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: Number(totalCount[0]?.count || 0),
                totalPages: Math.ceil((totalCount[0]?.count || 0) / filters.limit),
            },
        });
    } catch (error) {
        console.error("Error fetching formulas:", error);
        return NextResponse.json(
            { error: "Failed to fetch formulas" },
            { status: 500 }
        );
    }
}

// POST /api/formulas - Create a new formula
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createFormulaSchema.parse(body);

        const newFormula = {
            id: generateId(),
            ...validatedData,
            targetBatchSize: validatedData.targetBatchSize.toString(),
        };

        const [formula] = await db
            .insert(formulas)
            .values(newFormula)
            .returning();

        return NextResponse.json(formula, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating formula:", error);
        return NextResponse.json(
            { error: "Failed to create formula" },
            { status: 500 }
        );
    }
}