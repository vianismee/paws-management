"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconCalculator,
  IconCurrencyDollar,
  IconPackage,
  IconTag,
  IconEye,
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react";

// Types
interface CogsCalculation {
  id: string;
  formulaVersionId: string;
  formulaVersion: {
    id: string;
    version: number;
    name: string;
    formula: {
      id: string;
      name: string;
    };
  };
  materialCost: string;
  packagingCost: string;
  labelCost: string;
  laborCost: string;
  overheadCost: string;
  totalCost: string;
  unitWeight: string;
  costPerGram: string;
  calculationDate: string;
  isActive: boolean;
  createdAt: string;
}

interface MaterialCostBreakdown {
  id: string;
  cogsCalculationId: string;
  materialId: string;
  material: {
    id: string;
    name: string;
    code: string;
    unit: string;
  };
  materialCostAtTime: string;
  percentage: string;
  weightPerUnit: string;
  costPerUnit: string;
  createdAt: string;
}

interface Formula {
  id: string;
  name: string;
  version: number;
  status: string;
}

export default function CogsPage() {
  const [calculations, setCalculations] = useState<CogsCalculation[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [selectedCalculation, setSelectedCalculation] = useState<CogsCalculation | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<MaterialCostBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormula, setSelectedFormula] = useState<string>("");
  const [isCalculateDialogOpen, setIsCalculateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Fetch formulas
  const fetchFormulas = async () => {
    try {
      const response = await fetch("/api/formulas?status=active&limit=100");
      if (!response.ok) throw new Error("Failed to fetch formulas");
      const data = await response.json();
      setFormulas(data.data);
    } catch (err) {
      console.error("Error fetching formulas:", err);
    }
  };

  // Fetch COGS calculations
  const fetchCalculations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFormula && selectedFormula !== "all") params.append("formulaId", selectedFormula);

      const response = await fetch(`/api/cogs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch COGS calculations");
      const data = await response.json();
      setCalculations(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setCalculations([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate COGS for a formula
  const handleCalculateCogs = async () => {
    if (!selectedFormula) return;

    try {
      setCalculating(true);
      const response = await fetch("/api/cogs/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formulaId: selectedFormula,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to calculate COGS");
      }

      const data = await response.json();
      setCalculations([data.data, ...calculations]);
      setIsCalculateDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate COGS");
    } finally {
      setCalculating(false);
    }
  };

  // Fetch cost breakdown for a calculation
  const fetchCostBreakdown = async (calculationId: string) => {
    try {
      const response = await fetch(`/api/cogs/${calculationId}/breakdown`);
      if (!response.ok) throw new Error("Failed to fetch cost breakdown");
      const data = await response.json();
      setCostBreakdown(data.data);
    } catch (err) {
      console.error("Error fetching cost breakdown:", err);
      setCostBreakdown([]);
    }
  };

  // View calculation details
  const viewCalculation = async (calculation: CogsCalculation) => {
    setSelectedCalculation(calculation);
    await fetchCostBreakdown(calculation.id);
    setIsViewDialogOpen(true);
  };

  useEffect(() => {
    fetchFormulas();
  }, []);

  useEffect(() => {
    fetchCalculations();
  }, [selectedFormula]);

  // Calculate summary statistics
  const totalProducts = calculations.length;
  const averageCostPerUnit = calculations.length > 0
    ? calculations.reduce((sum, calc) => sum + parseFloat(calc.totalCost), 0) / calculations.length
    : 0;
  const highestCost = calculations.length > 0
    ? Math.max(...calculations.map(calc => parseFloat(calc.totalCost)))
    : 0;
  const lowestCost = calculations.length > 0
    ? Math.min(...calculations.map(calc => parseFloat(calc.totalCost)))
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">COGS Analysis</h2>
          <p className="text-muted-foreground">
            Cost of Goods Sold calculations and breakdowns for your products
          </p>
        </div>
        <Dialog open={isCalculateDialogOpen} onOpenChange={setIsCalculateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconCalculator className="mr-2 h-4 w-4" />
              Calculate COGS
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Calculate COGS</DialogTitle>
              <DialogDescription>
                Select a formula to calculate its Cost of Goods Sold
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formula-select">Formula</Label>
                <Select value={selectedFormula} onValueChange={setSelectedFormula}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a formula" />
                  </SelectTrigger>
                  <SelectContent>
                    {formulas.map((formula) => (
                      <SelectItem key={formula.id} value={formula.id}>
                        {formula.name} (v{formula.version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCalculateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCalculateCogs}
                  disabled={!selectedFormula || calculating}
                >
                  {calculating ? (
                    <>
                      <IconRefresh className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    "Calculate"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <IconPackage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Products with COGS calculations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost/Unit</CardTitle>
            <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageCostPerUnit)}</div>
            <p className="text-xs text-muted-foreground">
              Across all products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Cost</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(highestCost)}</div>
            <p className="text-xs text-muted-foreground">
              Most expensive product
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lowest Cost</CardTitle>
            <IconTrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(lowestCost)}</div>
            <p className="text-xs text-muted-foreground">
              Most affordable product
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedFormula} onValueChange={setSelectedFormula}>
                <SelectTrigger>
                  <SelectValue placeholder="All Formulas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formulas</SelectItem>
                  {formulas.map((formula) => (
                    <SelectItem key={formula.id} value={formula.id}>
                      {formula.name} (v{formula.version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchCalculations}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* COGS Calculations Table */}
      <Card>
        <CardHeader>
          <CardTitle>COGS Calculations</CardTitle>
          <CardDescription>
            Cost breakdowns for your product formulas
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
              <Button onClick={fetchCalculations}>Retry</Button>
            </div>
          ) : calculations.length === 0 ? (
            <div className="text-center py-10">
              <IconCalculator className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No COGS calculations found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedFormula
                  ? "No calculations found for this formula"
                  : "Get started by calculating COGS for your formulas"}
              </p>
              <Button onClick={() => setIsCalculateDialogOpen(true)}>
                <IconCalculator className="mr-2 h-4 w-4" />
                Calculate COGS
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Formula
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Total Cost
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Cost/Unit
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Material Cost
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Other Costs
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Calculated
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.map((calculation) => (
                    <tr key={calculation.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">
                        <div>
                          <div className="font-medium">{calculation.formulaVersion.formula.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Version {calculation.formulaVersion.version} ({calculation.formulaVersion.name})
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="font-bold">
                          {formatCurrency(parseFloat(calculation.totalCost))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(parseFloat(calculation.costPerGram))}/g
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        {parseFloat(calculation.unitWeight).toFixed(1)}g
                      </td>
                      <td className="p-4 align-middle">
                        {formatCurrency(parseFloat(calculation.materialCost))}
                        <div className="text-sm text-muted-foreground">
                          {((parseFloat(calculation.materialCost) / parseFloat(calculation.totalCost)) * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        {formatCurrency(
                          parseFloat(calculation.packagingCost) +
                          parseFloat(calculation.labelCost) +
                          parseFloat(calculation.laborCost) +
                          parseFloat(calculation.overheadCost)
                        )}
                        <div className="text-sm text-muted-foreground">
                          Packaging, labels, labor, overhead
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        {new Date(calculation.calculationDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 align-middle">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewCalculation(calculation)}
                        >
                          <IconEye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Calculation Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>COGS Breakdown</DialogTitle>
            <DialogDescription>
              Detailed cost breakdown for {selectedCalculation?.formulaVersion.formula.name}
            </DialogDescription>
          </DialogHeader>
          {selectedCalculation && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="breakdown">Material Breakdown</TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Total Cost per Unit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(parseFloat(selectedCalculation.totalCost))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(parseFloat(selectedCalculation.costPerGram))} per gram
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Unit Weight</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {parseFloat(selectedCalculation.unitWeight).toFixed(1)}g
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedCalculation.formulaVersion.name}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Material Costs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(parseFloat(selectedCalculation.materialCost))}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${(parseFloat(selectedCalculation.materialCost) / parseFloat(selectedCalculation.totalCost)) * 100}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((parseFloat(selectedCalculation.materialCost) / parseFloat(selectedCalculation.totalCost)) * 100).toFixed(1)}% of total cost
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Other Costs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Packaging:</span>
                          <span className="font-medium">{formatCurrency(parseFloat(selectedCalculation.packagingCost))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Labels:</span>
                          <span className="font-medium">{formatCurrency(parseFloat(selectedCalculation.labelCost))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Labor:</span>
                          <span className="font-medium">{formatCurrency(parseFloat(selectedCalculation.laborCost))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Overhead:</span>
                          <span className="font-medium">{formatCurrency(parseFloat(selectedCalculation.overheadCost))}</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between font-medium">
                            <span>Total:</span>
                            <span className="text-blue-600">
                              {formatCurrency(
                                parseFloat(selectedCalculation.packagingCost) +
                                parseFloat(selectedCalculation.labelCost) +
                                parseFloat(selectedCalculation.laborCost) +
                                parseFloat(selectedCalculation.overheadCost)
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Calculated on: {new Date(selectedCalculation.calculationDate).toLocaleDateString()} at {new Date(selectedCalculation.calculationDate).toLocaleTimeString()}</p>
                  {selectedCalculation.isActive ? (
                    <Badge className="mt-1">Active Calculation</Badge>
                  ) : (
                    <Badge variant="outline" className="mt-1">Historical Calculation</Badge>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="breakdown" className="space-y-4">
                {costBreakdown.length === 0 ? (
                  <p className="text-muted-foreground">No material breakdown available</p>
                ) : (
                  <div className="space-y-3">
                    {costBreakdown.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{item.material.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {item.material.code} • {item.material.unit}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">
                                {formatCurrency(parseFloat(item.costPerUnit))}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {parseFloat(item.percentage).toFixed(1)}% • {parseFloat(item.weightPerUnit).toFixed(2)}g
                              </div>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm">
                              <span>Cost at time:</span>
                              <span>{formatCurrency(parseFloat(item.materialCostAtTime))}/{item.material.unit}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Card className="border-2">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold">Total Material Cost</h4>
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(parseFloat(selectedCalculation.materialCost))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}