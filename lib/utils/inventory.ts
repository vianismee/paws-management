import { db } from "@/db";
import { materialCategories, materials } from "@/db/schema/inventory";
import { eq, sql, desc } from "drizzle-orm";

export async function generateMaterialCode(categoryId: string): Promise<string> {
    // Get the category to get its code prefix
    const category = await db
        .select({ codePrefix: materialCategories.codePrefix })
        .from(materialCategories)
        .where(eq(materialCategories.id, categoryId))
        .limit(1);

    if (!category.length) {
        throw new Error("Category not found");
    }

    const prefix = category[0].codePrefix;

    // Find the highest existing material code for this category
    const lastMaterial = await db
        .select({ code: materials.code })
        .from(materials)
        .where(sql`${materials.code} LIKE ${prefix + '-%'}`)
        .orderBy(desc(materials.code))
        .limit(1);

    let nextNumber = 1;
    
    if (lastMaterial.length > 0) {
        const lastCode = lastMaterial[0].code;
        const parts = lastCode.split('-');
        const lastNumber = parseInt(parts[parts.length - 1]);
        
        if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
        }
    }

    // Format as 3-digit number with leading zeros
    return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
}

export async function generateSupplierCode(): Promise<string> {
    // Find the highest existing supplier code
    const lastSupplier = await db
        .select({ code: sql`CAST(REPLACE(code, 'SUP-', '') AS INTEGER)` })
        .from(materials) // Using materials table as a placeholder, should use suppliers table
        .where(sql`code LIKE 'SUP-%'`)
        .orderBy(desc(sql`CAST(REPLACE(code, 'SUP-', '') AS INTEGER)`))
        .limit(1);

    let nextNumber = 1;
    
    if (lastSupplier.length > 0) {
        const lastNumber = lastSupplier[0].code as number;
        if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
        }
    }

    return `SUP-${nextNumber.toString().padStart(3, '0')}`;
}

export function validateMaterialCode(code: string): boolean {
    // Pattern: CATEGORY-XXX (e.g., OIL-001, WAX-023)
    const pattern = /^[A-Z]{2,4}-\d{3}$/;
    return pattern.test(code);
}

export function validateSupplierCode(code: string): boolean {
    // Pattern: SUP-XXX (e.g., SUP-001)
    const pattern = /^SUP-\d{3}$/;
    return pattern.test(code);
}

export function extractCategoryFromCode(code: string): string {
    const parts = code.split('-');
    return parts[0] || '';
}