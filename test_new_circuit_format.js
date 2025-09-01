import { ExpressionTestSuite } from './expression-test-suite.js';

// Test for the new circuit format case  
const newTestSuite = new ExpressionTestSuite();

// Add test for the specific case that was failing
newTestSuite.addTest(
    "Circuit NOT Expression Commutative",
    "Y = NOT ((NOT G) AND E)",
    [
        "Y = NOT (E AND (NOT G))",  // This was the failing circuit format
        "Y = NOT ((NOT G) AND E)",  // Original format
        "Y = NOT (E AND NOT G)",    // Minimal format
    ]
);

console.log("🧪 Testing New Circuit NOT Expression Format\n");
console.log("=".repeat(50));

newTestSuite.runAllTests();
