import { generateAllAcceptedAnswers } from '../js/expression-utils.js';

// Test a simpler case first
console.log("=== Testing simple NOT case ===");
const simple = generateAllAcceptedAnswers("Y = NOT (A AND B)");
simple.forEach((answer, i) => console.log(`  ${i + 1}. ${answer}`));

console.log("\n=== Testing the problematic case ===");
const target = "Y = NOT ((NOT G) AND E)";
const variations = generateAllAcceptedAnswers(target);
variations.forEach((answer, i) => console.log(`  ${i + 1}. ${answer}`));

console.log("\n=== Looking for specific format ===");
const needed = "Y = NOT (E AND (NOT G))";
const found = variations.includes(needed);
console.log(`Looking for: "${needed}"`);
console.log(`Found: ${found}`);
