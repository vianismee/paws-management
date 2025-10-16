"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  IconDots,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconPackage,
  IconTag,
  IconCurrency,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconActivity,
  IconGridDots,
  IconBox,
} from "@tabler/icons-react";

// Types
interface Material {
  id: string;
  code: string;
  name: string;
  description?: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    codePrefix: string;
  };
  supplier?: string;
  supplierCode?: string;
  cost: string;
  unit: string;
  minStockLevel: string;
  currentStock: string;
  reorderPoint: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  codePrefix: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Dashboard Statistics Types
interface DashboardStats {
  materials: {
    total: number;
    active: number;
    lowStock: number;
    totalValue: number;
  };
  packaging: {
    total: number;
    active: number;
    lowStock: number;
    totalValue: number;
  };
  labels: {
    total: number;
    active: number;
    lowStock: number;
    totalValue: number;
  };
  overall: {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'material' | 'packaging' | 'label';
  action: 'created' | 'updated' | 'deleted';
  itemName: string;
  timestamp: string;
}

interface StockAlert {
  id: string;
  type: 'material' | 'packaging' | 'label';
  itemName: string;
  currentStock: number;
  minStock: number;
  percentage: number;
}

export default function InventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false);

  // Dashboard states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Form states
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    description: "",
    categoryId: "",
    supplier: "",
    supplierCode: "",
    cost: "",
    unit: "",
    minStockLevel: "",
    currentStock: "",
    reorderPoint: "",
    notes: "",
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    codePrefix: "",
  });

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/inventory/categories?limit=100");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);

      // Fetch all data in parallel for better performance
      const [materialsResponse, packagingResponse, labelsResponse] = await Promise.all([
        fetch("/api/inventory/materials?limit=1000"),
        fetch("/api/inventory/packaging?limit=1000"),
        fetch("/api/inventory/labels?limit=1000")
      ]);

      // Handle responses
      const materialsData = materialsResponse.ok ? await materialsResponse.json() : { data: [] };
      const packagingData = packagingResponse.ok ? await packagingResponse.json() : { data: [] };
      const labelsData = labelsResponse.ok ? await labelsResponse.json() : { data: [] };

      // Log errors if any requests failed
      if (!materialsResponse.ok) {
        console.error("Failed to fetch materials:", materialsResponse.statusText);
      }
      if (!packagingResponse.ok) {
        console.error("Failed to fetch packaging:", packagingResponse.statusText);
      }
      if (!labelsResponse.ok) {
        console.error("Failed to fetch labels:", labelsResponse.statusText);
      }

      // Calculate statistics
      const materials = materialsData.data || [];
      const packaging = packagingData.data || [];
      const labels = labelsData.data || [];

      const materialsStats = {
        total: materials.length,
        active: materials.filter((m: any) => m.isActive).length,
        lowStock: materials.filter((m: any) => parseFloat(m.currentStock) <= parseFloat(m.reorderPoint)).length,
        totalValue: materials.reduce((sum: number, m: any) => sum + (parseFloat(m.costPerUnit || m.cost) * parseFloat(m.currentStock)), 0),
      };

      const packagingStats = {
        total: packaging.length,
        active: packaging.filter((p: any) => p.isActive).length,
        lowStock: packaging.filter((p: any) => p.currentStock < p.minOrderQuantity).length,
        totalValue: packaging.reduce((sum: number, p: any) => sum + (parseFloat(p.costPerUnit || p.cost) * p.currentStock), 0),
      };

      const labelsStats = {
        total: labels.length,
        active: labels.filter((l: any) => l.isActive).length,
        lowStock: labels.filter((l: any) => l.currentStock < l.minOrderQuantity).length,
        totalValue: labels.reduce((sum: number, l: any) => sum + (parseFloat(l.costPerUnit || l.cost) * l.currentStock), 0),
      };

      const overall = {
        totalItems: materials.length + packaging.length + labels.length,
        totalValue: materialsStats.totalValue + packagingStats.totalValue + labelsStats.totalValue,
        lowStockItems: materialsStats.lowStock + packagingStats.lowStock + labelsStats.lowStock,
      };

      setDashboardStats({
        materials: materialsStats,
        packaging: packagingStats,
        labels: labelsStats,
        overall,
      });

      // Generate stock alerts
      const alerts: StockAlert[] = [
        ...materials
          .filter((m: any) => parseFloat(m.currentStock) <= parseFloat(m.reorderPoint))
          .map((m: any) => ({
            id: m.id,
            type: 'material' as const,
            itemName: m.name,
            currentStock: parseFloat(m.currentStock),
            minStock: parseFloat(m.reorderPoint),
            percentage: (parseFloat(m.currentStock) / parseFloat(m.reorderPoint)) * 100,
          })),
        ...packaging
          .filter((p: any) => p.currentStock < p.minOrderQuantity)
          .map((p: any) => ({
            id: p.id,
            type: 'packaging' as const,
            itemName: p.name,
            currentStock: p.currentStock,
            minStock: p.minOrderQuantity,
            percentage: (p.currentStock / p.minOrderQuantity) * 100,
          })),
        ...labels
          .filter((l: any) => l.currentStock < l.minOrderQuantity)
          .map((l: any) => ({
            id: l.id,
            type: 'label' as const,
            itemName: l.name,
            currentStock: l.currentStock,
            minStock: l.minOrderQuantity,
            percentage: (l.currentStock / l.minOrderQuantity) * 100,
          })),
      ].sort((a, b) => a.percentage - b.percentage).slice(0, 10);

      setStockAlerts(alerts);
      setStatsLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setStatsLoading(false);
    }
  };

  // Fetch materials
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory && selectedCategory !== "all") params.append("categoryId", selectedCategory);
      if (isActiveFilter !== undefined) params.append("isActive", isActiveFilter.toString());

      const response = await fetch(`/api/inventory/materials?${params}`);
      if (!response.ok) throw new Error("Failed to fetch materials");
      const data = await response.json();
      setMaterials(data.data);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setMaterials([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Create new material
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/inventory/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMaterial),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create material");
      }

      await fetchMaterials();
      setIsCreateDialogOpen(false);
      setNewMaterial({
        name: "",
        description: "",
        categoryId: "",
        supplier: "",
        supplierCode: "",
        cost: "",
        unit: "",
        minStockLevel: "",
        currentStock: "",
        reorderPoint: "",
        notes: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create material");
    }
  };

  // Create new category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/inventory/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCategory),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create category");
      }

      await fetchCategories();
      setIsCreateCategoryDialogOpen(false);
      setNewCategory({
        name: "",
        description: "",
        codePrefix: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    }
  };

  // Delete material
  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const response = await fetch(`/api/inventory/materials/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete material");
      }

      await fetchMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete material");
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [currentPage, searchTerm, selectedCategory, isActiveFilter]);

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatusColor = (percentage: number) => {
    if (percentage <= 25) return 'text-red-600';
    if (percentage <= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStockProgressColor = (percentage: number) => {
    if (percentage <= 25) return 'bg-red-500';
    if (percentage <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time overview of your materials, packaging, and labels inventory
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/inventory/materials">
              <IconPackage className="mr-2 h-4 w-4" />
              Materials
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/inventory/packaging">
              <IconBox className="mr-2 h-4 w-4" />
              Packaging
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/inventory/labels">
              <IconTag className="mr-2 h-4 w-4" />
              Labels
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <IconGridDots className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats?.overall.totalItems || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <IconCurrency className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardStats?.overall.totalValue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Current inventory value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{dashboardStats?.overall.lowStockItems || 0}</div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Items</CardTitle>
              <IconActivity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(dashboardStats?.materials.active || 0) +
                 (dashboardStats?.packaging.active || 0) +
                 (dashboardStats?.labels.active || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently in use
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPackage className="h-5 w-5" />
              Raw Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Items</span>
                  <span className="font-medium">{dashboardStats?.materials.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="font-medium text-green-600">{dashboardStats?.materials.active || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Low Stock</span>
                  <span className="font-medium text-red-600">{dashboardStats?.materials.lowStock || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Value</span>
                  <span className="font-medium">{formatCurrency(dashboardStats?.materials.totalValue || 0)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBox className="h-5 w-5" />
              Packaging
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Items</span>
                  <span className="font-medium">{dashboardStats?.packaging.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="font-medium text-green-600">{dashboardStats?.packaging.active || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Low Stock</span>
                  <span className="font-medium text-red-600">{dashboardStats?.packaging.lowStock || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Value</span>
                  <span className="font-medium">{formatCurrency(dashboardStats?.packaging.totalValue || 0)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTag className="h-5 w-5" />
              Labels
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Items</span>
                  <span className="font-medium">{dashboardStats?.labels.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="font-medium text-green-600">{dashboardStats?.labels.active || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Low Stock</span>
                  <span className="font-medium text-red-600">{dashboardStats?.labels.lowStock || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Value</span>
                  <span className="font-medium">{formatCurrency(dashboardStats?.labels.totalValue || 0)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconAlertTriangle className="h-5 w-5" />
            Stock Alerts
            {stockAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stockAlerts.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Items that need immediate attention due to low stock levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-2 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : stockAlerts.length === 0 ? (
            <div className="text-center py-8">
              <IconPackage className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Stock Alerts</h3>
              <p className="text-muted-foreground">
                All inventory items are at healthy stock levels
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {stockAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between space-x-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{alert.itemName}</p>
                      <Badge variant="outline" className="text-xs">
                        {alert.type}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-muted-foreground">
                        Current: {alert.currentStock} / Min: {alert.minStock}
                      </span>
                      <div className="w-24">
                        <div className="relative">
                          <Progress
                            value={Math.min(alert.percentage, 100)}
                            className="h-2"
                          />
                          <div
                            className={`absolute top-0 left-0 h-2 ${getStockProgressColor(alert.percentage)} transition-all duration-300`}
                            style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${getStockStatusColor(alert.percentage)}`}>
                        {alert.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/inventory/${alert.type}s`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}