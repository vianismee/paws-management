import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { costTemplates } from "@/db/schema/formulations";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import { 
    createCostTemplateSchema, 
    costTemplateFilterSchema 
} from "@/lib/validations/cogs";
import { generateId } from "better-auth";

// GET /api/cogs/templates - Get all cost templates
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = costTemplateFilterSchema.parse(Object.fromEntries(searchParams));

        const offset = (filters.page - 1) * filters.limit;

        const whereConditions = [];
        
        if (filters.productType) {
            whereConditions.push(eq(costTemplates.productType, filters.productType));
        }
        
        if (filters.isActive !== undefined) {
            whereConditions.push(eq(costTemplates.isActive, filters.isActive));
        }

        if (filters.search) {
            whereConditions.push(
                ilike(costTemplates.name, `%${filters.search}%`)
            );
        }

        const templates = await db
            .select()
            .from(costTemplates)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(desc(costTemplates.createdAt))
            .limit(filters.limit)
            .offset(offset);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(costTemplates)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        return NextResponse.json({
            data: templates,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: Number(totalCount[0]?.count || 0),
                totalPages: Math.ceil((totalCount[0]?.count || 0) / filters.limit),
            },
        });
    } catch (error) {
        console.error("Error fetching cost templates:", error);
        return NextResponse.json(
            { error: "Failed to fetch cost templates" },
            { status: 500 }
        );
    }
}

// POST /api/cogs/templates - Create a new cost template
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createCostTemplateSchema.parse(body);

        const newTemplate = {
            id: generateId(),
            ...validatedData,
            defaultWastePercentage: validatedData.defaultWastePercentage.toString(),
            defaultLaborHours: validatedData.defaultLaborHours.toString(),
            defaultLaborRatePerHour: validatedData.defaultLaborRatePerHour.toString(),
            defaultOverheadPercentage: validatedData.defaultOverheadPercentage.toString(),
        };

        const [template] = await db
            .insert(costTemplates)
            .values(newTemplate)
            .returning();

        return NextResponse.json(template, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating cost template:", error);
        return NextResponse.json(
            { error: "Failed to create cost template" },
            { status: 500 }
        );
    }
}