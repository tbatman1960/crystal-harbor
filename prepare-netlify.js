#!/usr/bin/env node

/**
 * Crystal Harbor - Netlify Deployment Preparation Script
 * This script helps prepare your local development site for Netlify deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Crystal Harbor - Netlify Deployment Preparation\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Please run this script from the project root directory');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.name !== 'crystal-harbor') {
  console.error('❌ Error: This script must be run from the Crystal Harbor project directory');
  process.exit(1);
}

console.log('✅ Found Crystal Harbor project');

// Check required files
const requiredFiles = [
  'netlify.toml',
  'next.config.js',
  '.env.netlify.example',
  '.gitignore'
];

let missingFiles = [];
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error(`\n❌ Missing required files: ${missingFiles.join(', ')}`);
  console.error('Please run the migration setup first.');
  process.exit(1);
}

// Check environment variables
console.log('\n📋 Environment Variables Check:');

const envExample = fs.readFileSync('.env.netlify.example', 'utf8');
const envLocal = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SMTP_HOST',
  'SMTP_USER'
];

let envIssues = [];
requiredVars.forEach(varName => {
  if (envLocal.includes(`${varName}=`) && !envLocal.includes(`${varName}=your_`) && !envLocal.includes(`${varName}=G-XXXXXXXXXX`)) {
    console.log(`✅ ${varName} configured`);
  } else {
    console.log(`⚠️  ${varName} needs configuration`);
    envIssues.push(varName);
  }
});

// Check package.json for Netlify plugin
console.log('\n📦 Dependencies Check:');

if (packageJson.devDependencies && packageJson.devDependencies['@netlify/plugin-nextjs']) {
  console.log('✅ @netlify/plugin-nextjs is installed');
} else {
  console.log('⚠️  @netlify/plugin-nextjs not found - installing...');
  try {
    const { execSync } = require('child_process');
    execSync('npm install --save-dev @netlify/plugin-nextjs', { stdio: 'inherit' });
    console.log('✅ @netlify/plugin-nextjs installed successfully');
  } catch (error) {
    console.error('❌ Failed to install @netlify/plugin-nextjs');
    console.error('Please run: npm install --save-dev @netlify/plugin-nextjs');
  }
}

// Create production environment template
console.log('\n🔧 Creating production environment template...');

const productionEnv = `# Crystal Harbor - Production Environment Variables
# Add these to your Netlify site settings

NEXT_PUBLIC_APP_URL=https://crystalharbor.netlify.app
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=${getEnvValue(envLocal, 'NEXT_PUBLIC_SUPABASE_URL')}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${getEnvValue(envLocal, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')}
SUPABASE_SERVICE_ROLE_KEY=${getEnvValue(envLocal, 'SUPABASE_SERVICE_ROLE_KEY')}

# IMPORTANT: Replace with your LIVE Stripe keys for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE

# Email Configuration
SMTP_HOST=${getEnvValue(envLocal, 'SMTP_HOST')}
SMTP_PORT=${getEnvValue(envLocal, 'SMTP_PORT')}
SMTP_SECURE=${getEnvValue(envLocal, 'SMTP_SECURE')}
SMTP_USER=${getEnvValue(envLocal, 'SMTP_USER')}
SMTP_PASS=${getEnvValue(envLocal, 'SMTP_PASS')}
SMTP_FROM=${getEnvValue(envLocal, 'SMTP_FROM')}

# Other Configuration
CRON_API_KEY=crystal-harbor-production-cron-key-change-this
ADMIN_EMAIL=${getEnvValue(envLocal, 'ADMIN_EMAIL')}
NEXT_PUBLIC_GA_MEASUREMENT_ID=${getEnvValue(envLocal, 'NEXT_PUBLIC_GA_MEASUREMENT_ID')}
`;

fs.writeFileSync('.env.production.netlify', productionEnv);
console.log('✅ Created .env.production.netlify with your settings');

// Summary
console.log('\n📊 Deployment Readiness Summary:');
console.log('================================');

if (missingFiles.length === 0) {
  console.log('✅ All required configuration files present');
} else {
  console.log(`❌ Missing files: ${missingFiles.length}`);
}

if (envIssues.length === 0) {
  console.log('✅ All critical environment variables configured');
} else {
  console.log(`⚠️  Environment variables needing attention: ${envIssues.length}`);
}

console.log('\n🚀 Next Steps:');
console.log('1. Push your code to GitHub');
console.log('2. Connect repository to Netlify');
console.log('3. Copy environment variables from .env.production.netlify to Netlify dashboard');
console.log('4. Replace test Stripe keys with live keys');
console.log('5. Configure custom domain');
console.log('6. Test deployment');

console.log('\n📖 For detailed instructions, see: netlify-deploy.md');

function getEnvValue(envContent, varName) {
  const match = envContent.match(new RegExp(`${varName}=(.+)`));
  return match ? match[1] : `YOUR_${varName}_HERE`;
}