import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { materialCategories } from "@/db/schema/inventory";
import { eq, ilike, and, desc } from "drizzle-orm";
import { 
    createMaterialCategorySchema, 
    updateMaterialCategorySchema,
    categoryFilterSchema 
} from "@/lib/validations/inventory";
import { generateId } from "better-auth";

// GET /api/inventory/categories - Get all categories
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = categoryFilterSchema.parse(Object.fromEntries(searchParams));

        const offset = (filters.page - 1) * filters.limit;

        const whereConditions = [];
        
        if (filters.search) {
            whereConditions.push(ilike(materialCategories.name, `%${filters.search}%`));
        }
        
        if (filters.isActive !== undefined) {
            whereConditions.push(eq(materialCategories.isActive, filters.isActive));
        }

        const categories = await db
            .select()
            .from(materialCategories)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(desc(materialCategories.createdAt))
            .limit(filters.limit)
            .offset(offset);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(materialCategories)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        return NextResponse.json({
            data: categories,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: Number(totalCount[0]?.count || 0),
                totalPages: Math.ceil((totalCount[0]?.count || 0) / filters.limit),
            },
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

// POST /api/inventory/categories - Create a new category
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createMaterialCategorySchema.parse(body);

        const newCategory = {
            id: generateId(),
            ...validatedData,
        };

        const [category] = await db
            .insert(materialCategories)
            .values(newCategory)
            .returning();

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating category:", error);
        return NextResponse.json(
            { error: "Failed to create category" },
            { status: 500 }
        );
    }
}