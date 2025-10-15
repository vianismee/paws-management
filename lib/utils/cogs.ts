import Decimal from "decimal.js";
import { 
    formulaVersions, 
    formulaIngredients, 
    formulaPackaging, 
    formulaLabels,
    materials,
    cogsCalculations,
    cogsIngredientCosts,
    cogsPackagingCosts,
    cogsLabelCosts,
    costTemplates,
    materialCostHistory
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/db";

export interface CogsCalculationInput {
    formulaVersionId: string;
    batchSize: string | Decimal;
    producedUnits: string | Decimal;
    packagingCosts?: Array<{
        name: string;
        quantity: string | Decimal;
        unitCost: string | Decimal;
    }>;
    labelCosts?: Array<{
        name: string;
        quantity: string | Decimal;
        unitCost: string | Decimal;
    }>;
    wastePercentage?: string | Decimal;
    laborHours?: string | Decimal;
    laborRatePerHour?: string | Decimal;
    overheadCost?: string | Decimal;
}

export interface CogsCalculationResult {
    formulaVersionId: string;
    batchSize: Decimal;
    batchUnit: string;
    producedUnits: Decimal;
    
    // Cost breakdowns
    ingredientsCost: Decimal;
    packagingCost: Decimal;
    labelCost: Decimal;
    laborCost: Decimal;
    overheadCost: Decimal;
    
    // Totals
    totalCost: Decimal;
    costPerUnit: Decimal;
    costPerKg: Decimal; // For comparison
    
    // Additional metrics
    wasteCost: Decimal;
    effectiveYield: Decimal;
    
    // Detailed breakdowns
    ingredientBreakdown: Array<{
        materialId: string;
        materialName: string;
        percentage: string;
        quantity: Decimal;
        unit: string;
        unitCost: Decimal;
        totalCost: Decimal;
    }>;
    
    packagingBreakdown: Array<{
        name: string;
        quantity: Decimal;
        unit: string;
        unitCost: Decimal;
        totalCost: Decimal;
    }>;
    
    labelBreakdown: Array<{
        name: string;
        quantity: Decimal;
        unit: string;
        unitCost: Decimal;
        totalCost: Decimal;
    }>;
}

export async function calculateCogs(input: CogsCalculationInput): Promise<CogsCalculationResult> {
    const batchSize = new Decimal(input.batchSize);
    const producedUnits = new Decimal(input.producedUnits);
    const wastePercentage = new Decimal(input.wastePercentage || "0");
    const laborHours = new Decimal(input.laborHours || "0");
    const laborRatePerHour = new Decimal(input.laborRatePerHour || "0");
    const overheadCost = new Decimal(input.overheadCost || "0");

    // Get formula version details
    const [formulaVersion] = await db
        .select()
        .from(formulaVersions)
        .where(eq(formulaVersions.id, input.formulaVersionId))
        .limit(1);

    if (!formulaVersion) {
        throw new Error("Formula version not found");
    }

    // Get formula ingredients with material costs
    const ingredients = await db
        .select({
            materialId: formulaIngredients.materialId,
            materialName: materials.name,
            materialCode: materials.code,
            percentage: formulaIngredients.percentage,
            quantity: formulaIngredients.quantity,
            unit: formulaIngredients.unit,
            unitCost: materials.unitCost,
            order: formulaIngredients.order,
            notes: formulaIngredients.notes,
        })
        .from(formulaIngredients)
        .leftJoin(materials, eq(formulaIngredients.materialId, materials.id))
        .where(eq(formulaIngredients.formulaVersionId, input.formulaVersionId))
        .orderBy(formulaIngredients.order);

    // Get formula packaging if available
    const packaging = await db
        .select()
        .from(formulaPackaging)
        .where(eq(formulaPackaging.formulaVersionId, input.formulaVersionId));

    // Get formula labels if available
    const labels = await db
        .select()
        .from(formulaLabels)
        .where(eq(formulaLabels.formulaVersionId, input.formulaVersionId));

    // Calculate ingredient costs
    let ingredientsCost = new Decimal(0);
    const ingredientBreakdown = [];

    for (const ingredient of ingredients) {
        const actualQuantity = batchSize.mul(new Decimal(ingredient.percentage).div(100));
        const unitCost = new Decimal(ingredient.unitCost.toString());
        const totalCost = actualQuantity.mul(unitCost);
        
        ingredientsCost = ingredientsCost.plus(totalCost);
        
        ingredientBreakdown.push({
            materialId: ingredient.materialId,
            materialName: ingredient.materialName,
            percentage: ingredient.percentage,
            quantity: actualQuantity,
            unit: ingredient.unit,
            unitCost,
            totalCost,
        });
    }

    // Calculate packaging costs
    let packagingCost = new Decimal(0);
    const packagingBreakdown = [];

    // Use provided packaging costs or formula packaging
    const packagingData = input.packagingCosts || packaging;
    for (const pkg of packagingData) {
        const quantity = new Decimal(pkg.quantity);
        const unitCost = new Decimal(pkg.unitCost);
        const totalCost = quantity.mul(unitCost);
        
        packagingCost = packagingCost.plus(totalCost);
        
        packagingBreakdown.push({
            name: pkg.name || pkg.packagingName,
            quantity,
            unit: pkg.unit,
            unitCost,
            totalCost,
        });
    }

    // Calculate label costs
    let labelCost = new Decimal(0);
    const labelBreakdown = [];

    // Use provided label costs or formula labels
    const labelData = input.labelCosts || labels;
    for (const lbl of labelData) {
        const quantity = new Decimal(lbl.quantity);
        const unitCost = new Decimal(lbl.unitCost);
        const totalCost = quantity.mul(unitCost);
        
        labelCost = labelCost.plus(totalCost);
        
        labelBreakdown.push({
            name: lbl.name || lbl.labelName,
            quantity,
            unit: lbl.unit,
            unitCost,
            totalCost,
        });
    }

    // Calculate labor cost
    const laborCost = laborHours.mul(laborRatePerHour);

    // Calculate waste cost
    const wasteMultiplier = new Decimal(1).plus(wastePercentage.div(100));
    const wasteCost = ingredientsCost.mul(wastePercentage.div(100));

    // Calculate total costs
    const totalIngredientsCost = ingredientsCost.add(wasteCost);
    const totalCost = totalIngredientsCost.add(packagingCost).add(labelCost).add(laborCost).add(overheadCost);
    const costPerUnit = producedUnits.gt(0) ? totalCost.div(producedUnits) : new Decimal(0);
    
    // Calculate cost per kg for comparison
    const batchKg = formulaVersion.batchSizeUnit.toLowerCase().includes('kg') 
        ? batchSize 
        : formulaVersion.batchSizeUnit.toLowerCase().includes('g') 
            ? batchSize.div(1000) 
            : batchSize; // Fallback to batch size
    const costPerKg = batchKg.gt(0) ? totalCost.div(batchKg) : new Decimal(0);

    // Calculate effective yield
    const effectiveYield = batchSize.gt(0) ? producedUnits.div(batchSize).mul(100) : new Decimal(0);

    return {
        formulaVersionId: input.formulaVersionId,
        batchSize,
        batchUnit: formulaVersion.batchSizeUnit,
        producedUnits,
        
        ingredientsCost: totalIngredientsCost,
        packagingCost,
        labelCost,
        laborCost,
        overheadCost,
        
        totalCost,
        costPerUnit,
        costPerKg,
        
        wasteCost,
        effectiveYield,
        
        ingredientBreakdown,
        packagingBreakdown,
        labelBreakdown,
    };
}

export async function saveCogsCalculation(
    calculation: CogsCalculationResult,
    status: string = "calculated",
    notes?: string
): Promise<string> {
    const cogsId = `cogs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.transaction(async (tx) => {
        // Insert main COGS calculation
        await tx.insert(cogsCalculations).values({
            id: cogsId,
            formulaVersionId: calculation.formulaVersionId,
            calculationDate: new Date(),
            batchSize: calculation.batchSize.toString(),
            batchUnit: calculation.batchUnit,
            ingredientsCost: calculation.ingredientsCost.toString(),
            packagingCost: calculation.packagingCost.toString(),
            labelCost: calculation.labelCost.toString(),
            laborCost: calculation.laborCost.toString(),
            overheadCost: calculation.overheadCost.toString(),
            totalCost: calculation.totalCost.toString(),
            costPerUnit: calculation.costPerUnit.toString(),
            producedUnits: calculation.producedUnits.toString(),
            status,
            notes: notes || null,
        });

        // Insert ingredient cost details
        for (const ingredient of calculation.ingredientBreakdown) {
            await tx.insert(cogsIngredientCosts).values({
                id: `cogs_ing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                cogsCalculationId: cogsId,
                materialId: ingredient.materialId,
                materialName: ingredient.materialName,
                percentage: ingredient.percentage,
                quantity: ingredient.quantity.toString(),
                unit: ingredient.unit,
                unitCost: ingredient.unitCost.toString(),
                totalCost: ingredient.totalCost.toString(),
            });
        }

        // Insert packaging cost details
        for (const pkg of calculation.packagingBreakdown) {
            await tx.insert(cogsPackagingCosts).values({
                id: `cogs_pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                cogsCalculationId: cogsId,
                packagingName: pkg.name,
                quantity: pkg.quantity.toString(),
                unit: pkg.unit,
                unitCost: pkg.unitCost.toString(),
                totalCost: pkg.totalCost.toString(),
            });
        }

        // Insert label cost details
        for (const lbl of calculation.labelBreakdown) {
            await tx.insert(cogsLabelCosts).values({
                id: `cogs_lbl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                cogsCalculationId: cogsId,
                labelName: lbl.name,
                quantity: lbl.quantity.toString(),
                unit: lbl.unit,
                unitCost: lbl.unitCost.toString(),
                totalCost: lbl.totalCost.toString(),
            });
        }
    });

    return cogsId;
}

export async function getMaterialCostHistory(materialId: string, limit: number = 10) {
    return await db
        .select()
        .from(materialCostHistory)
        .where(eq(materialCostHistory.materialId, materialId))
        .orderBy(desc(materialCostHistory.effectiveDate))
        .limit(limit);
}

export async function updateMaterialCost(
    materialId: string,
    newUnitCost: string,
    reason?: string,
    supplier?: string
): Promise<void> {
    await db.transaction(async (tx) => {
        // Update material cost
        await tx
            .update(materials)
            .set({ 
                unitCost: newUnitCost,
                updatedAt: new Date()
            })
            .where(eq(materials.id, materialId));

        // Add to cost history
        await tx.insert(materialCostHistory).values({
            id: `cost_hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            materialId,
            unitCost: newUnitCost,
            effectiveDate: new Date(),
            reason: reason || "Cost update",
            supplier,
        });
    });
}

export async function applyCostTemplate(
    templateId: string,
    formulaVersionId: string
): Promise<CogsCalculationInput> {
    const [template] = await db
        .select()
        .from(costTemplates)
        .where(eq(costTemplates.id, templateId))
        .limit(1);

    if (!template) {
        throw new Error("Cost template not found");
    }

    const [formulaVersion] = await db
        .select()
        .from(formulaVersions)
        .where(eq(formulaVersions.id, formulaVersionId))
        .limit(1);

    if (!formulaVersion) {
        throw new Error("Formula version not found");
    }

    return {
        formulaVersionId,
        batchSize: formulaVersion.targetBatchSize,
        producedUnits: formulaVersion.targetBatchSize, // Default to 1:1 production
        wastePercentage: template.defaultWastePercentage,
        laborHours: template.defaultLaborHours,
        laborRatePerHour: template.defaultLaborRatePerHour,
        overheadCost: formulaVersion.targetBatchSize.mul(new Decimal(template.defaultOverheadPercentage).div(100)).toString(),
    };
}

export function calculatePricing(
    costPerUnit: Decimal,
    pricingRules: Array<{
        markupType: string;
        markupValue: string;
        minQuantity: string;
        maxQuantity?: string;
    }>,
    quantity: Decimal
): {
    sellingPrice: Decimal;
    markupAmount: Decimal;
    markupPercentage: Decimal;
    grossMargin: Decimal;
    grossMarginPercentage: Decimal;
    appliedRule?: any;
} {
    // Find applicable pricing rule
    const applicableRule = pricingRules
        .filter(rule => {
            const minQty = new Decimal(rule.minQuantity);
            const maxQty = rule.maxQuantity ? new Decimal(rule.maxQuantity) : Infinity;
            return quantity.gte(minQty) && quantity.lte(maxQty);
        })
        .sort((a, b) => {
            const priorityA = parseInt(a.priority?.toString() || "0");
            const priorityB = parseInt(b.priority?.toString() || "0");
            return priorityB - priorityA; // Higher priority first
        })[0];

    let sellingPrice = costPerUnit;
    let markupAmount = new Decimal(0);

    if (applicableRule) {
        const markupValue = new Decimal(applicableRule.markupValue);

        switch (applicableRule.markupType) {
            case "percentage":
                markupAmount = costPerUnit.mul(markupValue.div(100));
                sellingPrice = costPerUnit.add(markupAmount);
                break;
            case "fixed_amount":
                markupAmount = markupValue;
                sellingPrice = costPerUnit.add(markupAmount);
                break;
            case "target_margin":
                sellingPrice = costPerUnit.div(new Decimal(1).minus(markupValue.div(100)));
                markupAmount = sellingPrice.minus(costPerUnit);
                break;
        }
    }

    const markupPercentage = costPerUnit.gt(0) ? markupAmount.div(costPerUnit).mul(100) : new Decimal(0);
    const grossMargin = sellingPrice.minus(costPerUnit);
    const grossMarginPercentage = sellingPrice.gt(0) ? grossMargin.div(sellingPrice).mul(100) : new Decimal(0);

    return {
        sellingPrice,
        markupAmount,
        markupPercentage,
        grossMargin,
        grossMarginPercentage,
        appliedRule: applicableRule,
    };
}