import { useCallback, useEffect, useState } from "react";
import { type NotationType } from "./config";
import { expressionDatabase } from "./data";
import {
	checkExpressionAnswer,
	shuffleExpression,
} from "./expressionUtils";

const STORAGE_KEY = "expressionWritingDifficulty";

// Helper to get initial difficulty from localStorage
const getInitialDifficulty = (): number => {
	if (typeof window === "undefined") return 1;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = parseInt(stored, 10);
			if (parsed >= 1 && parsed <= 5) {
				return parsed;
			}
		}
	} catch (e) {
		console.error("Error reading difficulty from localStorage:", e);
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

	return { expression };
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
			console.error("Error saving difficulty to localStorage:", e);
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

			const result = checkExpressionAnswer(
				userAnswer,
				currentQuestion.expression,
				notationType,
			);

			setIsAnswered(true);
			setIsCorrect(result.isCorrect);
			setFeedbackMessage(result.message);

			// Call external score recording callback if provided
			if (options?.onScoreUpdate) {
				options.onScoreUpdate(
					result.isCorrect,
					getQuestionType(),
					"writeExpression",
					currentLevel,
					false, // Expression Writing doesn't have expert mode yet
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
