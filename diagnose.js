#!/usr/bin/env node

/**
 * NeoCure Diagnostic Script
 * Run this to identify issues with the system
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🔍 NeoCure System Diagnostics\n');
console.log('=' .repeat(50));

const checks = [];

// Check 1: Backend Health
function checkBackendHealth() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:4000/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          checks.push({ name: 'Backend Health', status: '✅ PASS', details: data });
        } else {
          checks.push({ name: 'Backend Health', status: '❌ FAIL', details: `Status: ${res.statusCode}` });
        }
        resolve();
      });
    });
    req.on('error', (err) => {
      checks.push({ name: 'Backend Health', status: '❌ FAIL', details: `Error: ${err.message}` });
      resolve();
    });
    req.setTimeout(5000, () => {
      req.destroy();
      checks.push({ name: 'Backend Health', status: '❌ FAIL', details: 'Timeout - backend not running?' });
      resolve();
    });
  });
}

// Check 2: Environment Variables
function checkEnvVariables() {
  const envPath = path.join(__dirname, 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    checks.push({ name: 'Environment File', status: '❌ FAIL', details: '.env file not found' });
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'OPENAI_API_KEY',
    'PINECONE_API_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'JWT_SECRET'
  ];

  const missing = [];
  requiredVars.forEach(varName => {
    if (!envContent.includes(varName + '=') || envContent.includes(varName + '=\n')) {
      missing.push(varName);
    }
  });

  if (missing.length === 0) {
    checks.push({ name: 'Environment Variables', status: '✅ PASS', details: 'All required vars present' });
  } else {
    checks.push({ name: 'Environment Variables', status: '⚠️  WARN', details: `Missing: ${missing.join(', ')}` });
  }
}

// Check 3: Node Modules
function checkNodeModules() {
  const backendModules = path.join(__dirname, 'backend', 'node_modules');
  const frontendModules = path.join(__dirname, 'node_modules');

  const backendExists = fs.existsSync(backendModules);
  const frontendExists = fs.existsSync(frontendModules);

  if (backendExists && frontendExists) {
    checks.push({ name: 'Node Modules', status: '✅ PASS', details: 'Both installed' });
  } else {
    const missing = [];
    if (!backendExists) missing.push('backend');
    if (!frontendExists) missing.push('frontend');
    checks.push({ name: 'Node Modules', status: '❌ FAIL', details: `Missing: ${missing.join(', ')}` });
  }
}

// Check 4: Critical Files
function checkCriticalFiles() {
  const files = [
    'backend/src/services/ai.ts',
    'backend/src/services/ragPipeline.ts',
    'backend/src/services/ocr.ts',
    'backend/src/controllers/records.controller.ts',
    'src/components/ChatBot.tsx',
    'src/components/MedicalRecords.tsx',
    'src/api/client.ts'
  ];

  const missing = files.filter(f => !fs.existsSync(path.join(__dirname, f)));

  if (missing.length === 0) {
    checks.push({ name: 'Critical Files', status: '✅ PASS', details: 'All files present' });
  } else {
    checks.push({ name: 'Critical Files', status: '❌ FAIL', details: `Missing: ${missing.join(', ')}` });
  }
}

// Check 5: Port Availability
function checkPortAvailability() {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(4000, () => {
      server.close();
      checks.push({ name: 'Port 4000', status: '⚠️  WARN', details: 'Port available (backend not running?)' });
      resolve();
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        checks.push({ name: 'Port 4000', status: '✅ PASS', details: 'Port in use (backend running)' });
      } else {
        checks.push({ name: 'Port 4000', status: '❌ FAIL', details: err.message });
      }
      resolve();
    });
  });
}

// Run all checks
async function runDiagnostics() {
  console.log('\n📋 Running diagnostics...\n');

  checkEnvVariables();
  checkNodeModules();
  checkCriticalFiles();
  await checkPortAvailability();
  await checkBackendHealth();

  console.log('\n' + '='.repeat(50));
  console.log('📊 Results:\n');

  checks.forEach(check => {
    console.log(`${check.status} ${check.name}`);
    console.log(`   ${check.details}\n`);
  });

  const failed = checks.filter(c => c.status.includes('FAIL')).length;
  const warnings = checks.filter(c => c.status.includes('WARN')).length;
  const passed = checks.filter(c => c.status.includes('PASS')).length;

  console.log('='.repeat(50));
  console.log(`\n✅ Passed: ${passed} | ⚠️  Warnings: ${warnings} | ❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log('❌ Critical issues found. Please fix the failed checks above.');
    console.log('\n💡 Common fixes:');
    console.log('   - Run "npm install" in backend/ and root directory');
    console.log('   - Copy backend/.env.example to backend/.env and fill in API keys');
    console.log('   - Start backend with "cd backend && npm run dev"');
  } else if (warnings > 0) {
    console.log('⚠️  Some warnings detected. System may work but check the details above.');
  } else {
    console.log('✅ All checks passed! System should be operational.');
  }

  console.log('\n📖 For detailed troubleshooting, see CRITICAL_FIXES.md\n');
}

runDiagnostics().catch(console.error);
