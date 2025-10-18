"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePAWStore } from "@/lib/store/paws-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Beaker,
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export default function DashboardPage() {
  const {
    materials,
    formulas,
    productionBatches,
    cogsCalculations,
    loading,
    fetchMaterials,
    fetchFormulas,
    fetchProductionBatches,
    fetchCOGSCalculations,
    pagination
  } = usePAWStore();

  useEffect(() => {
    // Fetch initial data
    fetchMaterials(1, { limit: 10 });
    fetchFormulas(1, { limit: 10 });
    fetchProductionBatches(1, { limit: 10 });
    fetchCOGSCalculations();
  }, [fetchMaterials, fetchFormulas, fetchProductionBatches, fetchCOGSCalculations]);

  // Calculate dashboard metrics
  const totalMaterials = pagination.materials.total;
  const activeFormulas = formulas.filter(f => f.status === 'active').length;
  const totalFormulas = formulas.length;
  const recentBatches = productionBatches.filter(b =>
    new Date(b.productionDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  const totalBatches = productionBatches.length;

  // Get low stock items (materials below reorder point)
  const lowStockItems = materials.filter(m => {
    const currentStock = parseFloat(m.currentStock);
    const reorderPoint = parseFloat(m.reorderPoint);
    return currentStock <= reorderPoint && currentStock > 0;
  });

  // Get out of stock items
  const outOfStockItems = materials.filter(m => {
    const currentStock = parseFloat(m.currentStock);
    return currentStock <= 0;
  });

  // Get recent production batches
  const recentProductionBatches = productionBatches.slice(0, 5);

  // Get active formulas
  const activeFormulasList = formulas.filter(f => f.status === 'active').slice(0, 5);

  if (loading.materials && loading.formulas && loading.productionBatches) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your production management system</p>
              </div>
            </div>
          </div>

          {/* Loading Skeletons */}
          <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Overview of your production management system</p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/dashboard/inventory/materials">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/formulas">
                  <Beaker className="h-4 w-4 mr-2" />
                  Create Formula
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMaterials.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {lowStockItems.length} need reordering
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Formulas</CardTitle>
              <Beaker className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeFormulas}</div>
              <p className="text-xs text-muted-foreground">
                {totalFormulas - activeFormulas} drafts/archived
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Production Batches</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentBatches}</div>
              <p className="text-xs text-muted-foreground">
                {totalBatches} total batches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">COGS Calculations</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cogsCalculations.length}</div>
              <p className="text-xs text-muted-foreground">
                Cost analyses completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alert Cards */}
        {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
          <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2">
            {outOfStockItems.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Out of Stock Items
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    {outOfStockItems.length} materials are out of stock
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {outOfStockItems.slice(0, 3).map((material) => (
                      <div key={material.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{material.name}</p>
                          <p className="text-xs text-muted-foreground">{material.code}</p>
                        </div>
                        <Badge variant="destructive">Out of Stock</Badge>
                      </div>
                    ))}
                    {outOfStockItems.length > 3 && (
                      <p className="text-xs text-red-600">
                        +{outOfStockItems.length - 3} more items
                      </p>
                    )}
                    <Button asChild size="sm" className="mt-2">
                      <Link href="/dashboard/inventory/materials">Manage Inventory</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {lowStockItems.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-yellow-800 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Low Stock Alert
                  </CardTitle>
                  <CardDescription className="text-yellow-600">
                    {lowStockItems.length} materials need reordering
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lowStockItems.slice(0, 3).map((material) => (
                      <div key={material.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{material.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {parseFloat(material.currentStock)} / {parseFloat(material.reorderPoint)} units
                          </p>
                        </div>
                        <Badge variant="secondary">Low Stock</Badge>
                      </div>
                    ))}
                    {lowStockItems.length > 3 && (
                      <p className="text-xs text-yellow-600">
                        +{lowStockItems.length - 3} more items
                      </p>
                    )}
                    <Button asChild size="sm" className="mt-2" variant="outline">
                      <Link href="/dashboard/inventory/materials">Review Stock Levels</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Recent Production and Active Formulas */}
        <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Production Batches
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/production">View All</Link>
                </Button>
              </CardTitle>
              <CardDescription>
                Latest production activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentProductionBatches.length > 0 ? (
                <div className="space-y-4">
                  {recentProductionBatches.map((batch) => (
                    <div key={batch.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{batch.batchNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {batch.formulaVersion?.formula?.name || 'Unknown Formula'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(batch.productionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          batch.status === 'completed' ? 'default' :
                          batch.status === 'in_progress' ? 'secondary' :
                          batch.status === 'failed' ? 'destructive' : 'outline'
                        }
                      >
                        {batch.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Beaker className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No production batches yet</p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link href="/dashboard/production">Create First Batch</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Active Formulas
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/formulas">View All</Link>
                </Button>
              </CardTitle>
              <CardDescription>
                Your current product formulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeFormulasList.length > 0 ? (
                <div className="space-y-4">
                  {activeFormulasList.map((formula) => (
                    <div key={formula.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{formula.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Version {formula.version} • {formula.totalWeight} {formula.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Updated {new Date(formula.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Beaker className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active formulas</p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link href="/dashboard/formulas">Create Formula</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}