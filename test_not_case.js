import { generateAllAcceptedAnswers } from './js/expression-utils.js';

// Test the specific case
const targetExpression = "Y = NOT ((NOT G) AND E)";
const circuitOutput = "Y = NOT (E AND (NOT G))";

console.log("Target:", targetExpression);
console.log("Circuit output:", circuitOutput);

const acceptedAnswers = generateAllAcceptedAnswers(targetExpression);

console.log("\nAccepted answers:");
acceptedAnswers.forEach((answer, i) => {
    const match = answer === circuitOutput ? " ← MATCH!" : "";
    console.log(`  ${i + 1}. ${answer}${match}`);
});

console.log("\nIs circuit output accepted?", acceptedAnswers.includes(circuitOutput));
