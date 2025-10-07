/**
 * Shared quiz interaction hooks for GCSE Units components
 * Consolidates common form handling, answer checking, and submission logic
 */

import { useRef } from "react";
import {
	type ExplanationSection,
	formatNumber,
	unformatNumber,
} from "./numberUtils";

export interface QuizQuestion {
	answer: number;
	category: string;
	explanation: ExplanationSection[];
}

export interface QuizFeedback {
	isCorrect: boolean;
	message: string;
	explanation: ExplanationSection[];
}

export type UseQuizInteractionOptions = Record<string, never>;

/**
 * Custom hook that provides common quiz interaction handlers
 * @param currentQuestion The current question object
 * @param userAnswer The current user answer string
 * @param setUserAnswer Function to update the user answer
 * @param hasSubmitted Whether the user has submitted their answer
 * @param setHasSubmitted Function to update submission state
 * @param setFeedback Function to update feedback state
 * @param onScoreUpdate Function called when answer is checked
 * @returns Object containing handler functions and input ref
 */
export function useQuizInteraction<T extends QuizQuestion>(
	currentQuestion: T | null,
	userAnswer: string,
	setUserAnswer: (answer: string) => void,
	hasSubmitted: boolean,
	setHasSubmitted: (submitted: boolean) => void,
	setFeedback: (feedback: QuizFeedback | null) => void,
	onScoreUpdate: (isCorrect: boolean, questionType: string) => void,
	_options?: UseQuizInteractionOptions, // Kept for backward compatibility but unused
) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const inputValue = e.target.value;
		const rawValue = unformatNumber(inputValue);

		// Only allow numeric input (including decimals)
		if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
			setUserAnswer(rawValue);
		}
	};

	const checkAnswer = () => {
		if (!currentQuestion) return;
		const answerNum = Number(unformatNumber(userAnswer));
		const correctAnswer = currentQuestion.answer;

		// Use 0.01% tolerance to handle floating-point precision errors
		// This means if the correct answer is 0.15, we accept 0.149999999 as correct
		const tolerance = Math.abs(correctAnswer) * 0.0001;
		const isCorrect = Math.abs(answerNum - correctAnswer) <= tolerance;

		// Update score here
		onScoreUpdate(isCorrect, currentQuestion.category);

		setFeedback({
			isCorrect,
			message: isCorrect
				? "Correct! Well done!"
				: `Incorrect. The correct answer is ${formatNumber(correctAnswer)}`,
			explanation: currentQuestion.explanation,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (hasSubmitted) return;
		checkAnswer();
		setHasSubmitted(true);
		if (inputRef.current) {
			inputRef.current.blur();
		}
	};

	return {
		handleAnswerChange,
		checkAnswer,
		handleSubmit,
		inputRef,
	};
}
