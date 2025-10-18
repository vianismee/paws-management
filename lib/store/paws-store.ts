import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  Material,
  Category,
  Packaging,
  Label,
  Formula,
  FormulaVersion,
  ProductionBatch,
  CogsCalculation,
  PricingRule
} from '../client-db-client';

// Types
export interface MaterialWithCategory extends Material {
  category: Category | null;
}

export interface FormulaIngredientWithMaterial {
  id: string;
  materialId: string;
  formulaVersionId: string;
  percentage: string;
  weight: string;
  notes: string | null;
  createdAt: Date;
  material: MaterialWithCategory;
}

export interface FormulaVersionWithIngredients extends FormulaVersion {
  ingredients: FormulaIngredientWithMaterial[];
}

export interface ProductionBatchWithDetails extends ProductionBatch {
  formulaVersion: {
    id: string;
    version: number;
    name: string;
    formula: {
      id: string;
      name: string;
    } | null;
  } | null;
}

// Loading states
export interface LoadingStates {
  materials: boolean;
  categories: boolean;
  packaging: boolean;
  labels: boolean;
  formulas: boolean;
  formulaVersions: boolean;
  productionBatches: boolean;
  cogsCalculations: boolean;
  pricingRules: boolean;
}

// Error states
export interface ErrorStates {
  materials: string | null;
  categories: string | null;
  packaging: string | null;
  labels: string | null;
  formulas: string | null;
  formulaVersions: string | null;
  productionBatches: string | null;
  cogsCalculations: string | null;
  pricingRules: string | null;
}

// Store interface
interface PAWStore {
  // Data
  materials: MaterialWithCategory[];
  categories: Category[];
  packaging: Packaging[];
  labels: Label[];
  formulas: Formula[];
  formulaVersions: FormulaVersionWithIngredients[];
  productionBatches: ProductionBatchWithDetails[];
  cogsCalculations: CogsCalculation[];
  pricingRules: PricingRule[];

  // UI State
  loading: LoadingStates;
  errors: ErrorStates;

  // Pagination
  pagination: {
    materials: { page: number; limit: number; total: number };
    packaging: { page: number; limit: number; total: number };
    labels: { page: number; limit: number; total: number };
    formulas: { page: number; limit: number; total: number };
    productionBatches: { page: number; limit: number; total: number };
  };

  // Filters
  filters: {
    materials: { search: string; categoryId: string | null };
    formulas: { search: string; status: 'draft' | 'active' | 'archived' | null };
    productionBatches: { formulaId: string | null; status: 'planned' | 'in_progress' | 'completed' | 'failed' | null };
  };

  // Selected items
  selectedFormula: Formula | null;
  selectedFormulaVersion: FormulaVersionWithIngredients | null;
  selectedMaterial: MaterialWithCategory | null;

  // Actions
  // Inventory
  fetchCategories: () => Promise<void>;
  fetchMaterials: (page?: number, filters?: { search?: string; categoryId?: string }) => Promise<void>;
  fetchPackaging: (page?: number, search?: string) => Promise<void>;
  fetchLabels: (page?: number, search?: string) => Promise<void>;
  createMaterial: (data: Omit<Material, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'category'>) => Promise<MaterialWithCategory | null>;
  updateMaterial: (id: string, data: Partial<Material>) => Promise<MaterialWithCategory | null>;
  deleteMaterial: (id: string) => Promise<boolean>;
  createCategory: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Category | null>;
  createPackaging: (data: Omit<Packaging, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Promise<Packaging | null>;
  createLabel: (data: Omit<Label, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Promise<Label | null>;

  // Formulas
  fetchFormulas: (page?: number, filters?: { search?: string; status?: 'draft' | 'active' | 'archived' }) => Promise<void>;
  fetchFormulaVersions: (formulaId: string) => Promise<void>;
  createFormula: (data: Omit<Formula, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => Promise<Formula | null>;
  updateFormula: (id: string, data: Partial<Formula>) => Promise<Formula | null>;
  createFormulaVersion: (formulaId: string, data: Omit<FormulaVersion, 'id' | 'formulaId' | 'createdAt'>) => Promise<FormulaVersion | null>;
  updateFormulaIngredients: (versionId: string, ingredients: Array<{ materialId: string; percentage: number; weight: number; notes?: string }>) => Promise<boolean>;
  getFormulaVersionWithIngredients: (versionId: string) => Promise<FormulaVersionWithIngredients | null>;

  // Production
  fetchProductionBatches: (page?: number, filters?: { formulaId?: string; status?: 'planned' | 'in_progress' | 'completed' | 'failed' }) => Promise<void>;
  createProductionBatch: (data: Omit<ProductionBatch, 'id' | 'batchNumber' | 'createdAt' | 'updatedAt' | 'formulaVersion'>) => Promise<ProductionBatch | null>;

  // COGS
  fetchCOGSCalculations: (formulaVersionId?: string) => Promise<void>;
  calculateCOGS: (formulaVersionId: string, options?: { laborCostPerUnit?: number; overheadPercentage?: number; packagingId?: string; labelId?: string }) => Promise<any>;
  saveCOGSCalculation: (formulaVersionId: string, cogs: any, breakdowns: any[]) => Promise<CogsCalculation | null>;

  // Pricing
  fetchPricingRules: () => Promise<void>;
  createPricingRule: (data: Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PricingRule | null>;

  // UI Actions
  setSelectedFormula: (formula: Formula | null) => void;
  setSelectedFormulaVersion: (version: FormulaVersionWithIngredients | null) => void;
  setSelectedMaterial: (material: MaterialWithCategory | null) => void;
  clearErrors: () => void;
  resetStore: () => void;

  // Filter actions
  setMaterialsFilter: (filters: { search?: string; categoryId?: string }) => void;
  setFormulasFilter: (filters: { search?: string; status?: 'draft' | 'active' | 'archived' }) => void;
  setProductionBatchesFilter: (filters: { formulaId?: string; status?: 'planned' | 'in_progress' | 'completed' | 'failed' }) => void;
}

const initialState = {
  // Data
  materials: [],
  categories: [],
  packaging: [],
  labels: [],
  formulas: [],
  formulaVersions: [],
  productionBatches: [],
  cogsCalculations: [],
  pricingRules: [],

  // UI State
  loading: {
    materials: false,
    categories: false,
    packaging: false,
    labels: false,
    formulas: false,
    formulaVersions: false,
    productionBatches: false,
    cogsCalculations: false,
    pricingRules: false,
  },
  errors: {
    materials: null,
    categories: null,
    packaging: null,
    labels: null,
    formulas: null,
    formulaVersions: null,
    productionBatches: null,
    cogsCalculations: null,
    pricingRules: null,
  },

  // Pagination
  pagination: {
    materials: { page: 1, limit: 50, total: 0 },
    packaging: { page: 1, limit: 50, total: 0 },
    labels: { page: 1, limit: 50, total: 0 },
    formulas: { page: 1, limit: 50, total: 0 },
    productionBatches: { page: 1, limit: 50, total: 0 },
  },

  // Filters
  filters: {
    materials: { search: '', categoryId: null },
    formulas: { search: '', status: null },
    productionBatches: { formulaId: null, status: null },
  },

  // Selected items
  selectedFormula: null,
  selectedFormulaVersion: null,
  selectedMaterial: null,
};

export const usePAWStore = create<PAWStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Inventory Actions
      fetchCategories: async () => {
        set((state) => ({ loading: { ...state.loading, categories: true } }));
        try {
          const { getCategories } = await import('../business-logic/inventory');
          const categories = await getCategories();
          set((state) => ({ categories, loading: { ...state.loading, categories: false }, errors: { ...state.errors, categories: null } }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, categories: false },
            errors: { ...state.errors, categories: error instanceof Error ? error.message : 'Failed to fetch categories' }
          }));
        }
      },

      fetchMaterials: async (page = 1, filters) => {
        set((state) => ({ loading: { ...state.loading, materials: true } }));
        try {
          const { getMaterials } = await import('../business-logic/inventory');
          const currentFilters = get().filters.materials;
          const mergedFilters = { ...currentFilters, ...filters };
          const result = await getMaterials({ page, ...mergedFilters });
          set((state) => ({
            materials: result.materials,
            pagination: {
              ...state.pagination,
              materials: { ...state.pagination.materials, page, total: result.total }
            },
            filters: { ...state.filters, materials: mergedFilters },
            loading: { ...state.loading, materials: false },
            errors: { ...state.errors, materials: null }
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, materials: false },
            errors: { ...state.errors, materials: error instanceof Error ? error.message : 'Failed to fetch materials' }
          }));
        }
      },

      fetchPackaging: async (page = 1, search) => {
        set((state) => ({ loading: { ...state.loading, packaging: true } }));
        try {
          const { getPackaging } = await import('../business-logic/inventory');
          const result = await getPackaging({ page, search });
          set((state) => ({
            packaging: result.packaging,
            pagination: {
              ...state.pagination,
              packaging: { ...state.pagination.packaging, page, total: result.total }
            },
            loading: { ...state.loading, packaging: false },
            errors: { ...state.errors, packaging: null }
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, packaging: false },
            errors: { ...state.errors, packaging: error instanceof Error ? error.message : 'Failed to fetch packaging' }
          }));
        }
      },

      fetchLabels: async (page = 1, search) => {
        set((state) => ({ loading: { ...state.loading, labels: true } }));
        try {
          const { getLabels } = await import('../business-logic/inventory');
          const result = await getLabels({ page, search });
          set((state) => ({
            labels: result.labels,
            pagination: {
              ...state.pagination,
              labels: { ...state.pagination.labels, page, total: result.total }
            },
            loading: { ...state.loading, labels: false },
            errors: { ...state.errors, labels: null }
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, labels: false },
            errors: { ...state.errors, labels: error instanceof Error ? error.message : 'Failed to fetch labels' }
          }));
        }
      },

      createMaterial: async (data) => {
        try {
          const { createMaterial } = await import('../business-logic/inventory');
          const material = await createMaterial(data);
          if (material) {
            // Refresh materials list
            get().fetchMaterials(get().pagination.materials.page);
            return material;
          }
          return null;
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, materials: error instanceof Error ? error.message : 'Failed to create material' }
          }));
          return null;
        }
      },

      updateMaterial: async (id, data) => {
        try {
          const { updateMaterial } = await import('../business-logic/inventory');
          const material = await updateMaterial(id, data);
          if (material) {
            // Refresh materials list
            get().fetchMaterials(get().pagination.materials.page);
            return material;
          }
          return null;
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, materials: error instanceof Error ? error.message : 'Failed to update material' }
          }));
          return null;
        }
      },

      deleteMaterial: async (id) => {
        try {
          const { deleteMaterial } = await import('../business-logic/inventory');
          const success = await deleteMaterial(id);
          if (success) {
            // Refresh materials list
            get().fetchMaterials(get().pagination.materials.page);
          }
          return success;
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, materials: error instanceof Error ? error.message : 'Failed to delete material' }
          }));
          return false;
        }
      },

      createCategory: async (data) => {
        try {
          const { createCategory } = await import('../business-logic/inventory');
          const category = await createCategory(data);
          if (category) {
            get().fetchCategories();
            return category;
          }
          return null;
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, categories: error instanceof Error ? error.message : 'Failed to create category' }
          }));
          return null;
        }
      },

      createPackaging: async (data) => {
        try {
          const { createPackaging } = await import('../business-logic/inventory');
          const packaging = await createPackaging(data);
          if (packaging) {
            get().fetchPackaging(get().pagination.packaging.page);
            return packaging;
          }
          return null;
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, packaging: error instanceof Error ? error.message : 'Failed to create packaging' }
          }));
          return null;
        }
      },

      createLabel: async (data) => {
        try {
          const { createLabel } = await import('../business-logic/inventory');
          const label = await createLabel(data);
          if (label) {
            get().fetchLabels(get().pagination.labels.page);
            return label;
          }
          return null;
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, labels: error instanceof Error ? error.message : 'Failed to create label' }
          }));
          return null;
        }
      },

      // Formula Actions
      fetchFormulas: async (page = 1, filters) => {
        set((state) => ({ loading: { ...state.loading, formulas: true } }));
        try {
          const { getFormulas } = await import('../business-logic/formulas');
          const currentFilters = get().filters.formulas;
          const mergedFilters = { ...currentFilters, ...filters };
          const result = await getFormulas({ page, ...mergedFilters });
          set((state) => ({
            formulas: result.formulas,
            pagination: {
              ...state.pagination,
              formulas: { ...state.pagination.formulas, page, total: result.total }
            },
            filters: { ...state.filters, formulas: mergedFilters },
            loading: { ...state.loading, formulas: false },
            errors: { ...state.errors, formulas: null }
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, formulas: false },
            errors: { ...state.errors, formulas: error instanceof Error ? error.message : 'Failed to fetch formulas' }
          }));
        }
      },

      fetchFormulaVersions: async (formulaId) => {
        set((state) => ({ loading: { ...state.loading, formulaVersions: true } }));
        try {
          const { getFormulaVersions } = await import('../business-logic/formulas');
          const versions = await getFormulaVersions(formulaId);

          // Fetch ingredients for each version
          const { getFormulaVersionWithIngredients } = await import('../business-logic/formulas');
          const versionsWithIngredients = await Promise.all(
            versions.map(async (version) => {
              const result = await getFormulaVersionWithIngredients(version.id);
              return result.version ? { ...result.version, ingredients: result.ingredients } : null;
            })
          );

          set((state) => ({
            formulaVersions: versionsWithIngredients.filter(Boolean) as FormulaVersionWithIngredients[],
            loading: { ...state.loading, formulaVersions: false },
            errors: { ...state.errors, formulaVersions: null }
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, formulaVersions: false },
            errors: { ...state.errors, formulaVersions: error instanceof Error ? error.message : 'Failed to fetch formula versions' }
          }));
        }
      },

      createFormula: async (data) => {
        try {
          const { createFormula } = await import('../business-logic/formulas');
          const formula = await createFormula(data);
          if (formula) {
            get().fetchFormulas(get().pagination.formulas.page);
            return formula;
          }
          return null;
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, formulas: error instanceof Error ? error.message : 'Failed to create formula' }
          }));
          return null;
        }
      },

      updateFormula: async (id, data) => {
        try {
          const { updateFormula } = await import('../business-logic/formulas');
          const formula = await updateFormula(id, data);
          if (formula) {
            get().fetchFormulas(get().pagination.formulas.page);
            return formula;
          }
          return null;
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, formulas: error instanceof Error ? error.message : 'Failed to update formula' }
          }));
          return null;
        }
      },

      createFormulaVersion: async (formulaId, data) => {
        try {
          const { createFormulaVersion } = await import('../business-logic/formulas');
          const version = await createFormulaVersion(formulaId, data);
          if (version) {
            get().fetchFormulaVersions(formulaId);
            return version;
          }
          return null;
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, formulaVersions: error instanceof Error ? error.message : 'Failed to create formula version' }
          }));
          return null;
        }
      },

      updateFormulaIngredients: async (versionId, ingredients) => {
        try {
          const { updateFormulaIngredients, validateFormulaPercentages } = await import('../business-logic/formulas');

          // Validate percentages
          const validation = await validateFormulaPercentages(ingredients);
          if (!validation.isValid) {
            throw new Error(validation.error);
          }

          const success = await updateFormulaIngredients(versionId, ingredients);
          if (success) {
            get().fetchFormulaVersions(versionId); // This will need to be adjusted to fetch by formulaId
            return true;
          }
          return false;
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, formulaVersions: error instanceof Error ? error.message : 'Failed to update formula ingredients' }
          }));
          return false;
        }
      },

      getFormulaVersionWithIngredients: async (versionId) => {
        try {
          const { getFormulaVersionWithIngredients } = await import('../business-logic/formulas');
          const result = await getFormulaVersionWithIngredients(versionId);
          return result.version ? { ...result.version, ingredients: result.ingredients } : null;
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, formulaVersions: error instanceof Error ? error.message : 'Failed to fetch formula version' }
          }));
          return null;
        }
      },

      // Production Actions
      fetchProductionBatches: async (page = 1, filters) => {
        set((state) => ({ loading: { ...state.loading, productionBatches: true } }));
        try {
          const { getProductionBatches } = await import('../business-logic/formulas');
          const currentFilters = get().filters.productionBatches;
          const mergedFilters = { ...currentFilters, ...filters };
          const result = await getProductionBatches({ page, ...mergedFilters });
          set((state) => ({
            productionBatches: result.batches,
            pagination: {
              ...state.pagination,
              productionBatches: { ...state.pagination.productionBatches, page, total: result.total }
            },
            filters: { ...state.filters, productionBatches: mergedFilters },
            loading: { ...state.loading, productionBatches: false },
            errors: { ...state.errors, productionBatches: null }
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, productionBatches: false },
            errors: { ...state.errors, productionBatches: error instanceof Error ? error.message : 'Failed to fetch production batches' }
          }));
        }
      },

      createProductionBatch: async (data) => {
        try {
          const { createProductionBatch } = await import('../business-logic/formulas');
          const batch = await createProductionBatch(data);
          if (batch) {
            get().fetchProductionBatches(get().pagination.productionBatches.page);
            return batch;
          }
          return null;
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, productionBatches: error instanceof Error ? error.message : 'Failed to create production batch' }
          }));
          return null;
        }
      },

      // COGS Actions
      fetchCOGSCalculations: async (formulaVersionId) => {
        set((state) => ({ loading: { ...state.loading, cogsCalculations: true } }));
        try {
          const { getCOGSCalculations } = await import('../business-logic/cogs');
          const calculations = await getCOGSCalculations(formulaVersionId);
          set((state) => ({
            cogsCalculations: calculations,
            loading: { ...state.loading, cogsCalculations: false },
            errors: { ...state.errors, cogsCalculations: null }
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, cogsCalculations: false },
            errors: { ...state.errors, cogsCalculations: error instanceof Error ? error.message : 'Failed to fetch COGS calculations' }
          }));
        }
      },

      calculateCOGS: async (formulaVersionId, options) => {
        try {
          const { calculateCOGS } = await import('../business-logic/cogs');
          const result = await calculateCOGS(formulaVersionId, options);
          return result;
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, cogsCalculations: error instanceof Error ? error.message : 'Failed to calculate COGS' }
          }));
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      },

      saveCOGSCalculation: async (formulaVersionId, cogs, breakdowns) => {
        try {
          const { saveCOGSCalculation } = await import('../business-logic/cogs');
          const calculation = await saveCOGSCalculation(formulaVersionId, cogs, breakdowns);
          if (calculation) {
            get().fetchCOGSCalculations(formulaVersionId);
            return calculation;
          }
          return null;
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, cogsCalculations: error instanceof Error ? error.message : 'Failed to save COGS calculation' }
          }));
          return null;
        }
      },

      // Pricing Actions
      fetchPricingRules: async () => {
        set((state) => ({ loading: { ...state.loading, pricingRules: true } }));
        try {
          const { getPricingRules } = await import('../business-logic/cogs');
          const rules = await getPricingRules();
          set((state) => ({
            pricingRules: rules,
            loading: { ...state.loading, pricingRules: false },
            errors: { ...state.errors, pricingRules: null }
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, pricingRules: false },
            errors: { ...state.errors, pricingRules: error instanceof Error ? error.message : 'Failed to fetch pricing rules' }
          }));
        }
      },

      createPricingRule: async (data) => {
        try {
          const { createPricingRule } = await import('../business-logic/cogs');
          const rule = await createPricingRule(data);
          if (rule) {
            get().fetchPricingRules();
            return rule;
          }
          return null;
        } catch (error) {
          set((state) => ({
            errors: { ...state.errors, pricingRules: error instanceof Error ? error.message : 'Failed to create pricing rule' }
          }));
          return null;
        }
      },

      // UI Actions
      setSelectedFormula: (formula) => set({ selectedFormula: formula }),
      setSelectedFormulaVersion: (version) => set({ selectedFormulaVersion: version }),
      setSelectedMaterial: (material) => set({ selectedMaterial: material }),
      clearErrors: () => set((state) => ({
        errors: {
          materials: null,
          categories: null,
          packaging: null,
          labels: null,
          formulas: null,
          formulaVersions: null,
          productionBatches: null,
          cogsCalculations: null,
          pricingRules: null,
        }
      })),

      resetStore: () => set(initialState),

      // Filter actions
      setMaterialsFilter: (filters) => {
        set((state) => ({
          filters: { ...state.filters, materials: { ...state.filters.materials, ...filters } }
        }));
        get().fetchMaterials(1, filters);
      },

      setFormulasFilter: (filters) => {
        set((state) => ({
          filters: { ...state.filters, formulas: { ...state.filters.formulas, ...filters } }
        }));
        get().fetchFormulas(1, filters);
      },

      setProductionBatchesFilter: (filters) => {
        set((state) => ({
          filters: { ...state.filters, productionBatches: { ...state.filters.productionBatches, ...filters } }
        }));
        get().fetchProductionBatches(1, filters);
      },
    }),
    {
      name: 'paw-store',
    }
  )
);