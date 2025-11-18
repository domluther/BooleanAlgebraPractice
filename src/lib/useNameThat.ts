import { useCallback, useEffect, useState } from "react";
import { expressionDatabase } from "./data";
import {
	areExpressionsLogicallyEquivalent,
	evaluateExpression,
	getInputVariables,
} from "./expressionUtils";
import { hasSameTruthTable } from "./truthTableUtils";

const STORAGE_KEY = "nameThatDifficulty";

// Helper to get initial difficulty from localStorage
const getInitialDifficulty = (): number => {
	if (typeof window === "undefined") return 1;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = parseInt(stored, 10);
			if (parsed >= 1 && parsed <= 3) {
				return parsed;
			}
		}
	} catch (e) {
		console.error("Error reading difficulty from localStorage:", e);
	}
	return 1;
};

/**
 * useNameThat - React hook for NameThat game mode
 *
 * Manages game state for identifying logic gates and circuits.
 *
 * Levels:
 * - Level 1: Single GCSE logic gates (AND, OR, NOT) or invalid gates (NONE)
 * - Level 2: Two-gate combinations from level2NoOverlap dataset (future)
 * - Level 3: Truth table identification (future)
 */

type GateType = "AND" | "OR" | "NOT" | "NONE";

interface InvalidGate {
	getSvg: (color: string) => string;
	reason: string;
}

interface Question {
	expression: string;
	correctAnswer: string;
	options: string[];
	invalidGate?: InvalidGate;
	reason?: string;
	truthTableHTML?: string;
}

interface UseNameThatReturn {
	currentLevel: number;
	currentQuestion: Question;
	isAnswered: boolean;
	isCorrect: boolean | null;
	feedbackMessage: string;
	questionTitle: string;
	checkAnswer: (answer: string) => void;
	generateNewQuestion: () => void;
	reset: () => void;
	setLevel: (level: number) => void;
}

interface UseNameThatOptions {
	/**
	 * Optional callback to record score externally (e.g., with ScoreManager)
	 * Called with (isCorrect, questionType, mode, level, isExpert) when an answer is checked
	 */
	onScoreUpdate?: (
		isCorrect: boolean,
		questionType: string,
		mode?: string,
		level?: number,
		isExpert?: boolean,
	) => void;
}

/**
 * Invalid gate configurations for Level 1 NONE option
 * These are non-GCSE gates that students should identify as invalid
 */
const INVALID_GATES: InvalidGate[] = [
	{
		getSvg: (color: string) => `<circle cx="65" cy="60" r="5" fill="none" stroke="${color}" stroke-width="2"/>
		<path d="M 71 30 L 71 90 L 120 60 Z" fill="none" stroke="${color}" stroke-width="2"/>
		<line x1="30" y1="60" x2="60" y2="60" stroke="${color}" stroke-width="2"/>
		<line x1="120" y1="60" x2="150" y2="60" stroke="${color}" stroke-width="2"/>
		<text x="5" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="${color}">A</text>
		<text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="${color}">Q</text>`,
		reason:
			"The bubble is on the wrong side of this NOT gate. It should be at the output.",
	},
	{
		getSvg: (color: string) => `<path d="M 86 35 A 25 25 0 0 0 86 85 L 113 85 L 113 35 Z" fill="none" stroke="${color}" stroke-width="2"/>
		<line x1="30" y1="50" x2="63" y2="50" stroke="${color}" stroke-width="2"/>
		<line x1="30" y1="70" x2="63" y2="70" stroke="${color}" stroke-width="2"/>
		<line x1="113" y1="60" x2="150" y2="60" stroke="${color}" stroke-width="2"/>
		<text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="${color}">A</text>
		<text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="${color}">B</text>
		<text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="${color}">Q</text>`,
		reason:
			"It is a backwards AND gate. The curved side should be on the right.",
	},
	{
		getSvg: (color: string) => `<path d="M 60 35 L 60 85 L 90 85 A 25 25 0 0 0 90 35 Z" fill="none" stroke="${color}" stroke-width="2"/>
		<circle cx="120" cy="60" r="5" fill="none" stroke="${color}" stroke-width="2"/>
		<line x1="30" y1="50" x2="60" y2="50" stroke="${color}" stroke-width="2"/>
		<line x1="30" y1="70" x2="60" y2="70" stroke="${color}" stroke-width="2"/>
		<line x1="125" y1="60" x2="150" y2="60" stroke="${color}" stroke-width="2"/>
		<text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="${color}">A</text>
		<text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="${color}">B</text>
		<text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="${color}">Q</text>`,
		reason: "The bubble makes it a NAND gate - an AND followed by a NOT.",
	},
	{
		getSvg: (color: string) => `<path d="M 55 35 Q 70 60 55 85" fill="none" stroke="${color}" stroke-width="2"/>
		<path d="M 60 35 Q 85 35 115 60 Q 85 85 60 85 Q 75 60 60 35" fill="none" stroke="${color}" stroke-width="2"/>
		<line x1="30" y1="50" x2="65" y2="50" stroke="${color}" stroke-width="2"/>
		<line x1="30" y1="70" x2="65" y2="70" stroke="${color}" stroke-width="2"/>
		<line x1="115" y1="60" x2="150" y2="60" stroke="${color}" stroke-width="2"/>
		<text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="${color}">A</text>
		<text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="${color}">B</text>
		<text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="${color}">Q</text>`,
		reason: "The extra curved line makes it an XOR gate, used at A-Level.",
	},
];

/**
 * Get expression string for a given gate type
 */
function getGateExpression(gate: GateType): string {
	switch (gate) {
		case "AND":
			return "Q = A AND B";
		case "OR":
			return "Q = A OR B";
		case "NOT":
			return "Q = NOT A";
		case "NONE":
			return "INVALID_GATE";
	}
}

/**
 * Select a random invalid gate configuration
 */
function getRandomInvalidGate(): InvalidGate {
	return INVALID_GATES[Math.floor(Math.random() * INVALID_GATES.length)];
}

/**
 * Generate a random Level 1 gate type
 * Distribution: AND, OR, NOT appear once each, NONE appears twice for balance
 */
function generateRandomGateType(): GateType {
	const gates: GateType[] = ["AND", "OR", "NOT", "NONE", "NONE"];
	return gates[Math.floor(Math.random() * gates.length)];
}

/**
 * Generate a Level 1 question
 */
function generateLevel1Question(): Question {
	const gateType = generateRandomGateType();
	const options = ["AND", "OR", "NOT", "NONE"];

	if (gateType === "NONE") {
		const invalidGate = getRandomInvalidGate();
		return {
			expression: getGateExpression(gateType),
			correctAnswer: gateType,
			options,
			invalidGate,
			reason: invalidGate.reason,
		};
	}

	return {
		expression: getGateExpression(gateType),
		correctAnswer: gateType,
		options,
	};
}

/**
 * Generate a Level 2 question
 * Shows a circuit with 2 gates and asks user to identify the expression
 */
function generateLevel2Question(): Question {
	const expressions = expressionDatabase.level2NoOverlap;

	// 1. Select a correct expression
	const correctExpression =
		expressions[Math.floor(Math.random() * expressions.length)];

	// 2. Get 3 other expressions with different truth tables for options
	const options = [correctExpression];
	const otherExpressions = expressions.filter(
		(expr) => expr !== correctExpression,
	);
	const maxAttempts = otherExpressions.length;
	let attempts = 0;

	// Try to find expressions that produce different truth tables
	while (
		options.length < 4 &&
		otherExpressions.length > 0 &&
		attempts < maxAttempts
	) {
		const randomIndex = Math.floor(Math.random() * otherExpressions.length);
		const candidateExpression = otherExpressions.splice(randomIndex, 1)[0];

		// Only add if it has a different truth table than the correct answer
		if (
			!areExpressionsLogicallyEquivalent(correctExpression, candidateExpression)
		) {
			options.push(candidateExpression);
		}
		attempts++;
	}

	// If we couldn't find enough different expressions, fill with random ones as fallback
	while (options.length < 4 && otherExpressions.length > 0) {
		const randomIndex = Math.floor(Math.random() * otherExpressions.length);
		const randomExpression = otherExpressions.splice(randomIndex, 1)[0];
		options.push(randomExpression);
	}

	// 3. Shuffle the options so the correct answer isn't always first
	for (let i = options.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[options[i], options[j]] = [options[j], options[i]];
	}

	return {
		expression: correctExpression,
		correctAnswer: correctExpression,
		options,
	};
}

/**
 * Generates and returns the HTML for a static, completed truth table.
 * Used for Level 3 question display.
 * @param expression - The expression to build the table for.
 * @returns The complete HTML string for the table.
 */
function generateStaticTableHTML(expression: string): string {
	const inputs = getInputVariables(expression);
	const outputVariable = expression.split(" = ")[0].trim();
	const expressionBody = expression.split(" = ")[1];
	const numCombinations = 2 ** inputs.length;

	let tableHTML = '<table class="truth-table"><thead><tr>';
	for (const input of inputs) {
		tableHTML += `<th class="input-header">${input}</th>`;
	}
	tableHTML += `<th class="output-header">${outputVariable}</th></tr></thead><tbody>`;

	for (let i = 0; i < numCombinations; i++) {
		const combination: Record<string, boolean> = {};
		const rowValues: Record<string, number> = {};
		tableHTML += "<tr>";
		for (let j = 0; j < inputs.length; j++) {
			const inputName = inputs[j];
			const value = Boolean((i >> (inputs.length - 1 - j)) & 1);
			combination[inputName] = value;
			rowValues[inputName] = value ? 1 : 0;
			tableHTML += `<td class="input-cell">${rowValues[inputName]}</td>`;
		}

		const outputValue = evaluateExpression(expressionBody, combination);
		tableHTML += `<td class="output-cell">${outputValue ? 1 : 0}</td>`;
		tableHTML += "</tr>";
	}

	tableHTML += "</tbody></table>";
	return tableHTML;
}

/**
 * Generate a Level 3 question
 * Shows a truth table and asks user to identify which expression it represents
 */
function generateLevel3Question(): Question {
	const expressions = expressionDatabase.level2NoOverlap;

	// 1. Select a correct expression
	const correctExpression =
		expressions[Math.floor(Math.random() * expressions.length)];

	// 2. Generate the truth table HTML for display
	const truthTableHTML = generateStaticTableHTML(correctExpression);

	// 3. Get 3 other expressions with DIFFERENT truth tables for options
	const options = [correctExpression];
	const otherExpressions = expressions.filter(
		(expr) => expr !== correctExpression,
	);
	const maxAttempts = otherExpressions.length;
	let attempts = 0;

	// Try to find expressions that produce different truth tables
	while (
		options.length < 4 &&
		otherExpressions.length > 0 &&
		attempts < maxAttempts
	) {
		const randomIndex = Math.floor(Math.random() * otherExpressions.length);
		const candidateExpression = otherExpressions.splice(randomIndex, 1)[0];

		// Only add if it has a different truth table than the correct answer
		if (!hasSameTruthTable(correctExpression, candidateExpression)) {
			options.push(candidateExpression);
		}
		attempts++;
	}

	// If we couldn't find enough different expressions, fill with random ones as fallback
	while (options.length < 4 && otherExpressions.length > 0) {
		const randomIndex = Math.floor(Math.random() * otherExpressions.length);
		const randomExpression = otherExpressions.splice(randomIndex, 1)[0];
		options.push(randomExpression);
	}

	// 4. Shuffle the options so the correct answer isn't always first
	for (let i = options.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[options[i], options[j]] = [options[j], options[i]];
	}

	return {
		expression: correctExpression,
		correctAnswer: correctExpression,
		options,
		truthTableHTML,
	};
}

/**
 * Get question title for current level
 */
function getQuestionTitle(level: number): string {
	switch (level) {
		case 1:
			return "Name that GCSE logic gate";
		case 2:
			return "Name that logic diagram";
		case 3:
			return "Name that truth table";
		default:
			return "Name that GCSE logic gate";
	}
}

/**
 * Custom hook for NameThat game logic
 */
export function useNameThat(options?: UseNameThatOptions): UseNameThatReturn {
	const [currentLevel, setCurrentLevel] = useState(getInitialDifficulty);
	const [currentQuestion, setCurrentQuestion] = useState<Question>(() => {
		// Generate question based on the initial difficulty level
		const initialLevel = getInitialDifficulty();
		if (initialLevel === 2) {
			return generateLevel2Question();
		} else if (initialLevel === 3) {
			return generateLevel3Question();
		}
		return generateLevel1Question();
	});
	const [isAnswered, setIsAnswered] = useState(false);
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
	const [feedbackMessage, setFeedbackMessage] = useState("");

	// Save difficulty to localStorage whenever it changes
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, currentLevel.toString());
		} catch (e) {
			console.error("Error saving difficulty to localStorage:", e);
		}
	}, [currentLevel]);

	const questionTitle = getQuestionTitle(currentLevel);

	/**
	 * Get the question type for score tracking
	 * Using "Name That" to match legacy format (not level-specific)
	 */
	const getQuestionType = useCallback(() => {
		return "Name That";
	}, []);

	/**
	 * Check if the user's answer is correct
	 */
	const checkAnswer = useCallback(
		(answer: string) => {
			// Prevent answering twice
			if (isAnswered) return;

			setIsAnswered(true);
			const correct = answer === currentQuestion.correctAnswer;
			setIsCorrect(correct);

			// Call external score recording callback if provided
			if (options?.onScoreUpdate) {
				options.onScoreUpdate(
					correct,
					getQuestionType(),
					"nameThat",
					currentLevel,
					false, // NameThat doesn't have expert mode
				);
			}

			// Generate feedback message
			let message: string;
			if (correct) {
				if (currentLevel === 1 && currentQuestion.correctAnswer === "NONE") {
					message = `Correct! This is not a GCSE logic gate. ${currentQuestion.reason}`;
				} else {
					message = "Correct! Well done!";
				}
			} else {
				if (currentLevel === 1 && currentQuestion.correctAnswer === "NONE") {
					message = `Incorrect! This is not a GCSE logic gate. ${currentQuestion.reason}`;
				} else {
					message = `Incorrect! The correct answer is ${currentQuestion.correctAnswer}!`;
				}
			}

			setFeedbackMessage(message);
		},
		[isAnswered, currentQuestion, currentLevel, options, getQuestionType],
	);

	/**
	 * Generate a new question based on current level
	 */
	const generateNewQuestion = useCallback(() => {
		setIsAnswered(false);
		setIsCorrect(null);
		setFeedbackMessage("");

		if (currentLevel === 1) {
			setCurrentQuestion(generateLevel1Question());
		} else if (currentLevel === 2) {
			setCurrentQuestion(generateLevel2Question());
		} else if (currentLevel === 3) {
			setCurrentQuestion(generateLevel3Question());
		}
	}, [currentLevel]);

	/**
	 * Reset the game state
	 */
	const reset = useCallback(() => {
		setIsAnswered(false);
		setIsCorrect(null);
		setFeedbackMessage("");
		setCurrentQuestion(generateLevel1Question());
	}, []);

	/**
	 * Change the difficulty level
	 */
	const setLevel = useCallback((level: number) => {
		setCurrentLevel(level);
		setIsAnswered(false);
		setIsCorrect(null);
		setFeedbackMessage("");

		if (level === 1) {
			setCurrentQuestion(generateLevel1Question());
		} else if (level === 2) {
			setCurrentQuestion(generateLevel2Question());
		} else if (level === 3) {
			setCurrentQuestion(generateLevel3Question());
		}
	}, []);

	return {
		currentLevel,
		currentQuestion,
		isAnswered,
		isCorrect,
		feedbackMessage,
		questionTitle,
		checkAnswer,
		generateNewQuestion,
		reset,
		setLevel,
	};
}
