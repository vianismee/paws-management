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
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  IconArrowLeft,
  IconCheck,
  IconPackage,
  IconCurrencyDollar,
  IconAlertTriangle,
  IconRefresh,
} from "@tabler/icons-react"
import { useSession } from "@/lib/auth-client"

interface NewProduct {
  name: string
  description: string
  sku: string
  category: string
  unit: string
  volume: string
  priceNotes: string
}

export default function NewProductPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [product, setProduct] = useState<NewProduct>({
    name: "",
    description: "",
    sku: "",
    category: "",
    unit: "ml",
    volume: "",
    priceNotes: "Price will be determined based on: production cost + label + packaging + sales margin",
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleInputChange = (field: keyof NewProduct, value: string) => {
    setProduct(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!product.name.trim()) {
      newErrors.push("Product name is required")
    }

    if (!product.sku.trim()) {
      newErrors.push("SKU is required")
    }

    if (!product.unit.trim()) {
      newErrors.push("Unit is required")
    }

    if (!product.volume.trim()) {
      newErrors.push("Volume is required")
    }

    if (parseFloat(product.volume) <= 0) {
      newErrors.push("Volume must be greater than 0")
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
      toast.error("You must be logged in to create a product")
      return
    }

    setLoading(true)

    try {
      const productData = {
        name: product.name,
        description: product.description,
        sku: product.sku,
        category: product.category === "none" ? undefined : product.category || undefined,
        unit: product.unit,
        volume: parseFloat(product.volume),
        priceNotes: product.priceNotes,
        createdBy: session.user.id,
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      const result = await response.json()
      toast.success("Product created successfully!")
      router.push("/dashboard/products")
    } catch (error) {
      console.error("Error creating product:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create product")
    } finally {
      setLoading(false)
    }
  }

  const commonCategories = [
    "Skincare",
    "Cosmetics",
    "Hair Care",
    "Body Care",
    "Fragrance",
    "Makeup",
    "Personal Care",
    "Household",
    "Other"
  ]

  const commonUnits = [
    { value: "pcs", label: "Pieces" },
    { value: "ml", label: "Milliliters" },
    { value: "g", label: "Grams" },
    { value: "oz", label: "Ounces" },
    { value: "kg", label: "Kilograms" },
    { value: "L", label: "Liters" },
    { value: "set", label: "Sets" },
  ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products">
            <Button variant="outline" size="sm">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Create New Product</h2>
            <p className="text-muted-foreground">
              Add a new product to your catalog with pricing information.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconPackage className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Premium Moisturizing Cream"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={product.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="e.g., PMC-001"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={product.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the product features and benefits"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconPackage className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="unit">Unit *</Label>
                <Select
                  value={product.unit}
                  onValueChange={(value) => handleInputChange('unit', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonUnits.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="volume">Volume per Product *</Label>
                <Input
                  id="volume"
                  type="number"
                  step="0.1"
                  min="0"
                  value={product.volume}
                  onChange={(e) => handleInputChange('volume', e.target.value)}
                  placeholder="Enter volume"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCurrencyDollar className="h-5 w-5" />
                Pricing Information (IDR)
              </CardTitle>
              <CardDescription>
                Prices will be determined later based on production costs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="priceNotes">Pricing Notes</Label>
                <Textarea
                  id="priceNotes"
                  value={product.priceNotes}
                  onChange={(e) => handleInputChange('priceNotes', e.target.value)}
                  placeholder="Enter pricing notes..."
                  rows={3}
                />
              </div>

              <Alert>
                <IconAlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Price will be calculated based on: production cost + label + packaging + sales margin
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Category */}
        <Card>
          <CardHeader>
            <CardTitle>Category</CardTitle>
            <CardDescription>
              Organize your products into categories for better management.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category">Product Category</Label>
              <Select
                value={product.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {commonCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

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

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between">
            <Link href="/dashboard/products">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <IconRefresh className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <IconCheck className="mr-2 h-4 w-4" />
                  Create Product
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}