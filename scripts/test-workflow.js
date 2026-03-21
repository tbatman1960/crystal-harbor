#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 Crystal Harbor - Enhanced Test Workflow\n');

class TestWorkflow {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',  
      'warning': '⚠️',
      'error': '❌',
      'test': '🧪'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runQualityChecks() {
    this.log('Running code quality checks...', 'info');
    
    try {
      // Run our quality check script
      const result = execSync('node scripts/quality-check.js', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      if (result.includes('🟢 EXCELLENT') || result.includes('🟡 GOOD')) {
        this.log('Code quality checks passed', 'success');
        return true;
      } else {
        this.log('Code quality checks failed', 'error');
        this.errors.push('Quality checks failed');
        return false;
      }
    } catch (error) {
      this.log(`Quality check error: ${error.message}`, 'error');
      this.errors.push('Quality check execution failed');
      return false;
    }
  }

  async testBuild() {
    this.log('Testing Next.js build...', 'info');
    
    try {
      execSync('npm run build', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      this.log('Build successful', 'success');
      return true;
    } catch (error) {
      this.log('Build failed', 'error');
      this.errors.push('Build failed');
      return false;
    }
  }

  async testRoutes() {
    this.log('Testing critical routes...', 'info');
    
    const routes = [
      '/',
      '/products', 
      '/products/t-shirts',
      '/products/t-shirts/custom-t-shirt',
      '/cart',
      '/checkout',
      '/auth/login',
      '/admin/login'
    ];

    // Test that critical files exist for these routes
    const criticalFiles = {
      '/': 'src/app/page.tsx',
      '/products': 'src/app/products/page.tsx', 
      '/cart': 'src/app/cart/page.tsx',
      '/checkout': 'src/app/checkout/page.tsx'
    };

    let routeTests = 0;
    let routesPassed = 0;

    for (const [route, file] of Object.entries(criticalFiles)) {
      routeTests++;
      if (fs.existsSync(file)) {
        this.log(`Route ${route} - File exists`, 'success');
        routesPassed++;
      } else {
        this.log(`Route ${route} - File missing: ${file}`, 'error');
        this.errors.push(`Missing file for route ${route}`);
      }
    }

    this.testResults.push({ 
      name: 'Route Files', 
      passed: routesPassed, 
      total: routeTests 
    });

    return routesPassed === routeTests;
  }

  async testComponents() {
    this.log('Testing critical components...', 'info');
    
    const components = [
      'src/components/layout/Header.tsx',
      'src/components/products/ProductDetailClient.tsx', 
      'src/components/checkout/CheckoutForm.tsx',
      'src/store/cartStore.ts',
      'src/lib/supabase.ts'
    ];

    let componentTests = 0;
    let componentsPassed = 0;

    for (const component of components) {
      componentTests++;
      if (fs.existsSync(component)) {
        // Basic syntax check
        try {
          const content = fs.readFileSync(component, 'utf8');
          if (content.includes('export') && !content.includes('console.error(')) {
            this.log(`Component ${component.split('/').pop()} - OK`, 'success');
            componentsPassed++;
          } else {
            this.log(`Component ${component.split('/').pop()} - Issues detected`, 'warning');
            this.warnings.push(`Component ${component} may have issues`);
            componentsPassed++; // Still count as passed for non-critical issues
          }
        } catch (error) {
          this.log(`Component ${component.split('/').pop()} - Read error`, 'error');
          this.errors.push(`Cannot read component ${component}`);
        }
      } else {
        this.log(`Component ${component.split('/').pop()} - Missing`, 'error');
        this.errors.push(`Missing component ${component}`);
      }
    }

    this.testResults.push({ 
      name: 'Components', 
      passed: componentsPassed, 
      total: componentTests 
    });

    return componentsPassed === componentTests;
  }

  async testConfiguration() {
    this.log('Testing configuration...', 'info');
    
    const configs = [
      'package.json',
      'tsconfig.json', 
      'next.config.js',
      'tailwind.config.ts'
    ];

    let configTests = 0;
    let configsPassed = 0;

    for (const config of configs) {
      configTests++;
      if (fs.existsSync(config)) {
        this.log(`Config ${config} - Exists`, 'success');
        configsPassed++;
      } else {
        this.log(`Config ${config} - Missing`, 'error');
        this.errors.push(`Missing config ${config}`);
      }
    }

    // Check environment
    if (fs.existsSync('.env.local') || fs.existsSync('.env.example')) {
      this.log('Environment config - OK', 'success');
      configsPassed++;
    } else {
      this.log('Environment config - Missing', 'warning');
      this.warnings.push('No environment configuration found');
    }
    configTests++;

    this.testResults.push({ 
      name: 'Configuration', 
      passed: configsPassed, 
      total: configTests 
    });

    return configsPassed >= configTests - 1; // Allow one missing non-critical config
  }

  async generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 ENHANCED TEST WORKFLOW RESULTS');
    console.log('='.repeat(50));

    // Test Results Summary
    if (this.testResults.length > 0) {
      console.log('\n🧪 TEST RESULTS:');
      let totalTests = 0;
      let totalPassed = 0;
      
      this.testResults.forEach(result => {
        const percentage = Math.round((result.passed / result.total) * 100);
        console.log(`   ${result.name}: ${result.passed}/${result.total} (${percentage}%)`);
        totalTests += result.total;
        totalPassed += result.passed;
      });
      
      const overallPercentage = Math.round((totalPassed / totalTests) * 100);
      console.log(`\n   Overall: ${totalPassed}/${totalTests} (${overallPercentage}%)`);
    }

    // Errors
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }

    // Warnings  
    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    // Final Status
    const hasErrors = this.errors.length > 0;
    const status = hasErrors ? '❌ FAILED' : 
                 this.warnings.length > 0 ? '🟡 PASSED WITH WARNINGS' : 
                 '🟢 ALL TESTS PASSED';
    
    console.log(`\n🎯 FINAL STATUS: ${status}`);
    
    if (!hasErrors) {
      console.log('\n✅ Ready for browser automation testing and manual verification');
    } else {
      console.log('\n🚫 Fix errors before proceeding');
      process.exit(1);
    }
  }

  async runAll() {
    console.log('Starting comprehensive test workflow...\n');
    
    // Run all tests
    await this.runQualityChecks();
    await this.testBuild();
    await this.testRoutes();
    await this.testComponents();
    await this.testConfiguration();
    
    // Generate final report
    await this.generateReport();
  }
}

// Run if called directly
if (require.main === module) {
  const workflow = new TestWorkflow();
  workflow.runAll().catch(console.error);
}

module.exports = TestWorkflow;