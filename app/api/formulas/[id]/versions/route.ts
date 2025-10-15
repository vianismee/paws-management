import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { formulaVersions, formulas, formulaIngredients, materials } from "@/db/schema/formulations";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
    createFormulaVersionSchema, 
    formulaVersionFilterSchema 
} from "@/lib/validations/formulations";
import { generateId } from "better-auth";

// GET /api/formulas/[id]/versions - Get all versions of a formula
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = formulaVersionFilterSchema.parse(Object.fromEntries(searchParams));

        const offset = (filters.page - 1) * filters.limit;

        const whereConditions = [eq(formulaVersions.formulaId, params.id)];
        
        if (filters.status) {
            whereConditions.push(eq(formulaVersions.status, filters.status));
        }
        
        if (filters.isCurrent !== undefined) {
            whereConditions.push(eq(formulaVersions.isCurrent, filters.isCurrent));
        }

        const versionsData = await db
            .select({
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
                ingredientCount: sql<number>`(
                    SELECT COUNT(*) FROM formula_ingredients 
                    WHERE formula_ingredients.formula_version_id = formula_versions.id
                )`.as('ingredientCount'),
            })
            .from(formulaVersions)
            .where(and(...whereConditions))
            .orderBy(desc(formulaVersions.version))
            .limit(filters.limit)
            .offset(offset);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(formulaVersions)
            .where(and(...whereConditions));

        return NextResponse.json({
            data: versionsData,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: Number(totalCount[0]?.count || 0),
                totalPages: Math.ceil((totalCount[0]?.count || 0) / filters.limit),
            },
        });
    } catch (error) {
        console.error("Error fetching formula versions:", error);
        return NextResponse.json(
            { error: "Failed to fetch formula versions" },
            { status: 500 }
        );
    }
}

// POST /api/formulas/[id]/versions - Create a new version of a formula
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const validatedData = createFormulaVersionSchema.parse({
            ...body,
            formulaId: params.id,
        });

        // Get the highest existing version number for this formula
        const [lastVersion] = await db
            .select({ version: formulaVersions.version })
            .from(formulaVersions)
            .where(eq(formulaVersions.formulaId, params.id))
            .orderBy(desc(formulaVersions.version))
            .limit(1);

        const nextVersion = (lastVersion?.version || 0) + 1;

        // If this is marked as current, unmark all other versions
        if (validatedData.isCurrent) {
            await db
                .update(formulaVersions)
                .set({ isCurrent: false })
                .where(eq(formulaVersions.formulaId, params.id));
        }

        const newVersion = {
            id: generateId(),
            formulaId: params.id,
            version: nextVersion,
            ...validatedData,
            targetBatchSize: validatedData.targetBatchSize.toString(),
        };

        const [version] = await db
            .insert(formulaVersions)
            .values(newVersion)
            .returning();

        return NextResponse.json(version, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating formula version:", error);
        return NextResponse.json(
            { error: "Failed to create formula version" },
            { status: 500 }
        );
    }
}