import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { packagingTypes } from "@/db/schema/inventory";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import { 
    createPackagingTypeSchema, 
    paginationSchema 
} from "@/lib/validations/inventory";
import { generateId } from "better-auth";

// GET /api/inventory/packaging - Get all packaging types
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = paginationSchema.parse(Object.fromEntries(searchParams));

        const offset = (filters.page - 1) * filters.limit;

        const packagingData = await db
            .select()
            .from(packagingTypes)
            .where(eq(packagingTypes.isActive, true))
            .orderBy(desc(packagingTypes.createdAt))
            .limit(filters.limit)
            .offset(offset);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(packagingTypes)
            .where(eq(packagingTypes.isActive, true));

        return NextResponse.json({
            data: packagingData,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: Number(totalCount[0]?.count || 0),
                totalPages: Math.ceil((totalCount[0]?.count || 0) / filters.limit),
            },
        });
    } catch (error) {
        console.error("Error fetching packaging types:", error);
        return NextResponse.json(
            { error: "Failed to fetch packaging types" },
            { status: 500 }
        );
    }
}

// POST /api/inventory/packaging - Create a new packaging type
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createPackagingTypeSchema.parse(body);

        const newPackaging = {
            id: generateId(),
            ...validatedData,
            unitCost: validatedData.unitCost.toString(),
        };

        const [packaging] = await db
            .insert(packagingTypes)
            .values(newPackaging)
            .returning();

        return NextResponse.json(packaging, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating packaging type:", error);
        return NextResponse.json(
            { error: "Failed to create packaging type" },
            { status: 500 }
        );
    }
}