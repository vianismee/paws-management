// Run this script with: node scripts/init-test-data.js
// Make sure to set your Supabase environment variables first

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestCategories() {
  const categories = [
    { name: 'Essential Oils', description: 'Pure essential oils for aromatherapy and formulations', codePrefix: 'OIL' },
    { name: 'Base Oils', description: 'Carrier oils for diluting essential oils', codePrefix: 'BASE' },
    { name: 'Waxes', description: 'Natural waxes for balms and salves', codePrefix: 'WAX' },
    { name: 'Butters', description: 'Natural butters for creams and lotions', codePrefix: 'BUT' },
    { name: 'Actives', description: 'Active ingredients for specialized formulations', codePrefix: 'ACT' },
  ]

  console.log('Creating test categories...')
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
      console.log('✓ Created/updated category:', category.name)
    }
  }
}

async function main() {
  console.log('🚀 Initializing test data...')
  try {
    await createTestCategories()
    console.log('✅ Test data initialization complete!')
  } catch (error) {
    console.error('❌ Error initializing test data:', error)
    process.exit(1)
  }
}

main()