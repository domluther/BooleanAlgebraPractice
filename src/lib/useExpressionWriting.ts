import { useCallback, useState, useEffect } from "react";
import { convertToWordNotation, type NotationType } from "./config";
import { expressionDatabase } from "./data";
import {
	areExpressionsLogicallyEquivalent,
	generateAllAcceptedAnswers,
	normalizeExpression,
	shuffleExpression,
} from "./expressionUtils";

const STORAGE_KEY = 'expressionWritingDifficulty';

// Helper to get initial difficulty from localStorage
const getInitialDifficulty = (): number => {
  if (typeof window === 'undefined') return 1;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (parsed >= 1 && parsed <= 5) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading difficulty from localStorage:', e);
  }
  return 1;
};

/**
 * useExpressionWriting - React hook for Expression Writing game mode
 *
 * Manages game state for writing Boolean expressions from circuit diagrams.
 *
 * Levels:
 * - Level 1: Easy - Simple two-gate expressions
 * - Level 2: Medium - More complex two-gate expressions
 * - Level 3: Hard - Complex expressions with NOT gates
 * - Level 4: Expert - Advanced expressions with 4-5 variables
 * - Level 5: A-Level - Includes XOR gates
 */

interface Question {
	expression: string;
	acceptedAnswers: string[];
}

interface UseExpressionWritingReturn {
	currentLevel: number;
	currentQuestion: Question;
	userAnswer: string;
	isAnswered: boolean;
	isCorrect: boolean | null;
	feedbackMessage: string;
	setUserAnswer: (answer: string) => void;
	checkAnswer: (notationType: NotationType) => void;
	generateNewQuestion: () => void;
	reset: () => void;
	setLevel: (level: number) => void;
}

interface UseExpressionWritingOptions {
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
 * Validates that user input follows the expected notation consistently
 */
function validateNotationConsistency(
	userInput: string,
	notationType: NotationType,
): string | null {
	const hasWords = /\b(AND|OR|NOT|XOR)\b/.test(userInput);
	const hasSymbols = /[∧∨¬⊻^vV!]/.test(userInput);

	if (notationType === "symbol") {
		if (hasWords) {
			return "Please use symbol notation (∧, ∨, ¬, ⊻) or keyboard shortcuts (^, v, !) instead of words. Current mode: Symbols";
		}
	} else {
		if (hasSymbols) {
			return "Please use word notation (AND, OR, NOT, XOR) instead of symbols. Current mode: Words";
		}
	}

	// Check for mixed notation within the same expression
	if (hasWords && hasSymbols) {
		return "Please use consistent notation throughout your expression. Don't mix words and symbols.";
	}

	return null; // Valid
}

/**
 * Generate a question for the given difficulty level
 */
function generateQuestion(level: number): Question {
	const levelKey = `level${level}` as keyof typeof expressionDatabase;
	const expressions = expressionDatabase[levelKey];

	if (!expressions || expressions.length === 0) {
		throw new Error(`No expressions found for level ${level}`);
	}

	let expression = expressions[Math.floor(Math.random() * expressions.length)];

	// For difficulty 3+, shuffle input/output variables
	if (level >= 3) {
		expression = shuffleExpression(expression);
	}

	const acceptedAnswers = generateAllAcceptedAnswers(expression);

	return {
		expression,
		acceptedAnswers,
	};
}

/**
 * Custom hook for Expression Writing game logic
 */
export function useExpressionWriting(
	options?: UseExpressionWritingOptions,
): UseExpressionWritingReturn {
	const [currentLevel, setCurrentLevel] = useState(getInitialDifficulty);
	const [currentQuestion, setCurrentQuestion] = useState<Question>(() => {
		// Generate question based on the initial difficulty level
		const initialLevel = getInitialDifficulty();
		return generateQuestion(initialLevel);
	});
	const [userAnswer, setUserAnswer] = useState("");
	const [isAnswered, setIsAnswered] = useState(false);
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
	const [feedbackMessage, setFeedbackMessage] = useState("");

	// Save difficulty to localStorage whenever it changes
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, currentLevel.toString());
		} catch (e) {
			console.error('Error saving difficulty to localStorage:', e);
		}
	}, [currentLevel]);

	/**
	 * Get the question type for score tracking
	 */
	const getQuestionType = useCallback(() => {
		return "Expression Writing";
	}, []);

	/**
	 * Check if the user's answer is correct
	 */
	const checkAnswer = useCallback(
		(notationType: NotationType) => {
			// Prevent answering twice
			if (isAnswered) return;

			const trimmedAnswer = userAnswer.trim().toUpperCase();

			// Check for notation consistency
			const notationError = validateNotationConsistency(
				trimmedAnswer,
				notationType,
			);
			if (notationError) {
				setIsAnswered(true);
				setIsCorrect(false);
				setFeedbackMessage(notationError);

				// Still record as incorrect attempt
				if (options?.onScoreUpdate) {
					options.onScoreUpdate(
						false,
						getQuestionType(),
						"writeExpression",
						currentLevel,
						false, // Expression Writing doesn't have expert mode yet
					);
				}
				return;
			}

			// Convert user input from symbols to words if they used symbol notation
			const userAnswerInWords = convertToWordNotation(trimmedAnswer);
			const normalizedUser = normalizeExpression(userAnswerInWords);

			// First try exact match with accepted answers
			let correct = currentQuestion.acceptedAnswers.some((acceptedAnswer) => {
				const normalizedAccepted = normalizeExpression(
					acceptedAnswer.toUpperCase(),
				);
				return normalizedUser === normalizedAccepted;
			});

			// If no exact match, try logical equivalence using truth tables
			if (!correct) {
				correct = areExpressionsLogicallyEquivalent(
					userAnswerInWords,
					currentQuestion.expression,
				);
			}

			setIsAnswered(true);
			setIsCorrect(correct);

			// Call external score recording callback if provided
			if (options?.onScoreUpdate) {
				options.onScoreUpdate(
					correct,
					getQuestionType(),
					"writeExpression",
					currentLevel,
					false, // Expression Writing doesn't have expert mode yet
				);
			}

			// Generate feedback message
			if (correct) {
				setFeedbackMessage("Correct! Excellent work!");
			} else {
				setFeedbackMessage(
					`Incorrect. The correct answer is: ${currentQuestion.expression}`,
				);
			}
		},
		[
			isAnswered,
			userAnswer,
			currentQuestion,
			currentLevel,
			options,
			getQuestionType,
		],
	); /**
	 * Generate a new question based on current level
	 */
	const generateNewQuestion = useCallback(() => {
		setIsAnswered(false);
		setIsCorrect(null);
		setFeedbackMessage("");
		setUserAnswer("");
		setCurrentQuestion(generateQuestion(currentLevel));
	}, [currentLevel]);

	/**
	 * Reset the game state
	 */
	const reset = useCallback(() => {
		setIsAnswered(false);
		setIsCorrect(null);
		setFeedbackMessage("");
		setUserAnswer("");
		setCurrentQuestion(generateQuestion(1));
	}, []);

	/**
	 * Change the difficulty level
	 */
	const setLevel = useCallback((level: number) => {
		setCurrentLevel(level);
		setIsAnswered(false);
		setIsCorrect(null);
		setFeedbackMessage("");
		setUserAnswer("");
		setCurrentQuestion(generateQuestion(level));
	}, []);

	return {
		currentLevel,
		currentQuestion,
		userAnswer,
		isAnswered,
		isCorrect,
		feedbackMessage,
		setUserAnswer,
		checkAnswer,
		generateNewQuestion,
		reset,
		setLevel,
	};
}
