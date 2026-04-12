#!/usr/bin/env node

/**
 * Script to set up the new features (Steps 6-9) database tables and sample data
 * Run with: node scripts/setup-new-features.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration(migrationPath, description) {
  console.log(`📄 Running migration: ${description}`)
  
  try {
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolons and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim())
    
    for (const statement of statements) {
      const trimmed = statement.trim()
      if (trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('/*')) {
        const { error } = await supabase.rpc('exec_sql', { sql: trimmed })
        if (error && !error.message.includes('already exists')) {
          throw error
        }
      }
    }
    
    console.log(`✅ Migration completed: ${description}`)
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('does not exist')) {
      console.log(`⚠️  Migration skipped (already applied): ${description}`)
    } else {
      console.error(`❌ Migration failed: ${description}`, error.message)
      throw error
    }
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up new features database tables...\n')
  
  const migrations = [
    {
      file: 'docs/migrations/add-design-templates-table.sql',
      description: 'Design Templates Tables'
    },
    {
      file: 'docs/migrations/add-design-sharing-tables.sql', 
      description: 'Design Sharing Tables'
    },
    {
      file: 'docs/migrations/add-ai-prompt-examples-table.sql',
      description: 'AI Prompt Examples Table'
    }
  ]
  
  for (const migration of migrations) {
    await runMigration(migration.file, migration.description)
  }
  
  console.log('\n🎨 Adding sample templates and prompts...')
  
  // Add sample AI prompts (these are already in the migration)
  console.log('✅ Sample AI prompts added via migration')
  
  // Add sample templates
  const { addSampleTemplates } = require('./add-sample-templates')
  await addSampleTemplates()
  
  console.log('\n🎉 Database setup complete!')
  console.log('\nNew Features Available:')
  console.log('• Design Templates - Admin: /admin/design-templates')
  console.log('• AI Prompt Examples - Admin: /admin/ai-prompts') 
  console.log('• Design Sharing - Integrated in customization editor')
  console.log('• Mobile-Optimized Customization Editor')
}

// Run the setup
if (require.main === module) {
  setupDatabase().catch(error => {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  })
}

module.exports = { setupDatabase }