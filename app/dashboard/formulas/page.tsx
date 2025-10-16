"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  IconDots,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconFlask,
  IconVersions,
  IconEye,
  IconCopy,
  IconGripVertical,
  IconCalculator,
  IconScale,
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconRefresh,
} from "@tabler/icons-react";

// Types
interface Formula {
  id: string;
  name: string;
  description?: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  totalWeight: string;
  unit: string;
  notes?: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormulaVersion {
  id: string;
  formulaId: string;
  version: number;
  name: string;
  description?: string;
  totalWeight: string;
  unit: string;
  notes?: string;
  changeReason?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

interface FormulaIngredient {
  id: string;
  formulaVersionId: string;
  materialId: string;
  material: {
    id: string;
    name: string;
    code: string;
    unit: string;
    cost: string;
  };
  percentage: string;
  weight: string;
  notes?: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Formula Builder Types
interface FormulaBuilderIngredient {
  id: string;
  materialId: string;
  material: {
    id: string;
    name: string;
    code: string;
    unit: string;
    cost: string;
  };
  percentage: number;
  weight: number;
  notes?: string;
}

interface FormulaBuilderState {
  formulaName: string;
  formulaDescription: string;
  totalWeight: number;
  unit: 'g' | 'ml';
  notes: string;
  ingredients: FormulaBuilderIngredient[];
  selectedMaterials: any[];
  isDragging: boolean;
  draggedIngredient: FormulaBuilderIngredient | null;
  costCalculation: {
    totalCost: number;
    costPerUnit: number;
    materialCosts: Array<{
      materialId: string;
      name: string;
      cost: number;
    }>;
  };
}

export default function FormulasPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [formulaVersions, setFormulaVersions] = useState<FormulaVersion[]>([]);
  const [formulaIngredients, setFormulaIngredients] = useState<FormulaIngredient[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isBuilderDialogOpen, setIsBuilderDialogOpen] = useState(false);

  // Formula Builder State
  const [builderState, setBuilderState] = useState<FormulaBuilderState>({
    formulaName: "",
    formulaDescription: "",
    totalWeight: 100,
    unit: "g",
    notes: "",
    ingredients: [],
    selectedMaterials: [],
    isDragging: false,
    draggedIngredient: null,
    costCalculation: {
      totalCost: 0,
      costPerUnit: 0,
      materialCosts: [],
    },
  });

  // Form states
  const [newFormula, setNewFormula] = useState({
    name: "",
    description: "",
    totalWeight: "",
    unit: "",
    notes: "",
  });

  const [newVersion, setNewVersion] = useState({
    name: "",
    description: "",
    totalWeight: "",
    unit: "",
    changeReason: "",
    ingredients: [] as Array<{
      materialId: string;
      percentage: string;
      notes: string;
    }>,
  });

  // Fetch materials for ingredient selection
  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/inventory/materials?limit=100&isActive=true");
      if (!response.ok) throw new Error("Failed to fetch materials");
      const data = await response.json();
      setMaterials(data.data);
    } catch (err) {
      console.error("Error fetching materials:", err);
    }
  };

  // Fetch formulas
  const fetchFormulas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/formulas?${params}`);
      if (!response.ok) throw new Error("Failed to fetch formulas");
      const data = await response.json();
      setFormulas(data.data);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setFormulas([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch formula versions
  const fetchFormulaVersions = async (formulaId: string) => {
    try {
      const response = await fetch(`/api/formulas/${formulaId}/versions`);
      if (!response.ok) throw new Error("Failed to fetch formula versions");
      const data = await response.json();
      setFormulaVersions(data.data);
    } catch (err) {
      console.error("Error fetching formula versions:", err);
      setFormulaVersions([]);
    }
  };

  // Fetch formula ingredients
  const fetchFormulaIngredients = async (versionId: string) => {
    try {
      const response = await fetch(`/api/formulas/versions/${versionId}/ingredients`);
      if (!response.ok) throw new Error("Failed to fetch formula ingredients");
      const data = await response.json();
      setFormulaIngredients(data.data);
    } catch (err) {
      console.error("Error fetching formula ingredients:", err);
      setFormulaIngredients([]);
    }
  };

  // Create new formula
  const handleCreateFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/formulas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newFormula),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create formula");
      }

      await fetchFormulas();
      setIsCreateDialogOpen(false);
      setNewFormula({
        name: "",
        description: "",
        totalWeight: "",
        unit: "",
        notes: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create formula");
    }
  };

  // Create new formula version
  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFormula) return;

    try {
      // Validate percentages sum to 100%
      const totalPercentage = newVersion.ingredients.reduce(
        (sum, ing) => sum + parseFloat(ing.percentage || "0"),
        0
      );

      if (Math.abs(totalPercentage - 100) > 0.01) {
        setError("Ingredient percentages must sum to 100%");
        return;
      }

      const response = await fetch(`/api/formulas/${selectedFormula.id}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newVersion,
          ingredients: newVersion.ingredients.map((ing) => ({
            ...ing,
            weight: (parseFloat(ing.percentage) * parseFloat(newVersion.totalWeight) / 100).toString(),
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create formula version");
      }

      await fetchFormulaVersions(selectedFormula.id);
      setIsVersionDialogOpen(false);
      setNewVersion({
        name: "",
        description: "",
        totalWeight: "",
        unit: "",
        changeReason: "",
        ingredients: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create formula version");
    }
  };

  // Add ingredient to new version
  const addIngredient = () => {
    setNewVersion({
      ...newVersion,
      ingredients: [
        ...newVersion.ingredients,
        {
          materialId: "",
          percentage: "",
          notes: "",
        },
      ],
    });
  };

  // Update ingredient
  const updateIngredient = (index: number, field: string, value: string) => {
    const updatedIngredients = [...newVersion.ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value,
    };
    setNewVersion({
      ...newVersion,
      ingredients: updatedIngredients,
    });
  };

  // Remove ingredient
  const removeIngredient = (index: number) => {
    const updatedIngredients = newVersion.ingredients.filter((_, i) => i !== index);
    setNewVersion({
      ...newVersion,
      ingredients: updatedIngredients,
    });
  };

  // Delete formula
  const handleDeleteFormula = async (id: string) => {
    if (!confirm("Are you sure you want to delete this formula? This action cannot be undone.")) return;

    try {
      const response = await fetch(`/api/formulas/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete formula");
      }

      await fetchFormulas();
      toast.success("Formula deleted successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete formula";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Formula Builder Functions
  const calculateCosts = useCallback((ingredients: FormulaBuilderIngredient[], totalWeight: number) => {
    let totalCost = 0;
    const materialCosts: Array<{ materialId: string; name: string; cost: number }> = [];

    ingredients.forEach((ingredient) => {
      const materialCost = parseFloat(ingredient.material.cost || "0");
      const weight = (ingredient.percentage / 100) * totalWeight;
      const cost = (materialCost * weight) / 1000; // Convert from per kg to per g/ml

      totalCost += cost;
      materialCosts.push({
        materialId: ingredient.materialId,
        name: ingredient.material.name,
        cost,
      });
    });

    return {
      totalCost,
      costPerUnit: totalCost,
      materialCosts,
    };
  }, []);

  const addIngredientToBuilder = (material: any) => {
    const existingIngredient = builderState.ingredients.find(
      (ing) => ing.materialId === material.id
    );

    if (existingIngredient) {
      toast.error("This material is already in the formula");
      return;
    }

    const newIngredient: FormulaBuilderIngredient = {
      id: crypto.randomUUID(),
      materialId: material.id,
      material: {
        id: material.id,
        name: material.name,
        code: material.code,
        unit: material.unit,
        cost: material.cost,
      },
      percentage: 0,
      weight: 0,
      notes: "",
    };

    const updatedIngredients = [...builderState.ingredients, newIngredient];
    const costCalculation = calculateCosts(updatedIngredients, builderState.totalWeight);

    setBuilderState({
      ...builderState,
      ingredients: updatedIngredients,
      costCalculation,
    });

    toast.success(`${material.name} added to formula`);
  };

  const updateBuilderIngredient = (ingredientId: string, field: string, value: any) => {
    const updatedIngredients = builderState.ingredients.map((ingredient) => {
      if (ingredient.id === ingredientId) {
        const updatedIngredient = { ...ingredient, [field]: value };

        // If percentage changed, recalculate weight
        if (field === "percentage") {
          updatedIngredient.weight = (value / 100) * builderState.totalWeight;
        }
        // If weight changed, recalculate percentage
        else if (field === "weight") {
          updatedIngredient.percentage = (value / builderState.totalWeight) * 100;
        }

        return updatedIngredient;
      }
      return ingredient;
    });

    const costCalculation = calculateCosts(updatedIngredients, builderState.totalWeight);

    setBuilderState({
      ...builderState,
      ingredients: updatedIngredients,
      costCalculation,
    });
  };

  const removeIngredientFromBuilder = (ingredientId: string) => {
    const updatedIngredients = builderState.ingredients.filter(
      (ing) => ing.id !== ingredientId
    );
    const costCalculation = calculateCosts(updatedIngredients, builderState.totalWeight);

    setBuilderState({
      ...builderState,
      ingredients: updatedIngredients,
      costCalculation,
    });

    toast.success("Ingredient removed from formula");
  };

  const updateBuilderTotalWeight = (newWeight: number) => {
    const updatedIngredients = builderState.ingredients.map((ingredient) => ({
      ...ingredient,
      weight: (ingredient.percentage / 100) * newWeight,
    }));

    const costCalculation = calculateCosts(updatedIngredients, newWeight);

    setBuilderState({
      ...builderState,
      totalWeight: newWeight,
      ingredients: updatedIngredients,
      costCalculation,
    });
  };

  const validateFormula = () => {
    const { formulaName, totalWeight, ingredients } = builderState;

    if (!formulaName.trim()) {
      toast.error("Formula name is required");
      return false;
    }

    if (totalWeight <= 0) {
      toast.error("Total weight must be greater than 0");
      return false;
    }

    if (ingredients.length === 0) {
      toast.error("At least one ingredient is required");
      return false;
    }

    const totalPercentage = ingredients.reduce((sum, ing) => sum + ing.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      toast.error(`Ingredient percentages must sum to 100%. Current total: ${totalPercentage.toFixed(2)}%`);
      return false;
    }

    return true;
  };

  const saveFormulaFromBuilder = async () => {
    if (!validateFormula()) return;

    try {
      const response = await fetch("/api/formulas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: builderState.formulaName,
          description: builderState.formulaDescription,
          totalWeight: builderState.totalWeight,
          unit: builderState.unit,
          notes: builderState.notes,
          createdBy: "current-user", // This should come from auth context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create formula");
      }

      const formulaData = await response.json();
      const newFormula = formulaData.data;

      // Create the first version with ingredients
      const versionResponse = await fetch(`/api/formulas/${newFormula.id}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Version 1`,
          description: builderState.formulaDescription,
          totalWeight: builderState.totalWeight,
          unit: builderState.unit,
          changeReason: "Initial formula creation",
          ingredients: builderState.ingredients.map((ing) => ({
            materialId: ing.materialId,
            percentage: ing.percentage.toString(),
            weight: ing.weight.toString(),
            notes: ing.notes,
          })),
        }),
      });

      if (!versionResponse.ok) {
        throw new Error("Failed to create formula version");
      }

      await fetchFormulas();
      setIsBuilderDialogOpen(false);
      resetBuilderState();
      toast.success("Formula created successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create formula";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const resetBuilderState = () => {
    setBuilderState({
      formulaName: "",
      formulaDescription: "",
      totalWeight: 100,
      unit: "g",
      notes: "",
      ingredients: [],
      selectedMaterials: [],
      isDragging: false,
      draggedIngredient: null,
      costCalculation: {
        totalCost: 0,
        costPerUnit: 0,
        materialCosts: [],
      },
    });
  };

  const getTotalPercentage = () => {
    return builderState.ingredients.reduce((sum, ing) => sum + ing.percentage, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // View formula details
  const viewFormula = async (formula: Formula) => {
    setSelectedFormula(formula);
    await fetchFormulaVersions(formula.id);
    if (formulaVersions.length > 0) {
      await fetchFormulaIngredients(formulaVersions[0].id);
    }
    setIsViewDialogOpen(true);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    fetchFormulas();
  }, [currentPage, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Formulas</h2>
          <p className="text-muted-foreground">
            Manage your product formulas with version control
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              New Formula
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Formula</DialogTitle>
              <DialogDescription>
                Create a new product formula. You can add ingredients and create versions later.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateFormula} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formula-name">Formula Name *</Label>
                <Input
                  id="formula-name"
                  value={newFormula.name}
                  onChange={(e) => setNewFormula({ ...newFormula, name: e.target.value })}
                  placeholder="e.g., Lavender Hand Cream"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="formula-description">Description</Label>
                <Textarea
                  id="formula-description"
                  value={newFormula.description}
                  onChange={(e) => setNewFormula({ ...newFormula, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="formula-weight">Total Weight *</Label>
                  <Input
                    id="formula-weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newFormula.totalWeight}
                    onChange={(e) => setNewFormula({ ...newFormula, totalWeight: e.target.value })}
                    placeholder="100"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formula-unit">Unit *</Label>
                  <Select
                    value={newFormula.unit}
                    onValueChange={(value) => setNewFormula({ ...newFormula, unit: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">grams (g)</SelectItem>
                      <SelectItem value="kg">kilograms (kg)</SelectItem>
                      <SelectItem value="ml">milliliters (ml)</SelectItem>
                      <SelectItem value="L">liters (L)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formula-notes">Notes</Label>
                <Textarea
                  id="formula-notes"
                  value={newFormula.notes}
                  onChange={(e) => setNewFormula({ ...newFormula, notes: e.target.value })}
                  placeholder="Additional notes about this formula"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit">Create Formula</Button>
              </div>
            </form>
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
                  placeholder="Search formulas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Formulas</CardTitle>
          <CardDescription>
            {pagination ? `Showing ${formulas.length} of ${pagination.total} formulas` : "Loading..."}
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
              <Button onClick={fetchFormulas}>Retry</Button>
            </div>
          ) : formulas.length === 0 ? (
            <div className="text-center py-10">
              <IconFlask className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No formulas found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter
                  ? "Try adjusting your filters"
                  : "Get started by creating your first formula"}
              </p>
              {!searchTerm && !statusFilter && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Create Formula
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formulas.map((formula) => (
                    <TableRow key={formula.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formula.name}</div>
                          {formula.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {formula.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {parseFloat(formula.totalWeight).toFixed(1)} {formula.unit}
                      </TableCell>
                      <TableCell>{getStatusBadge(formula.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">v{formula.version}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(formula.createdAt).toLocaleDateString()}
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
                            <DropdownMenuItem onClick={() => viewFormula(formula)}>
                              <IconEye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedFormula(formula);
                                setIsVersionDialogOpen(true);
                              }}
                            >
                              <IconVersions className="mr-2 h-4 w-4" />
                              New Version
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/formulas/${formula.id}`}>
                                <IconEdit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteFormula(formula.id)}
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

      {/* View Formula Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedFormula?.name}</DialogTitle>
            <DialogDescription>
              Formula details and version history
            </DialogDescription>
          </DialogHeader>
          {selectedFormula && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="versions">Versions</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedFormula.description || "No description"}
                    </p>
                  </div>
                  <div>
                    <Label>Total Weight</Label>
                    <p className="text-sm text-muted-foreground">
                      {parseFloat(selectedFormula.totalWeight).toFixed(1)} {selectedFormula.unit}
                    </p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedFormula.status)}</div>
                  </div>
                  <div>
                    <Label>Current Version</Label>
                    <p className="text-sm text-muted-foreground">v{selectedFormula.version}</p>
                  </div>
                </div>
                {selectedFormula.notes && (
                  <div>
                    <Label>Notes</Label>
                    <p className="text-sm text-muted-foreground">{selectedFormula.notes}</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="versions" className="space-y-4">
                {formulaVersions.length === 0 ? (
                  <p className="text-muted-foreground">No versions found</p>
                ) : (
                  <div className="space-y-4">
                    {formulaVersions.map((version) => (
                      <Card key={version.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base">Version {version.version}</CardTitle>
                              <CardDescription>
                                {new Date(version.createdAt).toLocaleDateString()}
                                {version.changeReason && ` • ${version.changeReason}`}
                              </CardDescription>
                            </div>
                            <Badge variant={version.isActive ? "default" : "secondary"}>
                              {version.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm">
                              <strong>Total Weight:</strong> {parseFloat(version.totalWeight).toFixed(1)} {version.unit}
                            </p>
                            {version.description && (
                              <p className="text-sm text-muted-foreground">{version.description}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* New Version Dialog */}
      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Create a new version of "{selectedFormula?.name}"
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateVersion} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version-name">Version Name</Label>
                <Input
                  id="version-name"
                  value={newVersion.name}
                  onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })}
                  placeholder="e.g., Improved Formula v2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version-weight">Total Weight *</Label>
                <Input
                  id="version-weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newVersion.totalWeight}
                  onChange={(e) => setNewVersion({ ...newVersion, totalWeight: e.target.value })}
                  placeholder="100"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="version-description">Description</Label>
              <Textarea
                id="version-description"
                value={newVersion.description}
                onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                placeholder="What changed in this version?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="version-reason">Change Reason</Label>
              <Input
                id="version-reason"
                value={newVersion.changeReason}
                onChange={(e) => setNewVersion({ ...newVersion, changeReason: e.target.value })}
                placeholder="e.g., Improved scent profile"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Ingredients</Label>
                <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Ingredient
                </Button>
              </div>

              {newVersion.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Select
                    value={ingredient.materialId}
                    onValueChange={(value) => updateIngredient(index, "materialId", value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name} ({material.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="w-24">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={ingredient.percentage}
                      onChange={(e) => updateIngredient(index, "percentage", e.target.value)}
                      placeholder="%"
                    />
                  </div>

                  <Input
                    placeholder="Notes"
                    value={ingredient.notes}
                    onChange={(e) => updateIngredient(index, "notes", e.target.value)}
                    className="flex-1"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {newVersion.ingredients.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Total Percentage:{" "}
                  {newVersion.ingredients.reduce(
                    (sum, ing) => sum + parseFloat(ing.percentage || "0"),
                    0
                  ).toFixed(2)}
                  %
                  {Math.abs(
                    newVersion.ingredients.reduce(
                      (sum, ing) => sum + parseFloat(ing.percentage || "0"),
                      0
                    ) - 100
                  ) > 0.01 && (
                    <span className="text-red-500 ml-2">Must equal 100%</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit">Create Version</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}