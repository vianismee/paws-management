import { eq, desc, asc, sql, and } from 'drizzle-orm';
import { Decimal } from 'decimal.js';
import { clientDb, executeDbOperation } from '../client-db';
import {
  cogsCalculations,
  materialCostBreakdown,
  formulaPricing,
  pricingRules,
  formulaPackaging,
  formulaLabels
} from '../../db/schema/cogs';

// Type definitions
type CogsCalculation = typeof cogsCalculations.$inferSelect;
type MaterialCostBreakdown = typeof materialCostBreakdown.$inferSelect;
type FormulaPricing = typeof formulaPricing.$inferSelect;
type PricingRule = typeof pricingRules.$inferSelect;
import { packaging, labels, materials } from '../../db/schema/inventory';
import { formulaIngredients, formulaVersions } from '../../db/schema/formulas';
import { inventoryMaterials } from '../../db/schema/inventory';

// COGS Calculations
export interface CostBreakdown {
  materialCost: Decimal;
  packagingCost: Decimal;
  labelCost: Decimal;
  laborCost: Decimal;
  overheadCost: Decimal;
  totalCost: Decimal;
  unitWeight: Decimal;
  costPerGram: Decimal;
}

export async function calculateFormulaCOGS(formulaVersionId: string, options?: {
  laborCostPerUnit?: number;
  overheadPercentage?: number;
  packagingId?: string;
  labelId?: string;
}): Promise<{
  success: boolean;
  cogs?: CostBreakdown;
  error?: string;
  breakdown?: MaterialCostBreakdown[];
}> {
  const result = await executeDbOperation(
    async () => {
      // Get formula version with ingredients
      const formulaVersion = await clientDb.query.formulaVersions.findFirst({
        where: eq(formulaVersions.id, formulaVersionId),
        with: {
          ingredients: {
            with: {
              material: true
            }
          }
        }
      });

      if (!formulaVersion) {
        throw new Error('Formula version not found');
      }

      if (!formulaVersion.ingredients || formulaVersion.ingredients.length === 0) {
        throw new Error('Formula has no ingredients');
      }

      // Validate percentages sum to 100%
      const totalPercentage = formulaVersion.ingredients.reduce(
        (sum, ing) => sum.plus(new Decimal(ing.percentage)),
        new Decimal(0)
      );

      if (!totalPercentage.equals(new Decimal(100))) {
        throw new Error(`Ingredient percentages must sum to 100%. Current total: ${totalPercentage.toString()}%`);
      }

      // Calculate material costs
      let materialCost = new Decimal(0);
      const breakdowns: MaterialCostBreakdown[] = [];

      for (const ingredient of formulaVersion.ingredients) {
        const material = ingredient.material;
        if (!material) continue;

        // Use current material cost or fall back to stored cost
        const materialCostAtTime = new Decimal(material.costPerUnit);
        const weightPerUnit = new Decimal(ingredient.weight);
        const costPerUnit = materialCostAtTime.mul(weightPerUnit).div(1000); // Convert per kg to per gram if needed

        materialCost = materialCost.add(costPerUnit);

        breakdowns.push({
          id: '', // Will be set when saving
          cogsCalculationId: '', // Will be set when saving
          materialId: ingredient.materialId,
          materialCostAtTime: materialCostAtTime.toString(),
          percentage: new Decimal(ingredient.percentage).toString(),
          weightPerUnit: weightPerUnit.toString(),
          costPerUnit: costPerUnit.toString(),
          createdAt: new Date()
        });
      }

      // Calculate packaging costs
      let packagingCost = new Decimal(0);
      if (options?.packagingId) {
        const packagingItem = await clientDb.query.packaging.findFirst({
          where: eq(packaging.id, options.packagingId)
        });

        if (packagingItem) {
          packagingCost = new Decimal(packagingItem.costPerUnit);
        }
      }

      // Calculate label costs
      let labelCost = new Decimal(0);
      if (options?.labelId) {
        const labelItem = await clientDb.query.labels.findFirst({
          where: eq(labels.id, options.labelId)
        });

        if (labelItem) {
          labelCost = new Decimal(labelItem.costPerUnit);
        }
      }

      // Add labor and overhead costs
      const laborCost = new Decimal(options?.laborCostPerUnit || 0);
      const overheadPercentage = new Decimal(options?.overheadPercentage || 0);
      const overheadCost = materialCost.add(packagingCost).add(labelCost).add(laborCost).mul(overheadPercentage).div(100);

      // Calculate total costs
      const totalCost = materialCost.add(packagingCost).add(labelCost).add(laborCost).add(overheadCost);
      const unitWeight = new Decimal(formulaVersion.totalWeight);
      const costPerGram = totalCost.div(unitWeight);

      const cogs: CostBreakdown = {
        materialCost,
        packagingCost,
        labelCost,
        laborCost,
        overheadCost,
        totalCost,
        unitWeight,
        costPerGram
      };

      return { cogs, breakdowns };
    },
    'Failed to calculate COGS'
  );

  if (result.success && result.data) {
    return {
      success: true,
      cogs: result.data.cogs,
      breakdown: result.data.breakdowns
    };
  }

  return {
    success: false,
    error: result.error || 'Unknown error occurred'
  };
}

export async function saveCOGSCalculation(
  formulaVersionId: string,
  cogs: CostBreakdown,
  breakdowns: Omit<MaterialCostBreakdown, 'id' | 'cogsCalculationId' | 'createdAt'>[]
): Promise<CogsCalculation | null> {
  const result = await executeDbOperation(
    async () => {
      return await clientDb.transaction(async (tx) => {
        // Create main COGS calculation record
        const [cogsCalculation] = await tx.insert(cogsCalculations).values({
          formulaVersionId,
          materialCost: cogs.materialCost.toString(),
          packagingCost: cogs.packagingCost.toString(),
          labelCost: cogs.labelCost.toString(),
          laborCost: cogs.laborCost.toString(),
          overheadCost: cogs.overheadCost.toString(),
          totalCost: cogs.totalCost.toString(),
          unitWeight: cogs.unitWeight.toString(),
          costPerGram: cogs.costPerGram.toString(),
          calculationDate: new Date(),
          isActive: true,
          createdAt: new Date()
        }).returning();

        // Create material cost breakdown records
        if (breakdowns.length > 0) {
          await tx.insert(materialCostBreakdown).values(
            breakdowns.map(breakdown => ({
              ...breakdown,
              cogsCalculationId: cogsCalculation.id,
              materialCostAtTime: breakdown.materialCostAtTime.toString(),
              percentage: breakdown.percentage.toString(),
              weightPerUnit: breakdown.weightPerUnit.toString(),
              costPerUnit: breakdown.costPerUnit.toString(),
              createdAt: new Date()
            }))
          );
        }

        return cogsCalculation;
      });
    },
    'Failed to save COGS calculation'
  );

  return result.success ? result.data : null;
}

export async function getCOGSCalculations(formulaVersionId?: string): Promise<CogsCalculation[]> {
  const result = await executeDbOperation(
    async () => {
      let whereConditions = eq(cogsCalculations.isActive, true);

      if (formulaVersionId) {
        whereConditions = and(whereConditions, eq(cogsCalculations.formulaVersionId, formulaVersionId));
      }

      return await clientDb.query.cogsCalculations.findMany({
        where: whereConditions,
        orderBy: [desc(cogsCalculations.calculationDate)],
        with: {
          formulaVersion: {
            with: {
              formula: true
            }
          }
        }
      });
    },
    'Failed to fetch COGS calculations'
  );

  return result.success ? result.data || [] : [];
}

export async function getCOGSCalculationWithBreakdown(calculationId: string): Promise<{
  calculation: CogsCalculation | null;
  breakdown: (MaterialCostBreakdown & { material: typeof inventoryMaterials.$inferSelect })[];
}> {
  const result = await executeDbOperation(
    async () => {
      const calculation = await clientDb.query.cogsCalculations.findFirst({
        where: eq(cogsCalculations.id, calculationId),
        with: {
          formulaVersion: {
            with: {
              formula: true
            }
          }
        }
      });

      if (!calculation) {
        return { calculation: null, breakdown: [] };
      }

      const breakdown = await clientDb.query.materialCostBreakdown.findMany({
        where: eq(materialCostBreakdown.cogsCalculationId, calculationId),
        with: {
          material: true
        }
      });

      return { calculation, breakdown };
    },
    'Failed to fetch COGS calculation with breakdown'
  );

  return result.success ? result.data || { calculation: null, breakdown: [] } : { calculation: null, breakdown: [] };
}

// Pricing Rules
export async function getPricingRules(): Promise<PricingRule[]> {
  const result = await executeDbOperation(
    () => clientDb.query.pricingRules.findMany({
      where: eq(pricingRules.isActive, true),
      orderBy: [asc(pricingRules.name)]
    }),
    'Failed to fetch pricing rules'
  );

  return result.success ? result.data || [] : [];
}

export async function createPricingRule(data: Omit<typeof pricingRules.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>): Promise<PricingRule | null> {
  const result = await executeDbOperation(
    async () => {
      const [rule] = await clientDb.insert(pricingRules).values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return rule;
    },
    'Failed to create pricing rule'
  );

  return result.success ? result.data : null;
}

export interface PricingCalculation {
  baseCost: Decimal;
  sellingPrice: Decimal;
  margin: Decimal;
  marginPercentage: Decimal;
}

export async function calculatePricing(
  baseCost: number | string,
  pricingRule: PricingRule
): Promise<PricingCalculation> {
  const baseCostDecimal = new Decimal(baseCost);
  let sellingPrice = baseCostDecimal;

  switch (pricingRule.markupType) {
    case 'percentage':
      sellingPrice = baseCostDecimal.mul(new Decimal(pricingRule.markupValue).div(100).plus(1));
      break;
    case 'fixed':
      sellingPrice = baseCostDecimal.add(new Decimal(pricingRule.markupValue));
      break;
    case 'target_margin':
      sellingPrice = baseCostDecimal.div(new Decimal(1).minus(new Decimal(pricingRule.targetMargin || 0).div(100)));
      break;
  }

  // Apply min/max constraints
  if (pricingRule.minPrice) {
    sellingPrice = Decimal.max(sellingPrice, new Decimal(pricingRule.minPrice));
  }
  if (pricingRule.maxPrice) {
    sellingPrice = Decimal.min(sellingPrice, new Decimal(pricingRule.maxPrice));
  }

  const margin = sellingPrice.minus(baseCostDecimal);
  const marginPercentage = baseCostDecimal.equals(0) ? new Decimal(0) : margin.div(baseCostDecimal).mul(100);

  return {
    baseCost: baseCostDecimal,
    sellingPrice,
    margin,
    marginPercentage
  };
}

export async function saveFormulaPricing(
  formulaId: string,
  pricingRuleId: string,
  calculation: PricingCalculation
): Promise<FormulaPricing | null> {
  const result = await executeDbOperation(
    async () => {
      const [pricing] = await clientDb.insert(formulaPricing).values({
        formulaId,
        pricingRuleId,
        baseCost: calculation.baseCost.toString(),
        sellingPrice: calculation.sellingPrice.toString(),
        margin: calculation.margin.toString(),
        isActive: true,
        effectiveDate: new Date(),
        createdAt: new Date()
      }).returning();
      return pricing;
    },
    'Failed to save formula pricing'
  );

  return result.success ? result.data : null;
}

export async function getFormulaPricing(formulaId: string): Promise<FormulaPricing[]> {
  const result = await executeDbOperation(
    () => clientDb.query.formulaPricing.findMany({
      where: eq(formulaPricing.formulaId, formulaId),
      with: {
        pricingRule: true
      },
      orderBy: [desc(formulaPricing.effectiveDate)]
    }),
    'Failed to fetch formula pricing'
  );

  return result.success ? result.data || [] : [];
}