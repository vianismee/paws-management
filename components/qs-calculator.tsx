"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { IconCheck, IconAlertTriangle, IconInfoCircle, IconMath } from "@tabler/icons-react"
import {
  FormulaIngredient,
  QSCalculation,
  calculateQS,
  validateFormulaIngredients,
  formatPercentage,
  formatWeight
} from "@/lib/qs-calculations"

interface QSCalculatorProps {
  ingredients: FormulaIngredient[]
  totalWeight: number
  onAutoAssignQS?: (ingredients: FormulaIngredient[]) => void
  showDetails?: boolean
}

export function QSCalculator({
  ingredients,
  totalWeight,
  onAutoAssignQS,
  showDetails = true
}: QSCalculatorProps) {
  const [calculation, setCalculation] = useState<QSCalculation | null>(null)
  const [validation, setValidation] = useState<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  } | null>(null)

  useEffect(() => {
    const calc = calculateQS(ingredients)
    const val = validateFormulaIngredients(ingredients)
    setCalculation(calc)
    setValidation(val)
  }, [ingredients])

  if (!calculation || !validation) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progressPercentage = Math.min(calculation.totalPercentage, 100)
  const remainingPercentage = calculation.remainingPercentage

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base">
            <IconMath className="mr-2 h-4 w-4" />
            QS (Quality Standard) Calculator
          </CardTitle>
          <CardDescription>
            Formula percentage calculations and QS ingredient management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Formula Status</span>
            <Badge variant={validation.isValid ? "default" : "destructive"} className="gap-1">
              {validation.isValid ? (
                <>
                  <IconCheck className="h-3 w-3" />
                  Valid
                </>
              ) : (
                <>
                  <IconAlertTriangle className="h-3 w-3" />
                  Invalid
                </>
              )}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Percentage</span>
              <span className="font-medium">{formatPercentage(calculation.totalPercentage)}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>{remainingPercentage > 0 ? `QS: ${formatPercentage(remainingPercentage)}` : "Complete"}</span>
              <span>100%</span>
            </div>
          </div>

          {/* Quick Actions */}
          {remainingPercentage > 0 && ingredients.length > 0 && onAutoAssignQS && (
            <div className="flex justify-center">
              <button
                onClick={() => onAutoAssignQS(ingredients)}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <IconMath className="h-3 w-3" />
                Auto-assign QS ingredient
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Errors */}
      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validation.errors.map((error, index) => (
                <div key={index} className="text-sm">{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <Alert>
          <IconInfoCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validation.warnings.map((warning, index) => (
                <div key={index} className="text-sm">{warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Breakdown */}
      {showDetails && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Ingredient Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Non-QS Ingredients */}
              {calculation.nonQsIngredients.map((ingredient, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="font-medium">{ingredient.materialName || `Ingredient ${index + 1}`}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{formatPercentage(ingredient.percentage)}</span>
                    <span>{formatWeight((ingredient.percentage / 100) * totalWeight)}</span>
                  </div>
                </div>
              ))}

              {/* QS Ingredient */}
              {calculation.qsIngredient && (
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">
                        {calculation.qsIngredient.materialName || `Ingredient`} (QS)
                      </span>
                      <Badge variant="outline" className="text-xs">QS</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>{formatPercentage(calculation.qsIngredient.percentage)}</span>
                      <span>{formatWeight((calculation.qsIngredient.percentage / 100) * totalWeight)}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    QS = 100% - sum of all other ingredients ({formatPercentage(calculation.totalPercentage)})
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>Total Formula</span>
                  <div className="flex items-center gap-4">
                    <span>{formatPercentage(100)}</span>
                    <span>{formatWeight(totalWeight)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}