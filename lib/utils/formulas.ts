import Decimal from "decimal.js";

export function validateIngredientPercentages(ingredients: { percentage: string }[]): { isValid: boolean; totalPercentage: Decimal; errors: string[] } {
    const errors: string[] = [];
    let totalPercentage = new Decimal(0);

    for (const ingredient of ingredients) {
        try {
            const percentage = new Decimal(ingredient.percentage);
            
            if (percentage.lt(0)) {
                errors.push(`Ingredient percentage cannot be negative: ${ingredient.percentage}`);
            }
            
            if (percentage.gt(100)) {
                errors.push(`Ingredient percentage cannot exceed 100%: ${ingredient.percentage}`);
            }
            
            totalPercentage = totalPercentage.plus(percentage);
        } catch (error) {
            errors.push(`Invalid percentage format: ${ingredient.percentage}`);
        }
    }

    const tolerance = new Decimal("0.01"); // Allow small rounding errors
    const isValid = totalPercentage.gte(99.99) && totalPercentage.lte(100.01) && errors.length === 0;

    if (!isValid && errors.length === 0) {
        errors.push(`Ingredient percentages must sum to 100%. Current total: ${totalPercentage.toFixed(2)}%`);
    }

    return {
        isValid,
        totalPercentage,
        errors,
    };
}

export function calculateIngredientQuantities(
    ingredients: { percentage: string; materialId: string; unit: string }[],
    targetBatchSize: string | Decimal
): { materialId: string; percentage: string; quantity: string; unit: string }[] {
    const batchSize = new Decimal(targetBatchSize);
    
    return ingredients.map(ingredient => ({
        materialId: ingredient.materialId,
        percentage: ingredient.percentage,
        quantity: batchSize.mul(new Decimal(ingredient.percentage).div(100)).toString(),
        unit: ingredient.unit,
    }));
}

export function calculateFormulaCost(
    ingredients: Array<{
        percentage: string;
        unitCost: string;
        quantity: string;
    }>,
    packagingCosts: Array<{
        quantity: string;
        unitCost: string;
    }> = [],
    labelCosts: Array<{
        quantity: string;
        unitCost: string;
    }> = []
): {
    ingredientsCost: Decimal;
    packagingCost: Decimal;
    labelCost: Decimal;
    totalCost: Decimal;
    costBreakdown: Array<{
        type: 'ingredient' | 'packaging' | 'label';
        cost: Decimal;
        details: any;
    }>;
} {
    let ingredientsCost = new Decimal(0);
    let packagingCost = new Decimal(0);
    let labelCost = new Decimal(0);
    const costBreakdown: Array<{
        type: 'ingredient' | 'packaging' | 'label';
        cost: Decimal;
        details: any;
    }> = [];

    // Calculate ingredient costs
    for (const ingredient of ingredients) {
        const cost = new Decimal(ingredient.quantity).mul(new Decimal(ingredient.unitCost));
        ingredientsCost = ingredientsCost.plus(cost);
        
        costBreakdown.push({
            type: 'ingredient',
            cost,
            details: ingredient,
        });
    }

    // Calculate packaging costs
    for (const packaging of packagingCosts) {
        const cost = new Decimal(packaging.quantity).mul(new Decimal(packaging.unitCost));
        packagingCost = packagingCost.plus(cost);
        
        costBreakdown.push({
            type: 'packaging',
            cost,
            details: packaging,
        });
    }

    // Calculate label costs
    for (const label of labelCosts) {
        const cost = new Decimal(label.quantity).mul(new Decimal(label.unitCost));
        labelCost = labelCost.plus(cost);
        
        costBreakdown.push({
            type: 'label',
            cost,
            details: label,
        });
    }

    const totalCost = ingredientsCost.plus(packagingCost).plus(labelCost);

    return {
        ingredientsCost,
        packagingCost,
        labelCost,
        totalCost,
        costBreakdown,
    };
}

export function generateBatchNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `B${year}${month}${day}-${random}`;
}

export function isValidFormulaStatus(status: string): boolean {
    return ['draft', 'active', 'inactive', 'archived'].includes(status);
}

export function isValidProductionStatus(status: string): boolean {
    return ['planned', 'in_progress', 'completed', 'cancelled'].includes(status);
}

export function canEditFormula(status: string): boolean {
    return ['draft', 'inactive'].includes(status);
}

export function canArchiveFormula(status: string): boolean {
    return ['active', 'inactive'].includes(status);
}

export function calculateVersionEfficiency(
    plannedCosts: { totalCost: Decimal },
    actualCosts: { totalCost: Decimal }
): {
    efficiency: Decimal;
    variance: Decimal;
    variancePercentage: Decimal;
    isEfficient: boolean;
} {
    const efficiency = plannedCosts.totalCost.gt(0) 
        ? plannedCosts.totalCost.div(actualCosts.totalCost).mul(100)
        : new Decimal(100);
    
    const variance = actualCosts.totalCost.minus(plannedCosts.totalCost);
    const variancePercentage = plannedCosts.totalCost.gt(0)
        ? variance.div(plannedCosts.totalCost).mul(100)
        : new Decimal(0);
    
    const isEfficient = variance.lte(0); // Efficient if actual cost is less than or equal to planned cost

    return {
        efficiency,
        variance,
        variancePercentage,
        isEfficient,
    };
}