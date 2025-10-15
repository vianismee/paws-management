import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { suppliers } from "@/db/schema/inventory";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import { 
    createSupplierSchema, 
    paginationSchema 
} from "@/lib/validations/inventory";
import { generateId } from "better-auth";

// GET /api/inventory/suppliers - Get all suppliers
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = paginationSchema.parse(Object.fromEntries(searchParams));
        const search = searchParams.get('search');
        const isActive = searchParams.get('isActive');

        const offset = (filters.page - 1) * filters.limit;

        const whereConditions = [eq(suppliers.isActive, true)];
        
        if (search) {
            whereConditions.push(
                ilike(suppliers.name, `%${search}%`)
            );
        }
        
        if (isActive !== null) {
            whereConditions.push(
                eq(suppliers.isActive, isActive === 'true')
            );
        }

        const suppliersData = await db
            .select()
            .from(suppliers)
            .where(and(...whereConditions))
            .orderBy(desc(suppliers.createdAt))
            .limit(filters.limit)
            .offset(offset);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(suppliers)
            .where(and(...whereConditions));

        return NextResponse.json({
            data: suppliersData,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: Number(totalCount[0]?.count || 0),
                totalPages: Math.ceil((totalCount[0]?.count || 0) / filters.limit),
            },
        });
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return NextResponse.json(
            { error: "Failed to fetch suppliers" },
            { status: 500 }
        );
    }
}

// POST /api/inventory/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createSupplierSchema.parse(body);

        // Check if supplier code already exists
        const existingSupplier = await db
            .select()
            .from(suppliers)
            .where(eq(suppliers.code, validatedData.code))
            .limit(1);

        if (existingSupplier.length > 0) {
            return NextResponse.json(
                { error: "Supplier code already exists" },
                { status: 400 }
            );
        }

        const newSupplier = {
            id: generateId(),
            ...validatedData,
        };

        const [supplier] = await db
            .insert(suppliers)
            .values(newSupplier)
            .returning();

        return NextResponse.json(supplier, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating supplier:", error);
        return NextResponse.json(
            { error: "Failed to create supplier" },
            { status: 500 }
        );
    }
}