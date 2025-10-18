"use client";

import { useState, useEffect } from "react";
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
  IconCalculator,
  IconEye,
} from "@tabler/icons-react";

// Types
interface Packaging {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: string;
  size: string;
  material?: string;
  cost: string;
  purchaseQuantity: number;
  costPerUnit: string;
  currency: string;
  supplier?: string;
  supplierCode?: string;
  minOrderQuantity: number;
  currentStock: number;
  isActive: boolean;
  notes?: string;
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

export default function PackagingPage() {
  const [packaging, setPackaging] = useState<Packaging[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("all");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPackaging, setEditingPackaging] = useState<Packaging | null>(null);

  // Form states
  const [newPackaging, setNewPackaging] = useState({
    name: "",
    description: "",
    type: "",
    size: "",
    material: "",
    cost: "",
    purchaseQuantity: "1",
    currency: "IDR",
    supplier: "",
    supplierCode: "",
    minOrderQuantity: "1",
    notes: "",
  });

  // Packaging types
  const packagingTypes = [
    "Bottle",
    "Jar",
    "Tube",
    "Pump",
    "Sprayer",
    "Cap",
    "Seal",
    "Box",
    "Container",
    "Other"
  ];

  // Packaging materials
  const packagingMaterials = [
    "Glass",
    "Plastic",
    "Aluminum",
    "Tin",
    "Paper",
    "Cardboard",
    "Ceramic",
    "Other"
  ];

  // Fetch packaging
  const fetchPackaging = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (searchTerm) params.append("search", searchTerm);
      if (selectedType && selectedType !== "all") params.append("type", selectedType);
      if (selectedMaterial && selectedMaterial !== "all") params.append("material", selectedMaterial);
      if (isActiveFilter !== undefined) params.append("isActive", isActiveFilter.toString());

      const response = await fetch(`/api/inventory/packaging?${params}`);
      if (!response.ok) throw new Error("Failed to fetch packaging");
      const data = await response.json();
      setPackaging(data.data);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setPackaging([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Create new packaging
  const handleCreatePackaging = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out empty strings from the request body
      const requestBody = {
        name: newPackaging.name,
        description: newPackaging.description || undefined,
        type: newPackaging.type,
        size: newPackaging.size,
        material: newPackaging.material || undefined,
        cost: newPackaging.cost,
        purchaseQuantity: newPackaging.purchaseQuantity,
        currency: newPackaging.currency || "IDR",
        supplier: newPackaging.supplier || undefined,
        supplierCode: newPackaging.supplierCode || undefined,
        minOrderQuantity: newPackaging.minOrderQuantity || "1",
        currentStock: newPackaging.currentStock || "0",
        notes: newPackaging.notes || undefined,
      };

      const response = await fetch("/api/inventory/packaging", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create packaging");
      }

      toast.success("Packaging created successfully!");
      await fetchPackaging();
      setIsCreateDialogOpen(false);
      setNewPackaging({
        name: "",
        description: "",
        type: "",
        size: "",
        material: "",
        cost: "",
        purchaseQuantity: "1",
        currency: "IDR",
        supplier: "",
        supplierCode: "",
        minOrderQuantity: "1",
        currentStock: "0",
        notes: "",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create packaging";
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  // Delete packaging
  const handleDeletePackaging = async (id: string) => {
    if (!confirm("Are you sure you want to delete this packaging item?")) return;

    try {
      const response = await fetch(`/api/inventory/packaging/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete packaging");
      }

      toast.success("Packaging deleted successfully!");
      await fetchPackaging();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete packaging";
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  // Edit packaging
  const handleEditPackaging = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackaging) return;

    try {
      // Filter out empty strings from the request body and convert numbers to strings
      const requestBody = {
        name: editingPackaging.name,
        description: editingPackaging.description || undefined,
        type: editingPackaging.type,
        size: editingPackaging.size,
        material: editingPackaging.material || undefined,
        cost: editingPackaging.cost,
        purchaseQuantity: editingPackaging.purchaseQuantity.toString(),
        currency: editingPackaging.currency || "IDR",
        supplier: editingPackaging.supplier || undefined,
        supplierCode: editingPackaging.supplierCode || undefined,
        minOrderQuantity: editingPackaging.minOrderQuantity.toString(),
        currentStock: editingPackaging.currentStock.toString(),
        notes: editingPackaging.notes || undefined,
      };

      const response = await fetch(`/api/inventory/packaging/${editingPackaging.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update packaging");
      }

      toast.success("Packaging updated successfully!");
      await fetchPackaging();
      setIsEditDialogOpen(false);
      setEditingPackaging(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update packaging";
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  // Start editing packaging
  const startEditPackaging = (packaging: Packaging) => {
    setEditingPackaging(packaging);
    setIsEditDialogOpen(true);
  };

  useEffect(() => {
    fetchPackaging();

    // Set up realtime subscription
    const packagingChannel = subscribeToTable('packaging', '*', (payload) => {
      console.log('Packaging change received:', payload);
      fetchPackaging(); // Refetch packaging on any change
    });

    // Cleanup function
    return () => {
      unsubscribeFromChannel(packagingChannel);
    };
  }, [currentPage, searchTerm, selectedType, selectedMaterial, isActiveFilter]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Packaging</h2>
          <p className="text-muted-foreground">
            Manage your packaging inventory with automatic cost per unit calculation
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Packaging
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Packaging</DialogTitle>
              <DialogDescription>
                Add new packaging to your inventory. Cost per unit will be calculated automatically.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePackaging} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packaging-name">Packaging Name *</Label>
                  <Input
                    id="packaging-name"
                    value={newPackaging.name}
                    onChange={(e) => setNewPackaging({ ...newPackaging, name: e.target.value })}
                    placeholder="e.g., 30ml Amber Bottle"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packaging-type">Type *</Label>
                  <Select
                    value={newPackaging.type}
                    onValueChange={(value) => setNewPackaging({ ...newPackaging, type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {packagingTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packaging-size">Size *</Label>
                  <Input
                    id="packaging-size"
                    value={newPackaging.size}
                    onChange={(e) => setNewPackaging({ ...newPackaging, size: e.target.value })}
                    placeholder="e.g., 30ml, 100g"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packaging-material">Material</Label>
                  <Select
                    value={newPackaging.material}
                    onValueChange={(value) => setNewPackaging({ ...newPackaging, material: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {packagingMaterials.map((material) => (
                        <SelectItem key={material} value={material}>
                          {material}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="packaging-description">Description</Label>
                <Textarea
                  id="packaging-description"
                  value={newPackaging.description}
                  onChange={(e) => setNewPackaging({ ...newPackaging, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packaging-cost">Purchase Cost (IDR) *</Label>
                  <Input
                    id="packaging-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPackaging.cost}
                    onChange={(e) => setNewPackaging({ ...newPackaging, cost: e.target.value })}
                    placeholder="50000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packaging-purchase-quantity">Purchase Quantity *</Label>
                  <Input
                    id="packaging-purchase-quantity"
                    type="number"
                    step="1"
                    min="1"
                    value={newPackaging.purchaseQuantity}
                    onChange={(e) => setNewPackaging({ ...newPackaging, purchaseQuantity: e.target.value })}
                    placeholder="100"
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
                  Cost per unit = Purchase Cost ÷ Purchase Quantity
                </p>
                {newPackaging.cost && newPackaging.purchaseQuantity && (
                  <p className="text-sm font-medium text-primary mt-2">
                    {formatIDR(parseFloat(newPackaging.cost) / parseInt(newPackaging.purchaseQuantity))} per unit
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packaging-supplier">Supplier</Label>
                  <Input
                    id="packaging-supplier"
                    value={newPackaging.supplier}
                    onChange={(e) => setNewPackaging({ ...newPackaging, supplier: e.target.value })}
                    placeholder="Supplier name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packaging-supplier-code">Supplier Code</Label>
                  <Input
                    id="packaging-supplier-code"
                    value={newPackaging.supplierCode}
                    onChange={(e) => setNewPackaging({ ...newPackaging, supplierCode: e.target.value })}
                    placeholder="Supplier's product code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packaging-min-order">Min Order Quantity</Label>
                  <Input
                    id="packaging-min-order"
                    type="number"
                    step="1"
                    min="1"
                    value={newPackaging.minOrderQuantity}
                    onChange={(e) => setNewPackaging({ ...newPackaging, minOrderQuantity: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packaging-current-stock">Current Stock</Label>
                  <Input
                    id="packaging-current-stock"
                    type="number"
                    step="1"
                    min="0"
                    value={newPackaging.currentStock}
                    onChange={(e) => setNewPackaging({ ...newPackaging, currentStock: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="packaging-notes">Notes</Label>
                <Textarea
                  id="packaging-notes"
                  value={newPackaging.notes}
                  onChange={(e) => setNewPackaging({ ...newPackaging, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit">Add Packaging</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Packaging</DialogTitle>
              <DialogDescription>
                Update packaging details. Cost per unit will be recalculated automatically.
              </DialogDescription>
            </DialogHeader>
            {editingPackaging && (
              <form onSubmit={handleEditPackaging} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-packaging-name">Packaging Name *</Label>
                    <Input
                      id="edit-packaging-name"
                      value={editingPackaging.name}
                      onChange={(e) => setEditingPackaging({ ...editingPackaging, name: e.target.value })}
                      placeholder="e.g., 30ml Amber Bottle"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-packaging-type">Type *</Label>
                    <Select
                      value={editingPackaging.type}
                      onValueChange={(value) => setEditingPackaging({ ...editingPackaging, type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {packagingTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-packaging-size">Size *</Label>
                    <Input
                      id="edit-packaging-size"
                      value={editingPackaging.size}
                      onChange={(e) => setEditingPackaging({ ...editingPackaging, size: e.target.value })}
                      placeholder="e.g., 30ml, 100g"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-packaging-material">Material</Label>
                    <Select
                      value={editingPackaging.material || ""}
                      onValueChange={(value) => setEditingPackaging({ ...editingPackaging, material: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {packagingMaterials.map((material) => (
                          <SelectItem key={material} value={material}>
                            {material}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-packaging-description">Description</Label>
                  <Textarea
                    id="edit-packaging-description"
                    value={editingPackaging.description || ""}
                    onChange={(e) => setEditingPackaging({ ...editingPackaging, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-packaging-cost">Purchase Cost (IDR) *</Label>
                    <Input
                      id="edit-packaging-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingPackaging.cost}
                      onChange={(e) => setEditingPackaging({ ...editingPackaging, cost: e.target.value })}
                      placeholder="50000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-packaging-purchase-quantity">Purchase Quantity *</Label>
                    <Input
                      id="edit-packaging-purchase-quantity"
                      type="number"
                      step="1"
                      min="1"
                      value={editingPackaging.purchaseQuantity.toString()}
                      onChange={(e) => setEditingPackaging({ ...editingPackaging, purchaseQuantity: e.target.value })}
                      placeholder="100"
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
                    Cost per unit = Purchase Cost ÷ Purchase Quantity
                  </p>
                  {editingPackaging.cost && editingPackaging.purchaseQuantity && (
                    <p className="text-sm font-medium text-primary mt-2">
                      {formatIDR(parseFloat(editingPackaging.cost) / editingPackaging.purchaseQuantity)} per unit
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-packaging-supplier">Supplier</Label>
                    <Input
                      id="edit-packaging-supplier"
                      value={editingPackaging.supplier || ""}
                      onChange={(e) => setEditingPackaging({ ...editingPackaging, supplier: e.target.value })}
                      placeholder="Supplier name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-packaging-supplier-code">Supplier Code</Label>
                    <Input
                      id="edit-packaging-supplier-code"
                      value={editingPackaging.supplierCode || ""}
                      onChange={(e) => setEditingPackaging({ ...editingPackaging, supplierCode: e.target.value })}
                      placeholder="Supplier's product code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-packaging-min-order">Min Order Quantity</Label>
                    <Input
                      id="edit-packaging-min-order"
                      type="number"
                      step="1"
                      min="1"
                      value={editingPackaging.minOrderQuantity.toString()}
                      onChange={(e) => setEditingPackaging({ ...editingPackaging, minOrderQuantity: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-packaging-current-stock">Current Stock</Label>
                    <Input
                      id="edit-packaging-current-stock"
                      type="number"
                      step="1"
                      min="0"
                      value={editingPackaging.currentStock.toString()}
                      onChange={(e) => setEditingPackaging({ ...editingPackaging, currentStock: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-packaging-notes">Notes</Label>
                  <Textarea
                    id="edit-packaging-notes"
                    value={editingPackaging.notes || ""}
                    onChange={(e) => setEditingPackaging({ ...editingPackaging, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Packaging</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search packaging..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {packagingTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                <SelectTrigger>
                  <SelectValue placeholder="All Materials" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Materials</SelectItem>
                  {packagingMaterials.map((material) => (
                    <SelectItem key={material} value={material}>
                      {material}
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
        </CardContent>
      </Card>

      {/* Packaging Table */}
      <Card>
        <CardHeader>
          <CardTitle>Packaging Inventory</CardTitle>
          <CardDescription>
            {pagination ? `Showing ${packaging.length} of ${pagination.total} items` : "Loading..."}
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
              <Button onClick={fetchPackaging}>Retry</Button>
            </div>
          ) : packaging.length === 0 ? (
            <div className="text-center py-10">
              <IconPackage className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No packaging found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedType !== "all" || selectedMaterial !== "all" || isActiveFilter !== undefined
                  ? "Try adjusting your filters"
                  : "Get started by adding your first packaging item"}
              </p>
              {!searchTerm && selectedType === "all" && selectedMaterial === "all" && isActiveFilter === undefined && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Packaging
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
                    <TableHead>Type & Size</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Purchase Info</TableHead>
                    <TableHead>Cost/Unit</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packaging.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline">{item.type}</Badge>
                          <div className="text-sm text-muted-foreground">{item.size}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.material ? (
                          <Badge variant="secondary">{item.material}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatIDR(parseFloat(item.cost))}</div>
                          <div className="text-muted-foreground">{item.purchaseQuantity} units</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          {formatIDR(parseFloat(item.costPerUnit))}
                        </div>
                        <div className="text-sm text-muted-foreground">per unit</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{item.currentStock} units</div>
                          {item.currentStock < item.minOrderQuantity && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              Low Stock
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? "default" : "secondary"}>
                          {item.isActive ? "Active" : "Inactive"}
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
                              onClick={() => startEditPackaging(item)}
                            >
                              <IconEdit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              asChild
                            >
                              <Link href={`/dashboard/inventory/packaging/${item.id}`}>
                                <IconEye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeletePackaging(item.id)}
                            >
                              <IconTrash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
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