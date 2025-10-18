"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase, subscribeToTable, unsubscribeFromChannel } from "@/lib/supabase";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  IconDots,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconPackage,
  IconTag,
  IconCalculator,
  IconEye,
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
  purchaseUnit: string;
  purchaseQuantity: string;
  costPerUnit: string;
  unit: string;
  currency: string;
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

// Currency formatter for IDR
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false);
  const [isEditMaterialDialogOpen, setIsEditMaterialDialogOpen] = useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    description: "",
    categoryId: "",
    supplier: "",
    supplierCode: "",
    cost: "",
    purchaseUnit: "",
    purchaseQuantity: "",
    unit: "",
    currency: "IDR",
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

  // Calculate cost per unit helper
  const calculateCostPerUnit = (cost: number, purchaseQuantity: number, purchaseUnit: string, unit: string) => {
    // Simple calculation - for now assume purchase unit contains the base unit
    // This can be enhanced with unit conversion logic
    return cost / purchaseQuantity;
  };

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
      // Only show active materials by default
      if (isActiveFilter !== undefined) {
        params.append("isActive", isActiveFilter.toString());
      } else {
        params.append("isActive", "true");
      }

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
      // Filter out empty strings from the request body
      const requestBody = {
        name: newMaterial.name,
        description: newMaterial.description || undefined,
        categoryId: newMaterial.categoryId,
        supplier: newMaterial.supplier || undefined,
        supplierCode: newMaterial.supplierCode || undefined,
        cost: newMaterial.cost,
        purchaseUnit: newMaterial.purchaseUnit,
        purchaseQuantity: newMaterial.purchaseQuantity,
        unit: newMaterial.unit,
        minStockLevel: newMaterial.minStockLevel || "0",
        currentStock: newMaterial.currentStock || "0",
        reorderPoint: newMaterial.reorderPoint || "0",
        notes: newMaterial.notes || undefined,
      };

      const response = await fetch("/api/inventory/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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
        purchaseUnit: "",
        purchaseQuantity: "",
        unit: "",
        currency: "IDR",
        minStockLevel: "",
        currentStock: "",
        reorderPoint: "",
        notes: "",
      });
      toast.success("Material created successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create material";
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  // Create new category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out empty strings from the request body
      const requestBody = {
        name: newCategory.name,
        description: newCategory.description || undefined,
        codePrefix: newCategory.codePrefix,
      };

      const response = await fetch("/api/inventory/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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
      toast.success("Category created successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create category";
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  // Edit material
  const handleEditMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    try {
      // Filter out empty strings from the request body
      const requestBody = {
        name: editingMaterial.name,
        description: editingMaterial.description || undefined,
        categoryId: editingMaterial.categoryId,
        supplier: editingMaterial.supplier || undefined,
        supplierCode: editingMaterial.supplierCode || undefined,
        cost: editingMaterial.cost,
        purchaseUnit: editingMaterial.purchaseUnit,
        purchaseQuantity: editingMaterial.purchaseQuantity,
        unit: editingMaterial.unit,
        minStockLevel: editingMaterial.minStockLevel || "0",
        currentStock: editingMaterial.currentStock || "0",
        reorderPoint: editingMaterial.reorderPoint || "0",
        notes: editingMaterial.notes || undefined,
      };

      const response = await fetch(`/api/inventory/materials/${editingMaterial.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update material");
      }

      // Clear any existing errors
      setError(null);

      // Refetch materials and categories
      await fetchMaterials();
      await fetchCategories();

      // Close dialog and reset state
      setIsEditMaterialDialogOpen(false);
      setEditingMaterial(null);
      toast.success("Material updated successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update material";
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  // Edit category
  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      // Filter out empty strings from the request body
      const requestBody = {
        name: editingCategory.name,
        description: editingCategory.description || undefined,
        codePrefix: editingCategory.codePrefix,
        isActive: editingCategory.isActive,
      };

      const response = await fetch(`/api/inventory/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update category");
      }

      await fetchCategories();
      setIsEditCategoryDialogOpen(false);
      setEditingCategory(null);
      toast.success("Category updated successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update category";
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  // Delete category
  const handleDeleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/inventory/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category");
      }

      await fetchCategories();
      toast.success("Category deleted successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete category";
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  // Delete material
  const handleDeleteMaterial = async (id: string) => {
    try {
      const response = await fetch(`/api/inventory/materials/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete material");
      }

      // Clear any existing errors
      setError(null);

      // Refetch materials to update the list
      await fetchMaterials();
      toast.success("Material deleted successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete material";
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchMaterials();

    // Set up realtime subscriptions
    const materialsChannel = subscribeToTable('materials', '*', (payload) => {
      console.log('Materials change received:', payload);
      fetchMaterials(); // Refetch materials on any change
    });

    const categoriesChannel = subscribeToTable('categories', '*', (payload) => {
      console.log('Categories change received:', payload);
      fetchCategories(); // Refetch categories on any change
      fetchMaterials(); // Also refetch materials since they depend on categories
    });

    // Cleanup function
    return () => {
      unsubscribeFromChannel(materialsChannel);
      unsubscribeFromChannel(categoriesChannel);
    };
  }, [currentPage, searchTerm, selectedCategory, isActiveFilter]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Raw Materials</h2>
          <p className="text-muted-foreground">
            Manage your raw materials, ingredients, and stock levels with automatic price calculation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isCreateCategoryDialogOpen} onOpenChange={setIsCreateCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <IconTag className="mr-2 h-4 w-4" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>
                  Create a new category to organize your raw materials.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCategory}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category-name">Name</Label>
                    <Input
                      id="category-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="e.g., Essential Oils"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category-description">Description</Label>
                    <Textarea
                      id="category-description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category-codePrefix">Code Prefix</Label>
                    <Input
                      id="category-codePrefix"
                      value={newCategory.codePrefix}
                      onChange={(e) => setNewCategory({ ...newCategory, codePrefix: e.target.value.toUpperCase() })}
                      placeholder="e.g., OIL"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Create Category</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <IconPlus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Add New Raw Material</DialogTitle>
                <DialogDescription>
                  Add a new raw material to your inventory. Price per unit will be calculated automatically.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMaterial} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material-name">Material Name *</Label>
                    <Input
                      id="material-name"
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                      placeholder="e.g., Lavender Essential Oil"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material-category">Category *</Label>
                    <Select
                      value={newMaterial.categoryId}
                      onValueChange={(value) => setNewMaterial({ ...newMaterial, categoryId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name} ({category.codePrefix})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material-description">Description</Label>
                  <Textarea
                    id="material-description"
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material-purchase-cost">Purchase Cost (IDR) *</Label>
                    <Input
                      id="material-purchase-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newMaterial.cost}
                      onChange={(e) => setNewMaterial({ ...newMaterial, cost: e.target.value })}
                      placeholder="20000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material-purchase-unit">Purchase Unit *</Label>
                    <Input
                      id="material-purchase-unit"
                      value={newMaterial.purchaseUnit}
                      onChange={(e) => setNewMaterial({ ...newMaterial, purchaseUnit: e.target.value })}
                      placeholder="e.g., 100g, 1kg, 500ml"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material-purchase-quantity">Purchase Quantity *</Label>
                    <Input
                      id="material-purchase-quantity"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newMaterial.purchaseQuantity}
                      onChange={(e) => setNewMaterial({ ...newMaterial, purchaseQuantity: e.target.value })}
                      placeholder="100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material-unit">Base Unit *</Label>
                    <Input
                      id="material-unit"
                      value={newMaterial.unit}
                      onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                      placeholder="e.g., g, ml, pcs"
                      required
                    />
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <IconCalculator className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Auto Calculation</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cost per base unit will be calculated automatically: Purchase Cost ÷ Purchase Quantity
                  </p>
                  {newMaterial.cost && newMaterial.purchaseQuantity && (
                    <p className="text-sm font-medium text-primary mt-2">
                      {formatIDR(parseFloat(newMaterial.cost) / parseFloat(newMaterial.purchaseQuantity))} per {newMaterial.unit || 'unit'}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material-supplier">Supplier</Label>
                    <Input
                      id="material-supplier"
                      value={newMaterial.supplier}
                      onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
                      placeholder="Supplier name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material-supplier-code">Supplier Code</Label>
                    <Input
                      id="material-supplier-code"
                      value={newMaterial.supplierCode}
                      onChange={(e) => setNewMaterial({ ...newMaterial, supplierCode: e.target.value })}
                      placeholder="Supplier's product code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material-current-stock">Current Stock</Label>
                    <Input
                      id="material-current-stock"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newMaterial.currentStock}
                      onChange={(e) => setNewMaterial({ ...newMaterial, currentStock: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material-min-stock">Min Stock Level</Label>
                    <Input
                      id="material-min-stock"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newMaterial.minStockLevel}
                      onChange={(e) => setNewMaterial({ ...newMaterial, minStockLevel: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="material-reorder-point">Reorder Point</Label>
                    <Input
                      id="material-reorder-point"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newMaterial.reorderPoint}
                      onChange={(e) => setNewMaterial({ ...newMaterial, reorderPoint: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material-notes">Notes</Label>
                  <Textarea
                    id="material-notes"
                    value={newMaterial.notes}
                    onChange={(e) => setNewMaterial({ ...newMaterial, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Add Material</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Category Dialog */}
          <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>
                  Update category information.
                </DialogDescription>
              </DialogHeader>
              {editingCategory && (
                <form onSubmit={handleEditCategory}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-category-name">Name</Label>
                      <Input
                        id="edit-category-name"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        placeholder="e.g., Essential Oils"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-category-description">Description</Label>
                      <Textarea
                        id="edit-category-description"
                        value={editingCategory.description || ""}
                        onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-category-codePrefix">Code Prefix</Label>
                      <Input
                        id="edit-category-codePrefix"
                        value={editingCategory.codePrefix}
                        onChange={(e) => setEditingCategory({ ...editingCategory, codePrefix: e.target.value.toUpperCase() })}
                        placeholder="e.g., OIL"
                        maxLength={10}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-category-active"
                        checked={editingCategory.isActive}
                        onChange={(e) => setEditingCategory({ ...editingCategory, isActive: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="edit-category-active">Active</Label>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">Update Category</Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Material Dialog */}
          <Dialog open={isEditMaterialDialogOpen} onOpenChange={setIsEditMaterialDialogOpen}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Edit Raw Material</DialogTitle>
                <DialogDescription>
                  Update material information. Price per unit will be recalculated automatically.
                </DialogDescription>
              </DialogHeader>
              {editingMaterial && (
                <form onSubmit={handleEditMaterial} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-material-name">Material Name *</Label>
                      <Input
                        id="edit-material-name"
                        value={editingMaterial.name}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                        placeholder="e.g., Lavender Essential Oil"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-material-category">Category *</Label>
                      <Select
                        value={editingMaterial.categoryId}
                        onValueChange={(value) => setEditingMaterial({ ...editingMaterial, categoryId: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name} ({category.codePrefix})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-material-description">Description</Label>
                    <Textarea
                      id="edit-material-description"
                      value={editingMaterial.description || ""}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-material-purchase-cost">Purchase Cost (IDR) *</Label>
                      <Input
                        id="edit-material-purchase-cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingMaterial.cost}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, cost: e.target.value })}
                        placeholder="20000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-material-purchase-unit">Purchase Unit *</Label>
                      <Input
                        id="edit-material-purchase-unit"
                        value={editingMaterial.purchaseUnit}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, purchaseUnit: e.target.value })}
                        placeholder="e.g., 100g, 1kg, 500ml"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-material-purchase-quantity">Purchase Quantity *</Label>
                      <Input
                        id="edit-material-purchase-quantity"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={editingMaterial.purchaseQuantity}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, purchaseQuantity: e.target.value })}
                        placeholder="100"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-material-unit">Base Unit *</Label>
                      <Input
                        id="edit-material-unit"
                        value={editingMaterial.unit}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, unit: e.target.value })}
                        placeholder="e.g., g, ml, pcs"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <IconCalculator className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Auto Calculation</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cost per base unit will be calculated automatically: Purchase Cost ÷ Purchase Quantity
                    </p>
                    {editingMaterial.cost && editingMaterial.purchaseQuantity && (
                      <p className="text-sm font-medium text-primary mt-2">
                        {formatIDR(parseFloat(editingMaterial.cost) / parseFloat(editingMaterial.purchaseQuantity))} per {editingMaterial.unit || 'unit'}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-material-supplier">Supplier</Label>
                      <Input
                        id="edit-material-supplier"
                        value={editingMaterial.supplier || ""}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, supplier: e.target.value })}
                        placeholder="Supplier name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-material-supplier-code">Supplier Code</Label>
                      <Input
                        id="edit-material-supplier-code"
                        value={editingMaterial.supplierCode || ""}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, supplierCode: e.target.value })}
                        placeholder="Supplier's product code"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-material-current-stock">Current Stock</Label>
                      <Input
                        id="edit-material-current-stock"
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingMaterial.currentStock}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, currentStock: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-material-min-stock">Min Stock Level</Label>
                      <Input
                        id="edit-material-min-stock"
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingMaterial.minStockLevel}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, minStockLevel: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-material-reorder-point">Reorder Point</Label>
                      <Input
                        id="edit-material-reorder-point"
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingMaterial.reorderPoint}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, reorderPoint: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-material-notes">Notes</Label>
                    <Textarea
                      id="edit-material-notes"
                      value={editingMaterial.notes || ""}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, notes: e.target.value })}
                      placeholder="Additional notes"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Update Material</Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Select value={isActiveFilter?.toString() || "all"} onValueChange={(value) => setIsActiveFilter(value === "all" ? undefined : value === "true")}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Management Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Category Management</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-2 border rounded-lg bg-background">
                  <div className="flex items-center space-x-2">
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.codePrefix}
                    </Badge>
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(category);
                        setIsEditCategoryDialogOpen(true);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <IconEdit className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <IconTrash className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Category</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete the category "{category.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCategory(category.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Materials</CardTitle>
          <CardDescription>
            {pagination ? `Showing ${materials.length} of ${pagination.total} materials` : "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchMaterials}>Retry</Button>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-10">
              <IconPackage className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No materials found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== "all" || isActiveFilter !== undefined
                  ? "Try adjusting your filters"
                  : "Get started by adding your first raw material"}
              </p>
              {!searchTerm && selectedCategory === "all" && isActiveFilter === undefined && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Material
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Purchase Info</TableHead>
                    <TableHead>Cost/Unit</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{material.name}</div>
                          {material.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {material.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{material.category.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatIDR(parseFloat(material.cost))}</div>
                          <div className="text-muted-foreground">{material.purchaseUnit}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          {formatIDR(parseFloat(material.costPerUnit))}
                        </div>
                        <div className="text-sm text-muted-foreground">per {material.unit}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{parseFloat(material.currentStock).toFixed(2)} {material.unit}</span>
                          {parseFloat(material.currentStock) <= parseFloat(material.reorderPoint) && (
                            <Badge variant="destructive" className="text-xs">
                              Low Stock
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={material.isActive ? "default" : "secondary"}>
                          {material.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <IconDots className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingMaterial(material);
                                setIsEditMaterialDialogOpen(true);
                              }}
                            >
                              <IconEdit className="mr-2 h-4 w-4" />
                              Edit Material
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              asChild
                            >
                              <Link href={`/dashboard/inventory/materials/${material.id}`}>
                                <IconEye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <IconTrash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Material</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete the material "{material.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteMaterial(material.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}