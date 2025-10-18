"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconFlask,
  IconPackage,
  IconScale,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconTrendingUp,
  IconUser
} from "@tabler/icons-react"
import { useSession } from "@/lib/auth-client"
import { QSCalculator } from "@/components/qs-calculator"
import { FormulaIngredient, formatPercentage, formatWeight } from "@/lib/qs-calculations"

interface FormulaDetail {
  id: string
  name: string
  description?: string
  version: number
  status: 'Draft' | 'Trials' | 'Pre-Production' | 'Approved'
  totalWeight: string
  unit: string
  notes?: string
  trialResults?: string
  approvedDate?: string
  approvedBy?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  productName?: string
  productDescription?: string
  ingredients: FormulaIngredient[]
}

export default function FormulaDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const formulaId = params.id as string

  const [formula, setFormula] = useState<FormulaDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (formulaId) {
      fetchFormula()
    }
  }, [formulaId])

  const fetchFormula = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/formulas/${formulaId}`)
      if (!response.ok) {
        throw new Error("Formula not found")
      }

      const data = await response.json()

      const ingredients: FormulaIngredient[] = data.ingredients ? data.ingredients.map((ing: any) => ({
        id: ing.id,
        materialId: ing.materialId,
        materialName: ing.materialName || 'Unknown Material',
        percentage: parseFloat(ing.percentage?.toString() || '0'),
        weight: parseFloat(ing.weight?.toString() || '0'),
        qs: parseFloat(ing.qs?.toString() || '0'),
        isQsIngredient: ing.isQsIngredient || false,
        notes: ing.notes,
      })) : []

      setFormula({
        ...data,
        ingredients,
      } as FormulaDetail)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch formula")
      console.error("Error fetching formula:", err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft':
        return <IconClock className="h-4 w-4" />
      case 'Trials':
        return <IconAlertTriangle className="h-4 w-4" />
      case 'Pre-Production':
        return <IconTrendingUp className="h-4 w-4" />
      case 'Approved':
        return <IconCheck className="h-4 w-4" />
      default:
        return <IconClock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      case 'Trials':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      case 'Pre-Production':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'Approved':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !formula) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || "Formula not found"}
          </AlertDescription>
        </Alert>
        <Link href="/dashboard/formulas/manage">
          <Button variant="outline">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Formulas
          </Button>
        </Link>
      </div>
    )
  }

  const totalWeight = parseFloat(formula.totalWeight.toString())

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/formulas/manage">
            <Button variant="outline" size="sm">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{formula.name}</h2>
            <p className="text-muted-foreground">
              Version {formula.version} • {formula.productName || 'No Product'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(formula.status)}>
            {getStatusIcon(formula.status)}
            <span className="ml-1">{formula.status}</span>
          </Badge>
          <Button variant="outline">
            <IconEdit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline">
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Formula Information */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFlask className="h-5 w-5" />
                Formula Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formula.description && (
                <div>
                  <h4 className="font-medium text-sm">Description</h4>
                  <p className="text-sm text-muted-foreground">{formula.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm">Total Weight</h4>
                  <p className="text-sm">{formatWeight(totalWeight)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Unit</h4>
                  <p className="text-sm">{formula.unit}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Created</h4>
                  <p className="text-sm">{new Date(formula.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Last Updated</h4>
                  <p className="text-sm">{new Date(formula.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {formula.notes && (
                <div>
                  <h4 className="font-medium text-sm">Notes</h4>
                  <p className="text-sm text-muted-foreground">{formula.notes}</p>
                </div>
              )}

              {formula.trialResults && (
                <div>
                  <h4 className="font-medium text-sm">Trial Results</h4>
                  <p className="text-sm text-muted-foreground">{formula.trialResults}</p>
                </div>
              )}

              {formula.approvedDate && (
                <div>
                  <h4 className="font-medium text-sm">Approved</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(formula.approvedDate).toLocaleDateString()}
                    {formula.approvedBy && ` by ${formula.approvedBy}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Information */}
          {formula.productName && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconPackage className="h-5 w-5" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <h4 className="font-medium text-sm">Product Name</h4>
                    <p className="text-sm">{formula.productName}</p>
                  </div>
                  {formula.productDescription && (
                    <div>
                      <h4 className="font-medium text-sm">Product Description</h4>
                      <p className="text-sm text-muted-foreground">{formula.productDescription}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* QS Calculator */}
        <div>
          <QSCalculator
            ingredients={formula.ingredients}
            totalWeight={totalWeight}
            showDetails={true}
          />
        </div>
      </div>

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconScale className="h-5 w-5" />
            Formula Ingredients
          </CardTitle>
          <CardDescription>
            Complete ingredient breakdown with percentages and weights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formula.ingredients.map((ingredient, index) => (
              <div key={ingredient.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    ingredient.isQsIngredient ? 'bg-blue-500' : 'bg-primary'
                  }`}></div>
                  <div>
                    <p className="font-medium">{ingredient.materialName}</p>
                    {ingredient.isQsIngredient && (
                      <Badge variant="outline" className="text-xs mt-1">QS Ingredient</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPercentage(ingredient.percentage)}</p>
                  <p className="text-sm text-muted-foreground">{formatWeight(ingredient.weight)}</p>
                </div>
              </div>
            ))}

            {formula.ingredients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <IconFlask className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No ingredients added yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}