#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 React Debugging Report');
console.log('========================');

// Check React version
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('📦 React Version:', packageJson.dependencies.react);
  console.log('📦 React DOM Version:', packageJson.dependencies['react-dom']);
} catch (e) {
  console.log('❌ Could not read package.json');
}

// Check for multiple React instances
console.log('\n🔍 Checking for multiple React instances...');
try {
  const { execSync } = require('child_process');
  const output = execSync('find node_modules -name "react" -type d | head -10', { encoding: 'utf8' });
  const reactDirs = output.trim().split('\n').filter(Boolean);
  if (reactDirs.length > 1) {
    console.log('⚠️  Multiple React instances found:');
    reactDirs.forEach(dir => console.log('   -', dir));
  } else {
    console.log('✅ Single React instance found');
  }
} catch (e) {
  console.log('❌ Could not check for multiple React instances');
}

// Check TypeScript config
console.log('\n🔍 Checking TypeScript configuration...');
if (fs.existsSync('tsconfig.json')) {
  console.log('✅ tsconfig.json found');
} else {
  console.log('❌ tsconfig.json not found');
}

// Check Next.js config
console.log('\n🔍 Checking Next.js configuration...');
if (fs.existsSync('next.config.js') || fs.existsSync('next.config.ts')) {
  console.log('✅ Next.js config found');
} else {
  console.log('❌ Next.js config not found');
}

console.log('\n📋 Recommendations:');
console.log('1. If you see React error #418, try downgrading to React 18:');
console.log('   npm install react@18 react-dom@18');
console.log('2. Clear all caches:');
console.log('   rm -rf .next node_modules/.cache');
console.log('3. Reinstall dependencies:');
console.log('   npm install');
console.log('4. Check browser console for detailed error messages');
