#!/usr/bin/env node

/**
 * Script to add sample design templates to the database
 * Run with: node scripts/add-sample-templates.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const sampleTemplates = [
  {
    name: 'Happy Birthday Celebration',
    category: 'birthday',
    description: 'Festive birthday design with balloons and cake elements',
    layer_data: [
      {
        id: 'text-1',
        type: 'text',
        text: 'Happy Birthday!',
        x: 25,
        y: 20,
        width: 50,
        height: 15,
        fontSize: 32,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        color: '#ff4081',
        textAlign: 'center'
      },
      {
        id: 'text-2',
        type: 'text',
        text: '[Name]',
        x: 25,
        y: 40,
        width: 50,
        height: 10,
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#333333',
        textAlign: 'center'
      },
      {
        id: 'text-3',
        type: 'text',
        text: '🎂🎉🎈',
        x: 25,
        y: 60,
        width: 50,
        height: 15,
        fontSize: 40,
        fontFamily: 'Arial',
        textAlign: 'center'
      }
    ],
    product_types: ['mug', 'poster', 't-shirt'],
    display_order: 1
  },
  {
    name: 'Team Spirit Champions',
    category: 'team-spirit',
    description: 'Bold team design perfect for sports teams and groups',
    layer_data: [
      {
        id: 'text-1',
        type: 'text',
        text: 'TEAM',
        x: 25,
        y: 25,
        width: 50,
        height: 12,
        fontSize: 36,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        color: '#1976d2',
        textAlign: 'center'
      },
      {
        id: 'text-2',
        type: 'text',
        text: 'CHAMPIONS',
        x: 25,
        y: 40,
        width: 50,
        height: 12,
        fontSize: 36,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        color: '#ff5722',
        textAlign: 'center'
      },
      {
        id: 'text-3',
        type: 'text',
        text: '🏆',
        x: 40,
        y: 55,
        width: 20,
        height: 15,
        fontSize: 48,
        fontFamily: 'Arial',
        textAlign: 'center'
      }
    ],
    product_types: ['t-shirt', 'mug', 'poster'],
    display_order: 2
  },
  {
    name: 'Professional Business Logo',
    category: 'business',
    description: 'Clean, professional layout perfect for business branding',
    layer_data: [
      {
        id: 'text-1',
        type: 'text',
        text: 'Your Company',
        x: 25,
        y: 30,
        width: 50,
        height: 10,
        fontSize: 28,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center'
      },
      {
        id: 'text-2',
        type: 'text',
        text: 'Excellence in Service',
        x: 25,
        y: 45,
        width: 50,
        height: 8,
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#7f8c8d',
        textAlign: 'center'
      }
    ],
    product_types: ['mug', 'poster', 'canvas'],
    display_order: 3
  },
  {
    name: 'In Loving Memory',
    category: 'memorial',
    description: 'Gentle, respectful design for memorial purposes',
    layer_data: [
      {
        id: 'text-1',
        type: 'text',
        text: 'In Loving Memory',
        x: 25,
        y: 25,
        width: 50,
        height: 10,
        fontSize: 24,
        fontFamily: 'serif',
        fontWeight: 'normal',
        color: '#5d4037',
        textAlign: 'center'
      },
      {
        id: 'text-2',
        type: 'text',
        text: '[Name]',
        x: 25,
        y: 40,
        width: 50,
        height: 12,
        fontSize: 28,
        fontFamily: 'serif',
        fontWeight: 'bold',
        color: '#3e2723',
        textAlign: 'center'
      },
      {
        id: 'text-3',
        type: 'text',
        text: '💐',
        x: 40,
        y: 55,
        width: 20,
        height: 15,
        fontSize: 32,
        fontFamily: 'Arial',
        textAlign: 'center'
      }
    ],
    product_types: ['canvas', 'poster'],
    display_order: 4
  },
  {
    name: 'Holiday Celebration',
    category: 'holiday',
    description: 'Festive holiday design with seasonal elements',
    layer_data: [
      {
        id: 'text-1',
        type: 'text',
        text: 'Happy Holidays!',
        x: 25,
        y: 25,
        width: 50,
        height: 12,
        fontSize: 30,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        color: '#c62828',
        textAlign: 'center'
      },
      {
        id: 'text-2',
        type: 'text',
        text: '🎄✨🎁',
        x: 25,
        y: 45,
        width: 50,
        height: 15,
        fontSize: 36,
        fontFamily: 'Arial',
        textAlign: 'center'
      },
      {
        id: 'text-3',
        type: 'text',
        text: 'Wishing you joy!',
        x: 25,
        y: 65,
        width: 50,
        height: 8,
        fontSize: 18,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#2e7d32',
        textAlign: 'center'
      }
    ],
    product_types: ['mug', 't-shirt', 'poster'],
    display_order: 5
  }
]

async function addSampleTemplates() {
  console.log('🎨 Adding sample design templates...')
  
  try {
    // Check if templates already exist
    const { data: existingTemplates } = await supabase
      .from('design_templates')
      .select('name')
    
    const existingNames = existingTemplates?.map(t => t.name) || []
    const templatesToAdd = sampleTemplates.filter(t => !existingNames.includes(t.name))
    
    if (templatesToAdd.length === 0) {
      console.log('✅ All sample templates already exist')
      return
    }
    
    const { data, error } = await supabase
      .from('design_templates')
      .insert(templatesToAdd.map(template => ({
        ...template,
        thumbnail_url: null, // Could add actual thumbnail URLs here
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })))
      .select()
    
    if (error) {
      throw error
    }
    
    console.log(`✅ Successfully added ${data.length} sample templates:`)
    data.forEach(template => {
      console.log(`   - ${template.name} (${template.category})`)
    })
    
  } catch (error) {
    console.error('❌ Error adding sample templates:', error.message)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  addSampleTemplates().then(() => {
    console.log('🎉 Sample templates setup complete!')
    process.exit(0)
  })
}

module.exports = { addSampleTemplates }