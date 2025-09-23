#!/usr/bin/env node

// Load environment variables the same way Next.js does
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('JWT_SECRET from process.env:');
console.log('- Has secret:', !!process.env.JWT_SECRET);
console.log('- Length:', process.env.JWT_SECRET?.length || 0);
console.log('- Preview:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 20) + '...' : 'undefined');
console.log('- Full value:', JSON.stringify(process.env.JWT_SECRET));
