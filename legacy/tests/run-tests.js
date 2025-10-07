#!/usr/bin/env node

/**
 * Test runner for all expression utilities tests
 * Run with: node tests/run-tests.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Boolean Algebra Expression Tests\n');
console.log('==============================================\n');

try {
    // Run expression variations tests
    console.log('Running Expression Variations Tests...\n');
    await import('./expression-variations.test.js');
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Run normalization tests
    console.log('Running Normalization Tests...\n');
    await import('./normalization.test.js');
    
    console.log('\n🎊 Test Suite Complete!');
    
} catch (error) {
    console.error('❌ Error running tests:', error);
    process.exit(1);
}
