import { generateAllAcceptedAnswers, normalizeExpression } from '../js/expression-utils.js';

/**
 * Test suite for expression variations and normalization
 * This ensures that equivalent Boolean expressions are correctly recognized
 */

class ExpressionTestSuite {
    constructor() {
        this.tests = [];
        this.passedTests = 0;
        this.failedTests = 0;
    }

    /**
     * Add a test case
     * @param {string} name - Test name
     * @param {string} baseExpression - The base expression to generate variations from
     * @param {string[]} expectedAcceptedAnswers - Array of user inputs that should be accepted
     * @param {string[]} expectedRejectedAnswers - Array of user inputs that should be rejected (optional)
     */
    addTest(name, baseExpression, expectedAcceptedAnswers, expectedRejectedAnswers = []) {
        this.tests.push({
            name,
            baseExpression,
            expectedAcceptedAnswers,
            expectedRejectedAnswers
        });
    }

    /**
     * Run all tests
     */
    runTests() {
        console.log('🧪 Running Expression Variation Tests\n');
        console.log('=====================================\n');

        for (const test of this.tests) {
            this.runSingleTest(test);
        }

        console.log('\n📊 Test Summary');
        console.log('================');
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`📈 Total:  ${this.passedTests + this.failedTests}`);
        
        if (this.failedTests === 0) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log(`\n⚠️  ${this.failedTests} test(s) failed - see details above`);
        }
    }

    /**
     * Run a single test
     */
    runSingleTest(test) {
        console.log(`🔍 Testing: ${test.name}`);
        console.log(`   Base: ${test.baseExpression}`);

        const variations = generateAllAcceptedAnswers(test.baseExpression);
        let testPassed = true;
        const failedAnswers = [];

        // Test expected accepted answers
        for (const expectedAnswer of test.expectedAcceptedAnswers) {
            const isDirectlyAccepted = variations.includes(expectedAnswer);
            let isNormalizedAccepted = false;

            if (!isDirectlyAccepted) {
                // Check with normalization
                const normalizedUser = normalizeExpression(expectedAnswer);
                isNormalizedAccepted = variations.some(accepted => 
                    normalizeExpression(accepted.toUpperCase()) === normalizedUser
                );
            }

            const isAccepted = isDirectlyAccepted || isNormalizedAccepted;
            const acceptanceMethod = isDirectlyAccepted ? 'direct' : (isNormalizedAccepted ? 'normalized' : 'rejected');

            console.log(`   ✓ "${expectedAnswer}" → ${isAccepted ? '✅ ACCEPTED' : '❌ REJECTED'} (${acceptanceMethod})`);

            if (!isAccepted) {
                testPassed = false;
                failedAnswers.push(expectedAnswer);
            }
        }

        // Test expected rejected answers
        for (const rejectedAnswer of test.expectedRejectedAnswers) {
            const isDirectlyAccepted = variations.includes(rejectedAnswer);
            let isNormalizedAccepted = false;

            if (!isDirectlyAccepted) {
                const normalizedUser = normalizeExpression(rejectedAnswer);
                isNormalizedAccepted = variations.some(accepted => 
                    normalizeExpression(accepted.toUpperCase()) === normalizedUser
                );
            }

            const isAccepted = isDirectlyAccepted || isNormalizedAccepted;

            console.log(`   ✗ "${rejectedAnswer}" → ${!isAccepted ? '✅ CORRECTLY REJECTED' : '❌ INCORRECTLY ACCEPTED'}`);

            if (isAccepted) {
                testPassed = false;
                failedAnswers.push(`${rejectedAnswer} (should be rejected)`);
            }
        }

        if (testPassed) {
            console.log(`   🎯 Result: PASSED\n`);
            this.passedTests++;
        } else {
            console.log(`   💥 Result: FAILED`);
            console.log(`   📋 Generated variations (${variations.length}):`);
            variations.forEach((v, i) => console.log(`      ${i + 1}. ${v}`));
            console.log('');
            this.failedTests++;
        }
    }
}

// Create test suite
const testSuite = new ExpressionTestSuite();

// Test 1: NOT parentheses placement issue
// Original problem: Generated "(NOT (expr))" instead of "NOT (expr)"
testSuite.addTest(
    'NOT Parentheses Placement',
    'W = NOT ((G OR C) OR D)',
    [
        // These should be the actual generated variations (commutative only, not associative)
        'W = NOT ((C OR G) OR D)',
        'W = NOT ((G OR C) OR D)',
        'W = NOT (D OR (C OR G))',
        'W = NOT (D OR (G OR C))'
    ]
);

// Test 2: NOT expression equivalence with commutative operations
// Original problem: "U = B OR (NOT (A AND H))" not recognized as equivalent to "U = (NOT (H AND A)) OR B"
testSuite.addTest(
    'NOT Expression Commutative Equivalence',
    'U = (NOT (H AND A)) OR B',
    [
        'U = B OR (NOT (A AND H))',
        'U = B OR (NOT (H AND A))',
        'U = B OR NOT (A AND H)',
        'U = B OR NOT (H AND A)',
        'U = (NOT (A AND H)) OR B',
        'U = (NOT (H AND A)) OR B',
        'U = NOT (A AND H) OR B',
        'U = NOT (H AND A) OR B'
    ]
);

// Test 3: Double parentheses around NOT expressions
// Original problem: "Y = F OR ((NOT D) AND G)" not recognized as equivalent to "Y = ((G AND (NOT D)) OR F)"
testSuite.addTest(
    'Double Parentheses Around NOT',
    'Y = ((G AND (NOT D)) OR F)',
    [
        'Y = F OR ((NOT D) AND G)',          // This should work with normalization
        'Y = F OR (NOT D AND G)',            // Direct match (#13)
        'Y = F OR (G AND NOT D)',            // Direct match (#11)
        'Y = F OR (G AND (NOT (D)))',        // Direct match (#9)
        'Y = (G AND NOT D) OR F'             // Direct match (#5)
    ]
);

// Test 4: Complex nested NOT expressions
testSuite.addTest(
    'Complex Nested NOT Expressions',
    'Z = NOT (A AND (NOT B))',
    [
        'Z = NOT (A AND (NOT B))',
        'Z = NOT ((NOT B) AND A)',
        'Z = NOT (A AND NOT B)',
        'Z = NOT (NOT B AND A)'
    ]
);

// Test 5: Multiple NOT operations
testSuite.addTest(
    'Multiple NOT Operations',
    'P = (NOT A) OR (NOT B)',
    [
        'P = (NOT A) OR (NOT B)',
        'P = (NOT (B)) OR (NOT (A))',  // Generated format with extra parentheses
        'P = NOT A OR NOT B',
        'P = NOT B OR NOT A'
    ]
);

// Test 6: Mixed AND/OR with NOT
testSuite.addTest(
    'Mixed AND/OR with NOT',
    'Q = (NOT (A AND B)) OR C',
    [
        'Q = (NOT (A AND B)) OR C',
        'Q = (NOT (B AND A)) OR C',
        'Q = C OR (NOT (A AND B))',
        'Q = C OR (NOT (B AND A))',
        'Q = C OR NOT (A AND B)',
        'Q = C OR NOT (B AND A)'
    ]
);

// Test 7: Outer parentheses around entire expression
testSuite.addTest(
    'Outer Parentheses Around Entire Expression',
    'Q = NOT A',
    [
        'Q = NOT A',
        'Q = (NOT A)'  // Should be accepted through normalization
    ]
);

testSuite.addTest(
    'Outer Parentheses Complex Expressions',
    'R = A AND B',
    [
        'R = A AND B',
        'R = (A AND B)',  // Should be accepted through normalization
        'R = B AND A',
        'R = (B AND A)'   // Should be accepted through normalization
    ]
);

// Test 8: Circuit NOT Expression Commutative (the specific case that was failing)
testSuite.addTest(
    'Circuit NOT Expression Commutative',
    'Y = NOT ((NOT G) AND E)',
    [
        'Y = NOT (E AND (NOT G))',  // This was the failing circuit format
        'Y = NOT ((NOT G) AND E)',  // Original format  
        'Y = NOT (E AND NOT G)',    // Minimal format
        'Y = NOT (NOT G AND E)'     // Alternative minimal format
    ]
);

// Test 9: AND Commutative with NOT Expressions (circuit parentheses case)
testSuite.addTest(
    'AND Commutative with NOT Expressions',
    'R = (G AND (NOT A)) AND H',
    [
        'R = ((NOT A) AND G) AND H',  // This was the failing circuit format
        'R = (G AND (NOT A)) AND H',  // Original format
        'R = (G AND NOT A) AND H',    // Minimal format
        'R = (NOT A AND G) AND H',    // Alternative format
        'R = H AND (G AND (NOT A))',  // Commuted with H
        'R = H AND ((NOT A) AND G)'   // Commuted with H and inner commuted
    ]
);

// Run all tests
testSuite.runTests();
