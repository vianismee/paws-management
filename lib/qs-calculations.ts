import { Decimal } from 'drizzle-orm'

export interface FormulaIngredient {
  id?: string
  materialId: string
  materialName?: string
  percentage: number
  weight: number
  qs: number
  isQsIngredient?: boolean
  notes?: string
}

export interface QSCalculation {
  totalPercentage: number
  remainingPercentage: number
  qsIngredient: FormulaIngredient | null
  nonQsIngredients: FormulaIngredient[]
  isValid: boolean
  errors: string[]
}

/**
 * Calculate QS values for formula ingredients
 * QS (Quality Standard) logic: One ingredient is marked as QS and its percentage
 * is calculated as (100 - sum of all other ingredient percentages)
 */
export function calculateQS(ingredients: FormulaIngredient[]): QSCalculation {
  const errors: string[] = []
  let totalPercentage = 0
  let qsIngredient: FormulaIngredient | null = null
  const nonQsIngredients: FormulaIngredient[] = []

  // Separate QS ingredient from regular ingredients
  ingredients.forEach((ingredient, index) => {
    if (ingredient.isQsIngredient) {
      if (qsIngredient) {
        errors.push('Only one ingredient can be marked as QS ingredient')
      }
      qsIngredient = { ...ingredient }
    } else {
      nonQsIngredients.push({ ...ingredient })
      totalPercentage += ingredient.percentage
    }
  })

  // Calculate remaining percentage for QS ingredient
  const remainingPercentage = 100 - totalPercentage

  // Validation checks
  if (totalPercentage > 100) {
    errors.push('Total percentage of non-QS ingredients cannot exceed 100%')
  }

  if (totalPercentage === 100 && qsIngredient) {
    errors.push('No remaining percentage for QS ingredient. Either reduce other ingredients or remove QS ingredient.')
  }

  if (remainingPercentage < 0) {
    errors.push('Total percentage exceeds 100%')
  }

  if (qsIngredient && remainingPercentage > 0) {
    qsIngredient.qs = remainingPercentage
    qsIngredient.percentage = remainingPercentage
  }

  const isValid = errors.length === 0 && totalPercentage <= 100

  return {
    totalPercentage,
    remainingPercentage,
    qsIngredient,
    nonQsIngredients,
    isValid,
    errors
  }
}

/**
 * Auto-assign QS ingredient based on remaining percentage
 * If there's remaining percentage after all specified ingredients,
 * automatically mark the last ingredient as QS
 */
export function autoAssignQS(ingredients: FormulaIngredient[]): FormulaIngredient[] {
  const totalPercentage = ingredients.reduce((sum, ing) => sum + ing.percentage, 0)
  const remainingPercentage = 100 - totalPercentage

  if (remainingPercentage > 0 && ingredients.length > 0) {
    // Find an ingredient that can be QS (preferably one with "water", "solvent", "base" etc. in name)
    let qsCandidate = ingredients.find(ing =>
      ing.materialName?.toLowerCase().includes('water') ||
      ing.materialName?.toLowerCase().includes('solvent') ||
      ing.materialName?.toLowerCase().includes('base') ||
      ing.materialName?.toLowerCase().includes('carrier')
    )

    // If no obvious candidate, use the last ingredient
    if (!qsCandidate) {
      qsCandidate = ingredients[ingredients.length - 1]
    }

    return ingredients.map(ing => {
      if (ing === qsCandidate) {
        return {
          ...ing,
          isQsIngredient: true,
          qs: remainingPercentage,
          percentage: ing.percentage + remainingPercentage
        }
      }
      return { ...ing, isQsIngredient: false, qs: 0 }
    })
  }

  // No QS needed if total is exactly 100%
  return ingredients.map(ing => ({ ...ing, isQsIngredient: false, qs: 0 }))
}

/**
 * Validate formula ingredients
 */
export function validateFormulaIngredients(ingredients: FormulaIngredient[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (ingredients.length === 0) {
    errors.push('Formula must have at least one ingredient')
    return { isValid: false, errors, warnings }
  }

  const calculation = calculateQS(ingredients)
  errors.push(...calculation.errors)

  // Additional validation
  if (calculation.totalPercentage < 95 && !calculation.qsIngredient) {
    warnings.push('Formula total is less than 95%. Consider adding a QS ingredient.')
  }

  if (calculation.totalPercentage > 99.9 && !calculation.qsIngredient) {
    warnings.push('Formula total is very close to 100%. Consider adjusting percentages or adding QS ingredient.')
  }

  const hasNegativePercentages = ingredients.some(ing => ing.percentage < 0)
  if (hasNegativePercentages) {
    errors.push('Ingredient percentages cannot be negative')
  }

  const hasZeroPercentages = ingredients.some(ing => ing.percentage === 0 && !ing.isQsIngredient)
  if (hasZeroPercentages) {
    warnings.push('Some ingredients have 0% percentage. Consider removing them or adjusting.')
  }

  return {
    isValid: calculation.isValid && errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Calculate ingredient weights based on total formula weight
 */
export function calculateIngredientWeights(
  ingredients: FormulaIngredient[],
  totalWeight: number
): FormulaIngredient[] {
  return ingredients.map(ingredient => ({
    ...ingredient,
    weight: (ingredient.percentage / 100) * totalWeight
  }))
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format weight for display
 */
export function formatWeight(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}g`
}