"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  IconArrowLeft,
  IconCheck,
  IconPackage,
  IconCurrencyDollar,
  IconAlertTriangle,
  IconRefresh,
  IconDownload,
  IconEye,
  IconTrash,
} from "@tabler/icons-react"
import { useSession } from "@/lib/auth-client"

interface Product {
  id: string
  name: string
  description?: string
  sku: string
  category?: string
  unit: string
  volume?: string
  unitPrice?: string
  retailPrice?: string
  wholesalePrice?: string
  priceNotes?: string
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface EditProduct {
  name: string
  description: string
  sku: string
  category: string
  unit: string
  volume: string
  priceNotes: string
  unitPrice: string
  retailPrice: string
  wholesalePrice: string
  isActive: boolean
}

export default function EditProductPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<EditProduct>({
    name: "",
    description: "",
    sku: "",
    category: "",
    unit: "ml",
    volume: "",
    priceNotes: "",
    unitPrice: "",
    retailPrice: "",
    wholesalePrice: "",
    isActive: true,
  })

  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  const commonUnits = [
    { value: "pcs", label: "Pieces" },
    { value: "ml", label: "Milliliters" },
    { value: "g", label: "Grams" },
    { value: "oz", label: "Ounces" },
    { value: "kg", label: "Kilograms" },
    { value: "L", label: "Liters" },
    { value: "set", label: "Sets" },
  ]

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

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      setFetchLoading(true)
      const response = await fetch(`/api/products/${productId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch product')
      }
      const result = await response.json()
      const productData = result.data as Product

      setProduct({
        name: productData.name,
        description: productData.description || "",
        sku: productData.sku,
        category: productData.category || "",
        unit: productData.unit,
        volume: productData.volume || "",
        priceNotes: productData.priceNotes || "",
        unitPrice: productData.unitPrice || "",
        retailPrice: productData.retailPrice || "",
        wholesalePrice: productData.wholesalePrice || "",
        isActive: productData.isActive,
      })
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
      router.push('/dashboard/products')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleInputChange = (field: keyof EditProduct, value: string | boolean) => {
    setProduct(prev => ({
      ...prev,
      [field]: value,
    }))
    setHasChanges(true)
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

    // If it's a new product (has volume field), validate volume
    if (product.volume && parseFloat(product.volume) <= 0) {
      newErrors.push("Volume must be greater than 0")
    }

    // Validate prices if provided
    if (product.unitPrice && parseFloat(product.unitPrice) < 0) {
      newErrors.push("Unit price cannot be negative")
    }
    if (product.retailPrice && parseFloat(product.retailPrice) < 0) {
      newErrors.push("Retail price cannot be negative")
    }
    if (product.wholesalePrice && parseFloat(product.wholesalePrice) < 0) {
      newErrors.push("Wholesale price cannot be negative")
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
      toast.error("You must be logged in to update a product")
      return
    }

    setLoading(true)

    try {
      const updateData: any = {
        name: product.name,
        description: product.description || undefined,
        sku: product.sku,
        category: product.category === "none" ? undefined : product.category || undefined,
        unit: product.unit,
        isActive: product.isActive,
      }

      // Only include volume if it exists (for new products)
      if (product.volume) {
        updateData.volume = parseFloat(product.volume)
      }

      // Only include priceNotes if it exists
      if (product.priceNotes) {
        updateData.priceNotes = product.priceNotes
      }

      // Only include prices if they exist (for legacy products)
      if (product.unitPrice) {
        updateData.unitPrice = parseFloat(product.unitPrice)
      }
      if (product.retailPrice) {
        updateData.retailPrice = parseFloat(product.retailPrice)
      }
      if (product.wholesalePrice) {
        updateData.wholesalePrice = parseFloat(product.wholesalePrice)
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update product')
      }

      const result = await response.json()
      toast.success("Product updated successfully!")
      setHasChanges(false)

      // Redirect to product detail page
      router.push(`/dashboard/products/${productId}`)
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error(error instanceof Error ? error.message : "Failed to update product")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      toast.success("Product deleted successfully")
      router.push('/dashboard/products')
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error("Failed to delete product")
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard/products">
              <Button variant="ghost" size="sm">
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Button>
            </Link>
            <Link href={`/dashboard/products/${productId}`}>
              <Button variant="ghost" size="sm">
                <IconEye className="mr-2 h-4 w-4" />
                View Product
              </Button>
            </Link>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Product</h2>
          <p className="text-muted-foreground">
            Update product information and pricing details.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

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
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={product.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Enter SKU"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={product.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

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
                <Label htmlFor="volume">Volume per Product</Label>
                <Input
                  id="volume"
                  type="number"
                  step="0.1"
                  min="0"
                  value={product.volume}
                  onChange={(e) => handleInputChange('volume', e.target.value)}
                  placeholder="Enter volume"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty if this is a legacy product with pricing only
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCurrencyDollar className="h-5 w-5" />
              Pricing Information (IDR)
            </CardTitle>
            <CardDescription>
              Update pricing details. Leave empty if prices are to be calculated later.
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

            <div>
              <Label htmlFor="unitPrice">Unit Price (IDR)</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={product.unitPrice}
                onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="retailPrice">Retail Price (IDR)</Label>
              <Input
                id="retailPrice"
                type="number"
                step="0.01"
                min="0"
                value={product.retailPrice}
                onChange={(e) => handleInputChange('retailPrice', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="wholesalePrice">Wholesale Price (IDR)</Label>
              <Input
                id="wholesalePrice"
                type="number"
                step="0.01"
                min="0"
                value={product.wholesalePrice}
                onChange={(e) => handleInputChange('wholesalePrice', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <Alert>
              <IconAlertTriangle className="h-4 w-4" />
              <AlertDescription>
                For new products, prices will be calculated based on: production cost + label + packaging + sales margin
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={product.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Product is active and available
              </Label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Inactive products won't appear in searches and catalogs
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || !hasChanges}
          >
            {loading ? (
              <>
                <IconRefresh className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <IconDownload className="mr-2 h-4 w-4" />
                Update Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}