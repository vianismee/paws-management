import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { materials, materialCategories, suppliers, stockMovements } from "@/db/schema/inventory";
import { eq, sql, and } from "drizzle-orm";

// GET /api/inventory - Get inventory overview
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const lowStockOnly = searchParams.get('lowStock') === 'true';

        // Get basic counts
        const [totalMaterials, totalCategories, totalSuppliers] = await Promise.all([
            db.select({ count: sql<number>`count(*)` }).from(materials),
            db.select({ count: sql<number>`count(*)` }).from(materialCategories),
            db.select({ count: sql<number>`count(*)` }).from(suppliers),
        ]);

        // Get low stock materials
        const lowStockCondition = sql`${materials.currentStock} <= ${materials.minStockLevel}`;
        const [lowStockMaterials, lowStockCount] = await Promise.all([
            db
                .select({
                    id: materials.id,
                    code: materials.code,
                    name: materials.name,
                    currentStock: materials.currentStock,
                    minStockLevel: materials.minStockLevel,
                    unit: materials.unit,
                    category: materialCategories.name,
                })
                .from(materials)
                .leftJoin(materialCategories, eq(materials.categoryId, materialCategories.id))
                .where(and(eq(materials.isActive, true), lowStockCondition))
                .limit(10),
            db
                .select({ count: sql<number>`count(*)` })
                .from(materials)
                .where(and(eq(materials.isActive, true), lowStockCondition)),
        ]);

        // Get recent stock movements
        const recentMovements = await db
            .select({
                id: stockMovements.id,
                materialName: materials.name,
                materialCode: materials.code,
                movementType: stockMovements.movementType,
                quantity: stockMovements.quantity,
                remainingStock: stockMovements.remainingStock,
                reason: stockMovements.reason,
                createdAt: stockMovements.createdAt,
            })
            .from(stockMovements)
            .leftJoin(materials, eq(stockMovements.materialId, materials.id))
            .orderBy(sql`${stockMovements.createdAt} DESC`)
            .limit(10);

        // Get inventory value by category
        const inventoryByCategory = await db
            .select({
                category: materialCategories.name,
                totalItems: sql<number>`count(*)`,
                totalValue: sql<number>`SUM(${materials.currentStock} * ${materials.unitCost})`,
            })
            .from(materials)
            .leftJoin(materialCategories, eq(materials.categoryId, materialCategories.id))
            .where(eq(materials.isActive, true))
            .groupBy(materialCategories.name)
            .orderBy(sql`totalValue DESC`);

        const response = {
            overview: {
                totalMaterials: Number(totalMaterials[0]?.count || 0),
                totalCategories: Number(totalCategories[0]?.count || 0),
                totalSuppliers: Number(totalSuppliers[0]?.count || 0),
                lowStockItems: Number(lowStockCount[0]?.count || 0),
            },
            lowStockMaterials: lowStockOnly ? lowStockMaterials : lowStockMaterials.slice(0, 5),
            recentMovements,
            inventoryByCategory,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching inventory overview:", error);
        return NextResponse.json(
            { error: "Failed to fetch inventory overview" },
            { status: 500 }
        );
    }
}