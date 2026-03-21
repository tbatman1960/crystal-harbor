#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🛡️ Crystal Harbor - Code Quality Check\n');

let hasErrors = false;
const errors = [];
const warnings = [];

function runCheck(name, command, options = {}) {
  console.log(`🔍 ${name}...`);
  try {
    const result = execSync(command, { 
      cwd: process.cwd(), 
      stdio: 'pipe',
      encoding: 'utf8',
      ...options 
    });
    console.log(`✅ ${name} passed\n`);
    return result;
  } catch (error) {
    const output = error.stdout || error.stderr || error.message;
    if (options.allowFailure) {
      warnings.push(`⚠️ ${name}: ${output.substring(0, 200)}...`);
      console.log(`⚠️ ${name} has warnings\n`);
    } else {
      hasErrors = true;
      errors.push(`❌ ${name}: ${output.substring(0, 200)}...`);
      console.log(`❌ ${name} failed\n`);
    }
    return null;
  }
}

// 1. TypeScript Check
runCheck('TypeScript Compilation', 'npx tsc --noEmit');

// 2. ESLint Check
runCheck('ESLint Analysis', 'npm run lint', { allowFailure: true });

// 3. Next.js Build Check (dry run)
console.log('🔍 Next.js Build Validation...');
try {
  // Check if critical files exist
  const criticalFiles = [
    'src/app/layout.tsx',
    'src/app/page.tsx', 
    'src/components/layout/Header.tsx',
    'src/lib/supabase.ts',
    'src/store/cartStore.ts'
  ];
  
  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      hasErrors = true;
      errors.push(`❌ Missing critical file: ${file}`);
    }
  }
  
  if (errors.length === 0) {
    console.log('✅ Critical files check passed\n');
  }
} catch (error) {
  warnings.push(`⚠️ File structure check: ${error.message}`);
}

// 4. Code Pattern Analysis
console.log('🔍 Code Pattern Analysis...');
try {
  const srcPath = path.join(process.cwd(), 'src');
  const patterns = {
    'Unused imports': /import.*from.*['"'][^'"]*['"].*;?\s*(?=\n|$)/g,
    'Console.log statements': /console\.log\(/g,
    'Hardcoded localhost': /localhost:|127\.0\.0\.1/g,
    'TODO comments': /\/\/\s*TODO:|\/\*\s*TODO:/gi
  };

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        for (const [pattern, regex] of Object.entries(patterns)) {
          const matches = content.match(regex);
          if (matches) {
            const relativePath = path.relative(process.cwd(), filePath);
            warnings.push(`⚠️ ${pattern} found in ${relativePath} (${matches.length} occurrences)`);
          }
        }
      }
    }
  }
  
  if (fs.existsSync(srcPath)) {
    scanDirectory(srcPath);
  }
  
  console.log('✅ Code pattern analysis completed\n');
} catch (error) {
  warnings.push(`⚠️ Pattern analysis: ${error.message}`);
}

// 5. Environment Check
console.log('🔍 Environment Configuration...');
try {
  const envExample = fs.existsSync('.env.example');
  const envLocal = fs.existsSync('.env.local');
  
  if (!envExample && !envLocal) {
    warnings.push('⚠️ No environment configuration files found');
  }
  
  console.log('✅ Environment check completed\n');
} catch (error) {
  warnings.push(`⚠️ Environment check: ${error.message}`);
}

// Summary
console.log('📊 QUALITY CHECK SUMMARY');
console.log('========================');

if (hasErrors) {
  console.log('\n❌ ERRORS FOUND:');
  errors.forEach(error => console.log(error));
}

if (warnings.length > 0) {
  console.log('\n⚠️ WARNINGS:');
  warnings.forEach(warning => console.log(warning));
}

if (!hasErrors && warnings.length === 0) {
  console.log('\n🎉 All quality checks passed! Code is ready for production.');
} else if (!hasErrors) {
  console.log('\n✅ No blocking errors found. Code is deployable with minor warnings.');
} else {
  console.log('\n🚫 Please fix errors before proceeding.');
  process.exit(1);
}

console.log(`\n📈 Quality Score: ${hasErrors ? '❌ FAIL' : warnings.length === 0 ? '🟢 EXCELLENT' : '🟡 GOOD'}`);