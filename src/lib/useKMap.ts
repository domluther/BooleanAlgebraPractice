/**
 * useKMap Hook
 *
 * Game logic for K-Map mode — fill in the 1s in a Karnaugh Map grid for a given
 * Boolean expression.  Supports 4 difficulty levels (2 → 3 → 4-variable K-Maps).
 */

import { useCallback, useState } from "react";
import { getInputVariables, shuffleExpression } from "./expressionUtils";
import { kmapDatabase } from "./kmapData";
import { buildKMapSolution, getKMapLayout, type KMapLayout } from "./kmapUtils";

export type KMapDifficulty = 1 | 2 | 3 | 4;

const STORAGE_KEY = "kmapDifficulty";

const getInitialDifficulty = (): KMapDifficulty => {
	if (typeof window === "undefined") return 1;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = parseInt(stored, 10);
			if (parsed >= 1 && parsed <= 4) return parsed as KMapDifficulty;
		}
	} catch {
		// ignore storage errors
	}
	return 1;
};

const buildQuestion = (level: KMapDifficulty) => {
	const key = `level${level}` as keyof typeof kmapDatabase;
	const expressions = kmapDatabase[key];
	let expression = expressions[Math.floor(Math.random() * expressions.length)];

	// Harder modes: shuffle variables to randomize letters
	if (level >= 3) {
		expression = shuffleExpression(expression);
	}

	const variables = getInputVariables(expression);
	const layout = getKMapLayout(variables);
	const solution = buildKMapSolution(expression, layout);
	return { expression, variables, layout, solution };
};

/** Status of a single K-Map cell after checking. */
export type KMapCellStatus =
	| "unselected" // not answered yet, user did not place a 1
	| "selected" // not answered yet, user placed a 1
	| "correct-one" // answered: user correctly placed a 1
	| "correct-zero" // answered: cell correctly left empty
	| "incorrect-extra" // answered: user placed a 1 but cell should be 0
	| "incorrect-missed"; // answered: user missed a 1

interface UseKMapProps {
	onScoreUpdate?: (
		isCorrect: boolean,
		questionType: string,
		mode?: string,
		level?: number,
	) => void;
}

export interface UseKMapReturn {
	currentLevel: KMapDifficulty;
	currentExpression: string;
	variables: string[];
	layout: KMapLayout;
	solution: boolean[][];
	isAnswered: boolean;
	isCorrect: boolean;
	setLevel: (level: KMapDifficulty) => void;
	toggleCell: (row: number, col: number) => void;
	checkAnswer: () => void;
	generateNewQuestion: () => void;
	getCellStatus: (row: number, col: number) => KMapCellStatus;
}

export function useKMap({ onScoreUpdate }: UseKMapProps = {}): UseKMapReturn {
	const [currentLevel, setCurrentLevel] =
		useState<KMapDifficulty>(getInitialDifficulty);
	const [question, setQuestion] = useState(() =>
		buildQuestion(getInitialDifficulty()),
	);
	// Set of "row_col" keys the user has toggled to 1
	const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
	const [isAnswered, setIsAnswered] = useState(false);
	const [isCorrect, setIsCorrect] = useState(false);

	const setLevel = useCallback((level: KMapDifficulty) => {
		try {
			localStorage.setItem(STORAGE_KEY, String(level));
		} catch {
			// ignore storage errors
		}
		setCurrentLevel(level);
		setQuestion(buildQuestion(level));
		setSelectedCells(new Set());
		setIsAnswered(false);
		setIsCorrect(false);
	}, []);

	const generateNewQuestion = useCallback(() => {
		setQuestion(buildQuestion(currentLevel));
		setSelectedCells(new Set());
		setIsAnswered(false);
		setIsCorrect(false);
	}, [currentLevel]);

	const toggleCell = useCallback(
		(row: number, col: number) => {
			if (isAnswered) return;
			const key = `${row}_${col}`;
			setSelectedCells((prev) => {
				const next = new Set(prev);
				if (next.has(key)) {
					next.delete(key);
				} else {
					next.add(key);
				}
				return next;
			});
		},
		[isAnswered],
	);

	const checkAnswer = useCallback(() => {
		if (isAnswered) return;

		const { solution, layout } = question;
		let allCorrect = true;

		for (let row = 0; row < layout.rowCount; row++) {
			for (let col = 0; col < layout.colCount; col++) {
				const userPlacedOne = selectedCells.has(`${row}_${col}`);
				const shouldBeOne = solution[row][col];
				if (userPlacedOne !== shouldBeOne) {
					allCorrect = false;
					break;
				}
			}
			if (!allCorrect) break;
		}

		setIsAnswered(true);
		setIsCorrect(allCorrect);
		onScoreUpdate?.(allCorrect, "kmap", "kmap", currentLevel);
	}, [isAnswered, question, selectedCells, currentLevel, onScoreUpdate]);

	const getCellStatus = useCallback(
		(row: number, col: number): KMapCellStatus => {
			const key = `${row}_${col}`;
			const userPlacedOne = selectedCells.has(key);
			const shouldBeOne = question.solution[row][col];

			if (!isAnswered) {
				return userPlacedOne ? "selected" : "unselected";
			}

			if (userPlacedOne && shouldBeOne) return "correct-one";
			if (!userPlacedOne && !shouldBeOne) return "correct-zero";
			if (userPlacedOne && !shouldBeOne) return "incorrect-extra";
			return "incorrect-missed";
		},
		[selectedCells, question.solution, isAnswered],
	);

	return {
		currentLevel,
		currentExpression: question.expression,
		variables: question.variables,
		layout: question.layout,
		solution: question.solution,
		isAnswered,
		isCorrect,
		setLevel,
		toggleCell,
		checkAnswer,
		generateNewQuestion,
		getCellStatus,
	};
}
