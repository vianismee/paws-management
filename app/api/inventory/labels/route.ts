import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { labelTypes } from "@/db/schema/inventory";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import { 
    createLabelTypeSchema, 
    paginationSchema 
} from "@/lib/validations/inventory";
import { generateId } from "better-auth";

// GET /api/inventory/labels - Get all label types
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = paginationSchema.parse(Object.fromEntries(searchParams));

        const offset = (filters.page - 1) * filters.limit;

        const labelsData = await db
            .select()
            .from(labelTypes)
            .where(eq(labelTypes.isActive, true))
            .orderBy(desc(labelTypes.createdAt))
            .limit(filters.limit)
            .offset(offset);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(labelTypes)
            .where(eq(labelTypes.isActive, true));

        return NextResponse.json({
            data: labelsData,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: Number(totalCount[0]?.count || 0),
                totalPages: Math.ceil((totalCount[0]?.count || 0) / filters.limit),
            },
        });
    } catch (error) {
        console.error("Error fetching label types:", error);
        return NextResponse.json(
            { error: "Failed to fetch label types" },
            { status: 500 }
        );
    }
}

// POST /api/inventory/labels - Create a new label type
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createLabelTypeSchema.parse(body);

        const newLabel = {
            id: generateId(),
            ...validatedData,
            unitCost: validatedData.unitCost.toString(),
        };

        const [label] = await db
            .insert(labelTypes)
            .values(newLabel)
            .returning();

        return NextResponse.json(label, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating label type:", error);
        return NextResponse.json(
            { error: "Failed to create label type" },
            { status: 500 }
        );
    }
}