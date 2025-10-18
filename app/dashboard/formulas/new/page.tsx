"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconFlask,
  IconSave,
  IconPackage,
  IconScale,
  IconAlertTriangle
} from "@tabler/icons-react"
import { useSession } from "@/lib/auth-client"
import { QSCalculator } from "@/components/qs-calculator"
import {
  FormulaIngredient,
  validateFormulaIngredients,
  autoAssignQS,
  calculateIngredientWeights
} from "@/lib/qs-calculations"

interface NewFormula {
  name: string
  description?: string
  productId?: string
  totalWeight: string
  unit: string
  notes?: string
  ingredients: FormulaIngredient[]
}

export default function NewFormulaPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [products, setProducts] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const [materials, setMaterials] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const [loading, setLoading] = useState(false)
  const [searchMaterialTerm, setSearchMaterialTerm] = useState("")
  const [errors, setErrors] = useState<string[]>([])

  const [formula, setFormula] = useState<NewFormula>({
    name: "",
    description: "",
    totalWeight: "100",
    unit: "g",
    notes: "",
    ingredients: []
  })

  useEffect(() => {
    fetchProducts()
    fetchMaterials()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/inventory/categories') // For now, using existing API
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      // This is a temporary solution - would need proper products API
      setProducts(data.data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      // Fallback empty array
      setProducts([])
    }
  }

  const fetchMaterials = async () => {
    try {
      const url = searchMaterialTerm
        ? `/api/inventory/materials?search=${encodeURIComponent(searchMaterialTerm)}`
        : '/api/inventory/materials'

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch materials')
      const data = await response.json()
      setMaterials(data.data || [])
    } catch (error) {
      console.error("Error fetching materials:", error)
      setMaterials([])
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchMaterialTerm) {
        fetchMaterials()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchMaterialTerm])

  const addIngredient = (materialId: string, materialName: string) => {
    const newIngredient: FormulaIngredient = {
      materialId,
      materialName,
      percentage: 0,
      weight: 0,
      qs: 0,
      isQsIngredient: false
    }

    setFormula(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }))
  }

  const updateIngredient = (index: number, updates: Partial<FormulaIngredient>) => {
    setFormula(prev => {
      const newIngredients = [...prev.ingredients]
      newIngredients[index] = { ...newIngredients[index], ...updates }

      // Recalculate weights if total weight or percentages changed
      const totalWeight = parseFloat(prev.totalWeight)
      return {
        ...prev,
        ingredients: calculateIngredientWeights(newIngredients, totalWeight)
      }
    })
  }

  const removeIngredient = (index: number) => {
    setFormula(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }))
  }

  const handleAutoAssignQS = () => {
    const updatedIngredients = autoAssignQS(formula.ingredients)
    const totalWeight = parseFloat(formula.totalWeight)

    setFormula(prev => ({
      ...prev,
      ingredients: calculateIngredientWeights(updatedIngredients, totalWeight)
    }))

    toast.success("QS ingredient has been automatically assigned")
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!formula.name.trim()) {
      newErrors.push("Formula name is required")
    }

    if (!formula.productId) {
      newErrors.push("Please select a product")
    }

    if (!formula.totalWeight || parseFloat(formula.totalWeight) <= 0) {
      newErrors.push("Total weight must be greater than 0")
    }

    if (formula.ingredients.length === 0) {
      newErrors.push("Formula must have at least one ingredient")
    }

    const validation = validateFormulaIngredients(formula.ingredients)
    if (!validation.isValid) {
      newErrors.push(...validation.errors)
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!session?.user?.id) {
      toast.error("You must be logged in to create a formula")
      return
    }

    setLoading(true)

    try {
      const formulaData = {
        productId: formula.productId!,
        name: formula.name,
        description: formula.description,
        totalWeight: parseFloat(formula.totalWeight),
        unit: formula.unit,
        notes: formula.notes,
        createdBy: session.user.id,
        ingredients: formula.ingredients
      }

      const response = await fetch('/api/formulas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formulaData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create formula')
      }

      const result = await response.json()
      toast.success("Formula created successfully!")
      router.push("/dashboard/formulas/manage")
    } catch (error) {
      console.error("Error creating formula:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create formula")
    } finally {
      setLoading(false)
    }
  }

  const totalWeight = parseFloat(formula.totalWeight) || 100

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
            <h2 className="text-3xl font-bold tracking-tight">Create New Formula</h2>
            <p className="text-muted-foreground">Build a new product formula with QS calculations</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Main Form */}
          <div className="md:col-span-2 space-y-4">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconFlask className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Formula Name *</Label>
                  <Input
                    id="name"
                    value={formula.name}
                    onChange={(e) => setFormula(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Moisturizing Cream Formula"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="product">Product *</Label>
                  <Select
                    value={formula.productId}
                    onValueChange={(value) => setFormula(prev => ({ ...prev, productId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formula.description}
                    onChange={(e) => setFormula(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the formula purpose and characteristics"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalWeight">Total Weight *</Label>
                    <Input
                      id="totalWeight"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formula.totalWeight}
                      onChange={(e) => {
                        const newWeight = e.target.value
                        setFormula(prev => ({
                          ...prev,
                          totalWeight: newWeight,
                          ingredients: calculateIngredientWeights(prev.ingredients, parseFloat(newWeight) || 100)
                        }))
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={formula.unit}
                      onValueChange={(value) => setFormula(prev => ({ ...prev, unit: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">Grams (g)</SelectItem>
                        <SelectItem value="ml">Milliliters (ml)</SelectItem>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="L">Liters (L)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formula.notes}
                    onChange={(e) => setFormula(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes about the formula"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconScale className="h-5 w-5" />
                  Ingredients
                </CardTitle>
                <CardDescription>
                  Add materials to create your formula. Use QS for ingredients that make up the remaining percentage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Ingredient */}
                <div className="space-y-2">
                  <Label>Add Material</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search materials..."
                      value={searchMaterialTerm}
                      onChange={(e) => setSearchMaterialTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                  {searchMaterialTerm && materials.length > 0 && (
                    <div className="border rounded-md max-h-32 overflow-y-auto">
                      {materials.map((material) => (
                        <button
                          key={material.id}
                          type="button"
                          onClick={() => {
                            addIngredient(material.id, material.name)
                            setSearchMaterialTerm("")
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-b-0"
                        >
                          <div className="font-medium">{material.name}</div>
                          {material.description && (
                            <div className="text-xs text-muted-foreground">{material.description}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Ingredients List */}
                <div className="space-y-3">
                  {formula.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{ingredient.materialName}</div>
                        {ingredient.isQsIngredient && (
                          <Badge variant="outline" className="text-xs mt-1">QS Ingredient</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={ingredient.percentage}
                          onChange={(e) => updateIngredient(index, {
                            percentage: parseFloat(e.target.value) || 0
                          })}
                          className="w-20 h-8"
                          placeholder="%"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>

                      <div className="text-sm text-muted-foreground w-16 text-right">
                        {ingredient.weight.toFixed(1)}g
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIngredient(index)}
                        className="h-8 w-8 p-0"
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {formula.ingredients.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <IconScale className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No ingredients added yet</p>
                      <p className="text-sm">Search and add materials above to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* QS Calculator */}
            <QSCalculator
              ingredients={formula.ingredients}
              totalWeight={totalWeight}
              onAutoAssignQS={handleAutoAssignQS}
              showDetails={true}
            />

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    "Creating..."
                  ) : (
                    <>
                      <IconSave className="mr-2 h-4 w-4" />
                      Create Formula
                    </>
                  )}
                </Button>

                <Link href="/dashboard/formulas/manage">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Errors */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <IconAlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  )
}