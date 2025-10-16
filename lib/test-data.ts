import { supabase } from '@/lib/supabase'

// Function to create test categories
export async function createTestCategories() {
  const categories = [
    { name: 'Essential Oils', description: 'Pure essential oils for aromatherapy and formulations', codePrefix: 'OIL' },
    { name: 'Base Oils', description: 'Carrier oils for diluting essential oils', codePrefix: 'BASE' },
    { name: 'Waxes', description: 'Natural waxes for balms and salves', codePrefix: 'WAX' },
    { name: 'Butters', description: 'Natural butters for creams and lotions', codePrefix: 'BUT' },
    { name: 'Actives', description: 'Active ingredients for specialized formulations', codePrefix: 'ACT' },
  ]

  for (const category of categories) {
    const { error } = await supabase
      .from('categories')
      .upsert({
        name: category.name,
        description: category.description,
        codePrefix: category.codePrefix,
        isActive: true,
      }, {
        onConflict: 'name'
      })

    if (error) {
      console.error('Error creating category:', category.name, error)
    } else {
      console.log('Created/updated category:', category.name)
    }
  }
}

// Function to create test materials
export async function createTestMaterials() {
  const materials = [
    {
      name: 'Lavender Essential Oil',
      description: 'Pure lavender essential oil, calming and relaxing',
      categoryId: null, // Will be set after fetching categories
      supplier: 'Essential Oil Co',
      supplierCode: 'LAV-001',
      cost: 150000,
      purchaseUnit: '10ml',
      purchaseQuantity: 10,
      unit: 'ml',
      currency: 'IDR',
      currentStock: 100,
      minStockLevel: 20,
      reorderPoint: 30,
      notes: 'Therapeutic grade'
    },
    {
      name: 'Coconut Oil',
      description: 'Virgin coconut oil, excellent carrier oil',
      categoryId: null,
      supplier: 'Tropical Oils Ltd',
      supplierCode: 'COC-002',
      cost: 75000,
      purchaseUnit: '1kg',
      purchaseQuantity: 1,
      unit: 'g',
      currency: 'IDR',
      currentStock: 500,
      minStockLevel: 100,
      reorderPoint: 150,
      notes: 'Cold pressed, organic'
    }
  ]

  // First get the categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, codePrefix')

  if (!categories || categories.length === 0) {
    console.error('No categories found. Please create categories first.')
    return
  }

  // Map materials to categories
  const materialsWithCategories = materials.map(material => {
    const category = categories.find(cat =>
      material.name.toLowerCase().includes('oil') && cat.codePrefix === 'OIL' ||
      material.name.toLowerCase().includes('coconut') && cat.codePrefix === 'BASE'
    )

    return {
      ...material,
      categoryId: category?.id || categories[0].id // Fallback to first category
    }
  })

  for (const material of materialsWithCategories) {
    const { error } = await supabase
      .from('materials')
      .upsert({
        name: material.name,
        description: material.description,
        categoryId: material.categoryId,
        supplier: material.supplier,
        supplierCode: material.supplierCode,
        cost: material.cost,
        purchaseUnit: material.purchaseUnit,
        purchaseQuantity: material.purchaseQuantity,
        costPerUnit: (material.cost / material.purchaseQuantity).toFixed(2),
        unit: material.unit,
        currency: material.currency,
        currentStock: material.currentStock,
        minStockLevel: material.minStockLevel,
        reorderPoint: material.reorderPoint,
        isActive: true,
        notes: material.notes,
      }, {
        onConflict: 'name'
      })

    if (error) {
      console.error('Error creating material:', material.name, error)
    } else {
      console.log('Created/updated material:', material.name)
    }
  }
}

// Function to initialize test data
export async function initializeTestData() {
  console.log('Initializing test data...')
  await createTestCategories()
  await new Promise(resolve => setTimeout(resolve, 1000)) // Wait a bit for categories to be created
  await createTestMaterials()
  console.log('Test data initialization complete!')
}