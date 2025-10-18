"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, Box, AlertTriangle, TrendingUp, TrendingDown, Info, Package } from "lucide-react";


export default function PackagingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [packaging, setPackaging] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch packaging details
  const fetchPackaging = async () => {
    try {
      setLoading(true);

      const { data: packagingData, error: packagingError } = await supabase
        .from('packaging')
        .select('*')
        .eq('id', id)
        .single();

      if (packagingError) {
        if (packagingError.code === 'PGRST116') {
          setError("Packaging not found");
        } else {
          throw new Error(`Failed to fetch packaging: ${packagingError.message}`);
        }
        return;
      }

      setPackaging(packagingData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setPackaging(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPackaging();
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
    if (!packaging) return null;

    const currentStock = packaging.current_stock || 0;
    const minOrder = packaging.min_order_quantity || 0;

    if (currentStock <= minOrder * 0.25) {
      return { status: 'Critical', color: 'destructive', icon: AlertTriangle };
    } else if (currentStock <= minOrder) {
      return { status: 'Low', color: 'secondary', icon: TrendingDown };
    } else {
      return { status: 'Good', color: 'default', icon: TrendingUp };
    }
  };

  const getStockPercentage = () => {
    if (!packaging) return 0;
    const minOrder = packaging.min_order_quantity || 0;
    const currentStock = packaging.current_stock || 0;
    return minOrder > 0 ? (currentStock / minOrder) * 100 : 100;
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

  if (error || !packaging) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/inventory/packaging">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Packaging
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Box className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Packaging Not Found</h2>
            <p className="text-muted-foreground text-center mb-6">
              {error || "The packaging you're looking for doesn't exist or has been removed."}
            </p>
            <Button asChild>
              <Link href="/dashboard/inventory/packaging">
                View All Packaging
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
            <Link href="/dashboard/inventory/packaging">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Packaging
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{packaging.name}</h1>
            <p className="text-muted-foreground">
              {packaging.type} • {packaging.size} Packaging
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={stockStatus?.color as any} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {stockStatus?.status} Stock
          </Badge>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/inventory/packaging/${packaging.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Packaging Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Packaging Information
            </CardTitle>
            <CardDescription>
              Basic information about this packaging
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Packaging Name</label>
                <p className="font-semibold">{packaging.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p className="font-semibold">{packaging.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Size</label>
                <p className="font-semibold">{packaging.size}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Capacity</label>
                <p className="font-semibold">{packaging.capacity}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Material</label>
                <p className="font-semibold">{packaging.material}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: packaging.color }}
                  />
                  <p className="font-semibold">{packaging.color}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="font-semibold">
                  <Badge variant={packaging.is_active ? "default" : "secondary"}>
                    {packaging.is_active ? "Active" : "Inactive"}
                  </Badge>
                </p>
              </div>
            </div>

            {packaging.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1">{packaging.description}</p>
              </div>
            )}

            {packaging.notes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <p className="mt-1">{packaging.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
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
                <p className="text-2xl font-bold">{(packaging.current_stock || 0).toLocaleString()} units</p>
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
                <label className="text-sm font-medium text-muted-foreground">Min Order Quantity</label>
                <p className="font-semibold">{(packaging.min_order_quantity || 0).toLocaleString()} units</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reorder At</label>
                <p className="font-semibold">{Math.ceil((packaging.min_order_quantity || 0) * 0.5).toLocaleString()} units</p>
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
                <p className="font-semibold">{packaging.supplier || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Supplier Code</label>
                <p className="font-semibold">{packaging.supplier_code || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cost per Unit</label>
                <p className="font-semibold">{formatCurrency(packaging.cost_per_unit)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Value</label>
                <p className="font-semibold">
                  {formatCurrency(parseFloat(packaging.cost_per_unit || '0') * (packaging.current_stock || 0))}
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
                <label className="text-sm font-medium text-muted-foreground">Packaging ID</label>
                <p className="font-mono text-sm">{packaging.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="font-semibold">{formatDate(packaging.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="font-semibold">{formatDate(packaging.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}