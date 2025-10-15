import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { materials, materialCategories } from "@/db/schema/inventory";
import { eq, ilike, and, desc, sql, or } from "drizzle-orm";
import { 
    createMaterialSchema, 
    materialFilterSchema 
} from "@/lib/validations/inventory";
import { generateMaterialCode } from "@/lib/utils/inventory";
import { generateId } from "better-auth";

// GET /api/inventory/materials - Get all materials
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = materialFilterSchema.parse(Object.fromEntries(searchParams));

        const offset = (filters.page - 1) * filters.limit;

        const whereConditions = [];
        
        if (filters.categoryId) {
            whereConditions.push(eq(materials.categoryId, filters.categoryId));
        }
        
        if (filters.search) {
            whereConditions.push(
                or(
                    ilike(materials.name, `%${filters.search}%`),
                    ilike(materials.code, `%${filters.search}%`),
                    ilike(materials.description, `%${filters.search}%`)
                )
            );
        }
        
        if (filters.isActive !== undefined) {
            whereConditions.push(eq(materials.isActive, filters.isActive));
        }

        if (filters.lowStock) {
            whereConditions.push(
                sql`${materials.currentStock} <= ${materials.minStockLevel}`
            );
        }

        const materialsData = await db
            .select({
                id: materials.id,
                code: materials.code,
                name: materials.name,
                description: materials.description,
                categoryId: materials.categoryId,
                category: materialCategories.name,
                unit: materials.unit,
                currentStock: materials.currentStock,
                minStockLevel: materials.minStockLevel,
                maxStockLevel: materials.maxStockLevel,
                unitCost: materials.unitCost,
                isActive: materials.isActive,
                createdAt: materials.createdAt,
                updatedAt: materials.updatedAt,
            })
            .from(materials)
            .leftJoin(materialCategories, eq(materials.categoryId, materialCategories.id))
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(desc(materials.createdAt))
            .limit(filters.limit)
            .offset(offset);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(materials)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        return NextResponse.json({
            data: materialsData,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: Number(totalCount[0]?.count || 0),
                totalPages: Math.ceil((totalCount[0]?.count || 0) / filters.limit),
            },
        });
    } catch (error) {
        console.error("Error fetching materials:", error);
        return NextResponse.json(
            { error: "Failed to fetch materials" },
            { status: 500 }
        );
    }
}

// POST /api/inventory/materials - Create a new material
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createMaterialSchema.parse(body);

        // Generate material code
        const materialCode = await generateMaterialCode(validatedData.categoryId);

        const newMaterial = {
            id: generateId(),
            code: materialCode,
            ...validatedData,
            currentStock: validatedData.currentStock.toString(),
            minStockLevel: validatedData.minStockLevel.toString(),
            maxStockLevel: validatedData.maxStockLevel?.toString() || null,
            unitCost: validatedData.unitCost.toString(),
        };

        const [material] = await db
            .insert(materials)
            .values(newMaterial)
            .returning();

        return NextResponse.json(material, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating material:", error);
        return NextResponse.json(
            { error: "Failed to create material" },
            { status: 500 }
        );
    }
}