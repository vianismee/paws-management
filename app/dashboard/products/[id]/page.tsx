"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  IconArrowLeft,
  IconEdit,
  IconPackage,
  IconTestPipe,
  IconCurrencyDollar,
  IconBox,
  IconCalculator,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconEye,
  IconActivity,
  IconScale,
  IconDroplet,
  IconTag,
} from "@tabler/icons-react"
import { useSession } from "@/lib/auth-client"
import { formatIDR, formatNumber } from "@/lib/currency"

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

interface Formula {
  id: string
  productId: string
  name: string
  description?: string
  totalWeight: number
  unit: string
  status: 'Draft' | 'Trials' | 'Pre-Production' | 'Approved'
  notes?: string
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  versions?: FormulaVersion[]
  latestVersion?: FormulaVersion
}

interface FormulaVersion {
  id: string
  formulaId: string
  version: number
  totalWeight: number
  unit: string
  notes?: string
  status: string
  createdAt: string
  ingredients?: FormulaIngredient[]
}

interface FormulaIngredient {
  id: string
  formulaVersionId: string
  materialId: string
  percentage: number
  material: {
    id: string
    name: string
    code: string
    supplier?: string
    unitPrice?: string
  }
}

export default function ProductDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [loading, setLoading] = useState(true)
  const [formulasLoading, setFormulasLoading] = useState(true)

  useEffect(() => {
    fetchProduct()
    fetchFormulas()
  }, [productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch product')
      }
      const result = await response.json()
      setProduct(result.data)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
      router.push('/dashboard/products')
    } finally {
      setLoading(false)
    }
  }

  const fetchFormulas = async () => {
    try {
      // Fetch formulas for this product
      const response = await fetch(`/api/formulas?productId=${productId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch formulas')
      }
      const result = await response.json()
      setFormulas(result.data || [])
    } catch (error) {
      console.error('Error fetching formulas:', error)
      // Don't show error toast here as formulas might not exist
    } finally {
      setFormulasLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Draft': { color: 'bg-gray-100 text-gray-800', icon: IconClock },
      'Trials': { color: 'bg-blue-100 text-blue-800', icon: IconActivity },
      'Pre-Production': { color: 'bg-orange-100 text-orange-800', icon: IconDroplet },
      'Approved': { color: 'bg-green-100 text-green-800', icon: IconCheck },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Draft']
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getUnitIcon = (unit: string) => {
    switch (unit) {
      case 'ml':
      case 'L':
        return <IconDroplet className="w-4 h-4" />
      case 'g':
      case 'kg':
        return <IconScale className="w-4 h-4" />
      default:
        return <IconPackage className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-destructive">Product not found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            The product you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/dashboard/products">
            <Button className="mt-4">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products">
            <Button variant="ghost" size="sm">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground">
              SKU: <span className="font-mono">{product.sku}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/products/${productId}/edit`}>
            <Button>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-4">
        {product.isActive ? (
          <Badge className="bg-green-100 text-green-800">
            <IconCheck className="w-3 h-3 mr-1" />
            Active
          </Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )}
        {product.category && (
          <Badge variant="outline">{product.category}</Badge>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="formulas">
            Formulas ({formulas.length})
          </TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconPackage className="h-5 w-5" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Volume</p>
                    <p className="text-lg font-semibold">
                      {product.volume ? `${formatNumber(product.volume)} ${product.unit}` : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unit</p>
                    <p className="text-lg font-semibold">{product.unit}</p>
                  </div>
                </div>
                {product.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                    <p className="text-sm">{product.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Created</p>
                    <p>{new Date(product.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Updated</p>
                    <p>{new Date(product.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconActivity className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formulas.length}
                    </div>
                    <p className="text-sm text-blue-600">Total Formulas</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formulas.filter(f => f.status === 'Approved').length}
                    </div>
                    <p className="text-sm text-green-600">Approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Formulas</CardTitle>
              <CardDescription>
                Latest formulations created for this product
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formulas.length === 0 ? (
                <div className="text-center py-8">
                  <IconTestPipe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No formulas yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first formula to get started
                  </p>
                  <Link href={`/dashboard/formulas/new?productId=${productId}`}>
                    <Button className="mt-4">
                      <IconTestPipe className="mr-2 h-4 w-4" />
                      Create Formula
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {formulas.slice(0, 3).map((formula) => (
                    <div key={formula.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getUnitIcon(formula.unit)}
                        <div>
                          <p className="font-medium">{formula.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(formula.totalWeight)} {formula.unit} • {formula.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(formula.status)}
                        <Link href={`/dashboard/formulas/${formula.id}`}>
                          <Button variant="ghost" size="sm">
                            <IconEye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {formulas.length > 3 && (
                    <Link href={`/dashboard/formulas?productId=${productId}`}>
                      <Button variant="outline" className="w-full">
                        View all {formulas.length} formulas
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Formulas Tab */}
        <TabsContent value="formulas" className="space-y-6">
          {formulasLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {formulas.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <IconTestPipe className="h-16 w-16 mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Formulas Yet</h3>
                    <p className="text-muted-foreground text-center mb-6">
                      Create formulas to define the composition and manufacturing process for this product.
                    </p>
                    <Link href={`/dashboard/formulas/new?productId=${productId}`}>
                      <Button>
                        <IconTestPipe className="mr-2 h-4 w-4" />
                        Create First Formula
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {formulas.map((formula) => (
                    <Card key={formula.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getUnitIcon(formula.unit)}
                            <div>
                              <CardTitle className="text-lg">{formula.name}</CardTitle>
                              <CardDescription>
                                {formula.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(formula.status)}
                            <Link href={`/dashboard/formulas/${formula.id}`}>
                              <Button variant="ghost" size="sm">
                                <IconEye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-muted-foreground">Total Weight</p>
                            <p className="font-semibold">
                              {formatNumber(formula.totalWeight)} {formula.unit}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Status</p>
                            <p>{formula.status}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Created</p>
                            <p>{new Date(formula.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Last Updated</p>
                            <p>{new Date(formula.updatedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Current Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCurrencyDollar className="h-5 w-5" />
                  Current Pricing
                </CardTitle>
                <CardDescription>
                  Current pricing information in Indonesian Rupiah (IDR)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.unitPrice ? (
                  <>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">Unit Price</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatIDR(product.unitPrice)}
                      </span>
                    </div>
                    {product.retailPrice && (
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Retail Price</span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatIDR(product.retailPrice)}
                        </span>
                      </div>
                    )}
                    {product.wholesalePrice && (
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="font-medium">Wholesale Price</span>
                        <span className="text-xl font-bold text-purple-600">
                          {formatIDR(product.wholesalePrice)}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <IconTag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No pricing set</p>
                    <p className="text-sm text-muted-foreground">
                      Prices will be calculated based on production costs
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCalculator className="h-5 w-5" />
                  Pricing Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {product.priceNotes ? (
                  <p className="text-sm">{product.priceNotes}</p>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No pricing notes available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cost Calculation Info */}
          <Alert>
            <IconAlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Cost Calculation Method:</strong> Final price is calculated as:
              Production Cost + Label Cost + Packaging Cost + Sales Margin
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
}