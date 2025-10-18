"use client";

import { useState, useEffect } from "react";
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
  IconTag,
  IconCalculator,
  IconEye,
} from "@tabler/icons-react";

// Types
interface LabelItem {
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

export default function LabelsPage() {
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("all");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditLabelDialogOpen, setIsEditLabelDialogOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<LabelItem | null>(null);

  // Form states
  const [newLabel, setNewLabel] = useState({
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

  // Label types
  const labelTypes = [
    "Sticker",
    "Printed",
    "Embossed",
    "Foiled",
    "Screen Printed",
    "Digital Print",
    "Thermal",
    "Hang Tag",
    "Woven Label",
    "Other"
  ];

  // Label materials
  const labelMaterials = [
    "Paper",
    "Vinyl",
    "Polyester",
    "Cotton",
    "Satin",
    "Canvas",
    "Plastic",
    "Metal",
    "Other"
  ];

  // Fetch labels
  const fetchLabels = async () => {
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

      const response = await fetch(`/api/inventory/labels?${params}`);
      if (!response.ok) throw new Error("Failed to fetch labels");
      const data = await response.json();
      setLabels(data.data);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLabels([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Create new label
  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out empty strings from the request body
      const requestBody = {
        name: newLabel.name,
        description: newLabel.description || undefined,
        type: newLabel.type,
        size: newLabel.size,
        material: newLabel.material || undefined,
        cost: newLabel.cost,
        purchaseQuantity: newLabel.purchaseQuantity,
        currency: newLabel.currency || "IDR",
        supplier: newLabel.supplier || undefined,
        supplierCode: newLabel.supplierCode || undefined,
        minOrderQuantity: newLabel.minOrderQuantity || "1",
        currentStock: newLabel.currentStock || "0",
        notes: newLabel.notes || undefined,
      };

      const response = await fetch("/api/inventory/labels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create label");
      }

      await fetchLabels();
      setIsCreateDialogOpen(false);
      setNewLabel({
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
      toast.success("Label created successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create label";
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  // Edit label
  const handleEditLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLabel) return;

    try {
      // Filter out empty strings from the request body and convert numbers to strings
      const requestBody = {
        name: editingLabel.name,
        description: editingLabel.description || undefined,
        type: editingLabel.type,
        size: editingLabel.size,
        material: editingLabel.material || undefined,
        cost: editingLabel.cost,
        purchaseQuantity: editingLabel.purchaseQuantity.toString(),
        currency: editingLabel.currency || "IDR",
        supplier: editingLabel.supplier || undefined,
        supplierCode: editingLabel.supplierCode || undefined,
        minOrderQuantity: editingLabel.minOrderQuantity.toString(),
        currentStock: editingLabel.currentStock.toString(),
        notes: editingLabel.notes || undefined,
      };

      const response = await fetch(`/api/inventory/labels/${editingLabel.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update label");
      }

      await fetchLabels();
      setIsEditLabelDialogOpen(false);
      setEditingLabel(null);
      toast.success("Label updated successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update label";
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  // Delete label
  const handleDeleteLabel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this label?")) return;

    try {
      const response = await fetch(`/api/inventory/labels/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete label");
      }

      await fetchLabels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete label");
    }
  };

  useEffect(() => {
    fetchLabels();

    // Set up realtime subscription
    const labelsChannel = subscribeToTable('labels', '*', (payload) => {
      console.log('Labels change received:', payload);
      fetchLabels(); // Refetch labels on any change
    });

    // Cleanup function
    return () => {
      unsubscribeFromChannel(labelsChannel);
    };
  }, [currentPage, searchTerm, selectedType, selectedMaterial, isActiveFilter]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Labels</h2>
          <p className="text-muted-foreground">
            Manage your product labels with automatic cost per unit calculation
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Label
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Label</DialogTitle>
              <DialogDescription>
                Add new product labels to your inventory. Cost per unit will be calculated automatically.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateLabel} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label-name">Label Name *</Label>
                  <Input
                    id="label-name"
                    value={newLabel.name}
                    onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                    placeholder="e.g., Product Logo Sticker"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label-type">Type *</Label>
                  <Select
                    value={newLabel.type}
                    onValueChange={(value) => setNewLabel({ ...newLabel, type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {labelTypes.map((type) => (
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
                  <Label htmlFor="label-size">Size *</Label>
                  <Input
                    id="label-size"
                    value={newLabel.size}
                    onChange={(e) => setNewLabel({ ...newLabel, size: e.target.value })}
                    placeholder="e.g., 2x3, 5x7, 10cm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label-material">Material</Label>
                  <Select
                    value={newLabel.material}
                    onValueChange={(value) => setNewLabel({ ...newLabel, material: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {labelMaterials.map((material) => (
                        <SelectItem key={material} value={material}>
                          {material}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="label-description">Description</Label>
                <Textarea
                  id="label-description"
                  value={newLabel.description}
                  onChange={(e) => setNewLabel({ ...newLabel, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label-cost">Purchase Cost (IDR) *</Label>
                  <Input
                    id="label-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newLabel.cost}
                    onChange={(e) => setNewLabel({ ...newLabel, cost: e.target.value })}
                    placeholder="15000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label-purchase-quantity">Purchase Quantity *</Label>
                  <Input
                    id="label-purchase-quantity"
                    type="number"
                    step="1"
                    min="1"
                    value={newLabel.purchaseQuantity}
                    onChange={(e) => setNewLabel({ ...newLabel, purchaseQuantity: e.target.value })}
                    placeholder="500"
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
                {newLabel.cost && newLabel.purchaseQuantity && (
                  <p className="text-sm font-medium text-primary mt-2">
                    {formatIDR(parseFloat(newLabel.cost) / parseInt(newLabel.purchaseQuantity))} per unit
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label-supplier">Supplier</Label>
                  <Input
                    id="label-supplier"
                    value={newLabel.supplier}
                    onChange={(e) => setNewLabel({ ...newLabel, supplier: e.target.value })}
                    placeholder="Supplier name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label-supplier-code">Supplier Code</Label>
                  <Input
                    id="label-supplier-code"
                    value={newLabel.supplierCode}
                    onChange={(e) => setNewLabel({ ...newLabel, supplierCode: e.target.value })}
                    placeholder="Supplier's product code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label-min-order">Min Order Quantity</Label>
                  <Input
                    id="label-min-order"
                    type="number"
                    step="1"
                    min="1"
                    value={newLabel.minOrderQuantity}
                    onChange={(e) => setNewLabel({ ...newLabel, minOrderQuantity: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label-current-stock">Current Stock</Label>
                  <Input
                    id="label-current-stock"
                    type="number"
                    step="1"
                    min="0"
                    value={newLabel.currentStock}
                    onChange={(e) => setNewLabel({ ...newLabel, currentStock: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="label-notes">Notes</Label>
                <Textarea
                  id="label-notes"
                  value={newLabel.notes}
                  onChange={(e) => setNewLabel({ ...newLabel, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit">Add Label</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Label Dialog */}
        <Dialog open={isEditLabelDialogOpen} onOpenChange={setIsEditLabelDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Label</DialogTitle>
              <DialogDescription>
                Update label information. Cost per unit will be calculated automatically.
              </DialogDescription>
            </DialogHeader>
            {editingLabel && (
              <form onSubmit={handleEditLabel} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-label-name">Label Name *</Label>
                    <Input
                      id="edit-label-name"
                      value={editingLabel.name}
                      onChange={(e) => setEditingLabel({ ...editingLabel, name: e.target.value })}
                      placeholder="e.g., Product Logo Sticker"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-label-type">Type *</Label>
                    <Select
                      value={editingLabel.type}
                      onValueChange={(value) => setEditingLabel({ ...editingLabel, type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {labelTypes.map((type) => (
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
                    <Label htmlFor="edit-label-size">Size *</Label>
                    <Input
                      id="edit-label-size"
                      value={editingLabel.size}
                      onChange={(e) => setEditingLabel({ ...editingLabel, size: e.target.value })}
                      placeholder="e.g., 2x3, 5x7, 10cm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-label-material">Material</Label>
                    <Select
                      value={editingLabel.material || ""}
                      onValueChange={(value) => setEditingLabel({ ...editingLabel, material: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {labelMaterials.map((material) => (
                          <SelectItem key={material} value={material}>
                            {material}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-label-description">Description</Label>
                  <Textarea
                    id="edit-label-description"
                    value={editingLabel.description || ""}
                    onChange={(e) => setEditingLabel({ ...editingLabel, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-label-cost">Purchase Cost (IDR) *</Label>
                    <Input
                      id="edit-label-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingLabel.cost}
                      onChange={(e) => setEditingLabel({ ...editingLabel, cost: e.target.value })}
                      placeholder="15000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-label-purchase-quantity">Purchase Quantity *</Label>
                    <Input
                      id="edit-label-purchase-quantity"
                      type="number"
                      step="1"
                      min="1"
                      value={editingLabel.purchaseQuantity.toString()}
                      onChange={(e) => setEditingLabel({ ...editingLabel, purchaseQuantity: e.target.value })}
                      placeholder="500"
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
                  {editingLabel.cost && editingLabel.purchaseQuantity && (
                    <p className="text-sm font-medium text-primary mt-2">
                      {formatIDR(parseFloat(editingLabel.cost) / editingLabel.purchaseQuantity)} per unit
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-label-supplier">Supplier</Label>
                    <Input
                      id="edit-label-supplier"
                      value={editingLabel.supplier || ""}
                      onChange={(e) => setEditingLabel({ ...editingLabel, supplier: e.target.value })}
                      placeholder="Supplier name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-label-supplier-code">Supplier Code</Label>
                    <Input
                      id="edit-label-supplier-code"
                      value={editingLabel.supplierCode || ""}
                      onChange={(e) => setEditingLabel({ ...editingLabel, supplierCode: e.target.value })}
                      placeholder="Supplier's product code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-label-min-order">Min Order Quantity</Label>
                    <Input
                      id="edit-label-min-order"
                      type="number"
                      step="1"
                      min="1"
                      value={editingLabel.minOrderQuantity.toString()}
                      onChange={(e) => setEditingLabel({ ...editingLabel, minOrderQuantity: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-label-current-stock">Current Stock</Label>
                    <Input
                      id="edit-label-current-stock"
                      type="number"
                      step="1"
                      min="0"
                      value={editingLabel.currentStock.toString()}
                      onChange={(e) => setEditingLabel({ ...editingLabel, currentStock: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-label-notes">Notes</Label>
                  <Textarea
                    id="edit-label-notes"
                    value={editingLabel.notes || ""}
                    onChange={(e) => setEditingLabel({ ...editingLabel, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Update Label</Button>
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
                  placeholder="Search labels..."
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
                  {labelTypes.map((type) => (
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
                  {labelMaterials.map((material) => (
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

      {/* Labels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Label Inventory</CardTitle>
          <CardDescription>
            {pagination ? `Showing ${labels.length} of ${pagination.total} items` : "Loading..."}
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
              <Button onClick={fetchLabels}>Retry</Button>
            </div>
          ) : labels.length === 0 ? (
            <div className="text-center py-10">
              <IconTag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No labels found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedType !== "all" || selectedMaterial !== "all" || isActiveFilter !== undefined
                  ? "Try adjusting your filters"
                  : "Get started by adding your first label"}
              </p>
              {!searchTerm && selectedType === "all" && selectedMaterial === "all" && isActiveFilter === undefined && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Label
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
                  {labels.map((item) => (
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
                              onClick={() => {
                                setEditingLabel(item);
                                setIsEditLabelDialogOpen(true);
                              }}
                            >
                              <IconEdit className="mr-2 h-4 w-4" />
                              Edit Label
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              asChild
                            >
                              <Link href={`/dashboard/inventory/labels/${item.id}`}>
                                <IconEye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteLabel(item.id)}
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