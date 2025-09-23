#!/usr/bin/env node

// Simple script to generate magic links for testing
const jwt = require('jsonwebtoken');

// Load environment variables the same way Next.js does
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development-only-change-in-production';

function generateMagicToken(email) {
  const payload = {
    email,
    type: 'magic-link',
    exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
  };
  return jwt.sign(payload, JWT_SECRET);
}

// Test emails for different user types
const testUsers = [
  { email: 'tenant@test.com', role: 'tenant' },
  { email: 'host@test.com', role: 'host' },
  { email: 'admin@test.com', role: 'admin' },
  { email: 'demo@helpr.ca', role: 'tenant' },
  { email: 'landlord@helpr.ca', role: 'host' }
];

console.log('🔗 HELPR MAGIC LINKS FOR TESTING');
console.log('================================\n');

testUsers.forEach(user => {
  const token = generateMagicToken(user.email);
  const magicLink = `http://localhost:3000/api/auth/callback?token=${token}&role=${user.role}`;
  
  console.log(`👤 ${user.role.toUpperCase()}: ${user.email}`);
  console.log(`🔗 ${magicLink}`);
  console.log('');
});

console.log('📝 INSTRUCTIONS:');
console.log('1. Click any link above to login as that user type');
console.log('2. Links expire in 15 minutes');
console.log('3. Tenant users see the listing browser');
console.log('4. Host users are redirected to /post to create listings');
console.log('5. Admin users have full access');
console.log('\n✨ Platform is running at: http://localhost:3000');
