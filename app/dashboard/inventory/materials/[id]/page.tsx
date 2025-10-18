"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, Package, AlertTriangle, TrendingUp, TrendingDown, Info } from "lucide-react";


export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [material, setMaterial] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch material details
  const fetchMaterial = async () => {
    try {
      setLoading(true);

      const { data: materialData, error: materialError } = await supabase
        .from('materials')
        .select(`
          *,
          category:categories (*)
        `)
        .eq('id', id)
        .single();

      if (materialError) {
        if (materialError.code === 'PGRST116') {
          setError("Material not found");
        } else {
          throw new Error(`Failed to fetch material: ${materialError.message}`);
        }
        return;
      }

      setMaterial(materialData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setMaterial(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMaterial();
    }
  }, [id]);

  // Helper functions
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatus = () => {
    if (!material) return null;

    const currentStock = parseFloat(material?.current_stock || '0');
    const minStock = parseFloat(material?.min_stock_level || '0');
    const reorderPoint = parseFloat(material?.reorder_point || '0');

    if (currentStock <= reorderPoint) {
      return { status: 'Critical', color: 'destructive', icon: AlertTriangle };
    } else if (currentStock <= minStock) {
      return { status: 'Low', color: 'secondary', icon: TrendingDown };
    } else {
      return { status: 'Good', color: 'default', icon: TrendingUp };
    }
  };

  const getStockPercentage = () => {
    if (!material) return 0;
    const currentStock = parseFloat(material?.current_stock || '0');
    const minStock = parseFloat(material?.min_stock_level || '0');
    return minStock > 0 ? (currentStock / minStock) * 100 : 100;
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/inventory/materials">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Materials
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Material Not Found</h2>
            <p className="text-muted-foreground text-center mb-6">
              {error || "The material you're looking for doesn't exist or has been removed."}
            </p>
            <Button asChild>
              <Link href="/dashboard/inventory/materials">
                View All Materials
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stockStatus = getStockStatus();
  const stockPercentage = getStockPercentage();
  const StatusIcon = stockStatus?.icon;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/inventory/materials">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Materials
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{material?.name || 'Unknown Material'}</h1>
            <p className="text-muted-foreground">
              {material?.code || 'N/A'} • {material?.category?.name || 'Uncategorized'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={stockStatus?.color as any} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {stockStatus?.status} Stock
          </Badge>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/inventory/materials/${material?.id || ''}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Material Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Material Information
            </CardTitle>
            <CardDescription>
              Basic information about this material
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Material Code</label>
                <p className="font-semibold">{material?.code || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p className="font-semibold">{material?.category?.name || 'Uncategorized'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Unit</label>
                <p className="font-semibold">{material?.unit || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="font-semibold">
                  <Badge variant={material?.is_active ? "default" : "secondary"}>
                    {material?.is_active ? "Active" : "Inactive"}
                  </Badge>
                </p>
              </div>
            </div>

            {material?.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1">{material.description}</p>
              </div>
            )}

            {material?.notes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <p className="mt-1">{material.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Stock Information
            </CardTitle>
            <CardDescription>
              Current stock levels and thresholds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
                <p className="text-2xl font-bold">{material?.current_stock || '0'} {material?.unit || ''}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Stock Level</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        stockPercentage <= 25 ? 'bg-red-500' :
                        stockPercentage <= 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{stockPercentage.toFixed(0)}%</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Minimum Stock</label>
                <p className="font-semibold">{material?.min_stock_level || '0'} {material?.unit || ''}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reorder Point</label>
                <p className="font-semibold">{material?.reorder_point || '0'} {material?.unit || ''}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-muted-foreground">Stock Status</label>
                <Badge variant={stockStatus?.color as any} className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {stockStatus?.status}
                </Badge>
              </div>
              {stockPercentage <= 50 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Stock Alert</p>
                      <p className="text-yellow-700">
                        Current stock is below recommended levels. Consider reordering soon.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Supplier Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Supplier Information
            </CardTitle>
            <CardDescription>
              Supplier details and pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Supplier</label>
                <p className="font-semibold">{material?.supplier || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Supplier Code</label>
                <p className="font-semibold">{material?.supplier_code || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cost per Unit</label>
                <p className="font-semibold">{formatCurrency(material?.cost_per_unit || '0')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Value</label>
                <p className="font-semibold">
                  {formatCurrency(parseFloat(material?.cost_per_unit || '0') * parseFloat(material?.current_stock || '0'))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>
              Record timestamps and system data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Material ID</label>
                <p className="font-mono text-sm">{material?.id || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="font-semibold">{material?.createdAt ? formatDate(material.createdAt) : 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="font-semibold">{material?.updatedAt ? formatDate(material.updatedAt) : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}