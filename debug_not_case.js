import { generateAllAcceptedAnswers } from './js/expression-utils.js';

// Debug the parsing and generation
const targetExpression = "Y = NOT ((NOT G) AND E)";

console.log("Target:", targetExpression);
console.log();

const acceptedAnswers = generateAllAcceptedAnswers(targetExpression);
console.log("All variations generated:");
acceptedAnswers.forEach((answer, i) => {
    console.log(`  ${i + 1}. "${answer}"`);
});

console.log();
console.log("Looking for formats with 'E AND (NOT G)':");
const matchingFormats = acceptedAnswers.filter(answer => answer.includes('E AND (NOT G)'));
matchingFormats.forEach(format => console.log(`  Found: "${format}"`));

if (matchingFormats.length === 0) {
    console.log("  No formats found with 'E AND (NOT G)' - this is the issue!");
}
