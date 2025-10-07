/**
 * useTruthTable Hook
 *
 * Game logic for Truth Table mode - fill in truth tables for Boolean expressions.
 * Supports 5 difficulty levels and two modes: normal (fill outputs) and expert (fill everything).
 */

import { useCallback, useState } from "react";
import { expressionDatabase } from "./data";
import {
	calculateTruthTableData,
	parseExpressionForTable,
	type TruthTableRow,
	validateExpertModeAnswers,
} from "./truthTableUtils";

export type TruthTableDifficulty = 1 | 2 | 3 | 4 | 5;

/**
 * User's answer for a single cell in the truth table
 */
export interface CellAnswer {
	rowIndex: number;
	columnName: string;
	value: "0" | "1" | "";
}

/**
 * Validation result for a cell
 */
export interface CellValidation {
	rowIndex: number;
	columnName: string;
	status: "correct" | "incorrect" | "unanswered" | "optional-unanswered";
}

interface UseTruthTableProps {
	/** Callback to update score when answer is checked */
	onScoreUpdate?: (
		isCorrect: boolean,
		questionType: string,
		mode?: string,
		level?: number,
		isExpert?: boolean,
	) => void;
}

interface UseTruthTableReturn {
	// State
	currentLevel: TruthTableDifficulty;
	currentExpression: string;
	inputs: string[];
	intermediateExpressions: string[];
	truthTableData: TruthTableRow[];
	outputVariable: string;

	// User interaction
	userAnswers: Map<string, "0" | "1" | "">;
	cellValidations: Map<string, CellValidation>;
	isAnswered: boolean;
	isCorrect: boolean | null;
	feedbackMessage: string;

	// Options
	showIntermediateColumns: boolean;
	expertMode: boolean;

	// Methods
	setLevel: (level: TruthTableDifficulty) => void;
	setShowIntermediateColumns: (show: boolean) => void;
	setExpertMode: (expert: boolean) => void;
	setUserAnswer: (
		rowIndex: number,
		columnName: string,
		value: "0" | "1" | "",
	) => void;
	checkAnswer: () => void;
	generateNewQuestion: () => void;
}

export function useTruthTable({
	onScoreUpdate,
}: UseTruthTableProps = {}): UseTruthTableReturn {
	const [currentLevel, setCurrentLevel] = useState<TruthTableDifficulty>(1);
	const [currentExpression, setCurrentExpression] = useState("");
	const [inputs, setInputs] = useState<string[]>([]);
	const [intermediateExpressions, setIntermediateExpressions] = useState<
		string[]
	>([]);
	const [truthTableData, setTruthTableData] = useState<TruthTableRow[]>([]);
	const [outputVariable, setOutputVariable] = useState("");

	const [userAnswers, setUserAnswers] = useState<Map<string, "0" | "1" | "">>(
		new Map(),
	);
	const [cellValidations, setCellValidations] = useState<
		Map<string, CellValidation>
	>(new Map());
	const [isAnswered, setIsAnswered] = useState(false);
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
	const [feedbackMessage, setFeedbackMessage] = useState("");

	const [showIntermediateColumns, setShowIntermediateColumns] = useState(false);
	const [expertMode, setExpertMode] = useState(false);

	/**
	 * Generates a new truth table question based on current difficulty
	 */
	const generateNewQuestion = useCallback(() => {
		// Reset state
		setUserAnswers(new Map());
		setCellValidations(new Map());
		setIsAnswered(false);
		setIsCorrect(null);
		setFeedbackMessage("");

		// Select random expression from database
		const levelKey = `level${currentLevel}` as keyof typeof expressionDatabase;
		const expressions = expressionDatabase[levelKey];
		const expression =
			expressions[Math.floor(Math.random() * expressions.length)];

		// Parse expression
		const parsed = parseExpressionForTable(expression);
		const outputVar = expression.split(" = ")[0].trim();

		// Calculate truth table data
		const data = calculateTruthTableData(
			expression,
			parsed.inputs,
			parsed.intermediateExpressions,
			showIntermediateColumns,
		);

		// Update state
		setCurrentExpression(expression);
		setInputs(parsed.inputs);
		setIntermediateExpressions(parsed.intermediateExpressions);
		setTruthTableData(data);
		setOutputVariable(outputVar);
	}, [currentLevel, showIntermediateColumns]);

	/**
	 * Updates user's answer for a specific cell
	 */
	const setUserAnswer = useCallback(
		(rowIndex: number, columnName: string, value: "0" | "1" | "") => {
			const key = `${rowIndex}_${columnName}`;
			setUserAnswers((prev) => {
				const next = new Map(prev);
				next.set(key, value);
				return next;
			});
		},
		[],
	);

	/**
	 * Checks the user's answers against the correct truth table
	 */
	const checkAnswer = useCallback(() => {
		if (isAnswered) return;

		if (expertMode) {
			// Expert mode: validate all fields with order-independent matching
			checkExpertModeAnswer();
		} else {
			// Normal mode: validate only output column
			checkNormalModeAnswer();
		}
	}, [
		isAnswered,
		expertMode,
		userAnswers,
		truthTableData,
		outputVariable,
		inputs,
		intermediateExpressions,
	]);

	/**
	 * Checks answer in normal mode (output column only required)
	 */
	const checkNormalModeAnswer = useCallback(() => {
		const validations = new Map<string, CellValidation>();
		let outputCorrect = 0;
		let allOutputAnswered = true;

		// Check output column
		for (let rowIndex = 0; rowIndex < truthTableData.length; rowIndex++) {
			const key = `${rowIndex}_${outputVariable}`;
			const userValue = userAnswers.get(key);
			const correctValue = truthTableData[rowIndex][outputVariable] ? "1" : "0";

			if (userValue === undefined || userValue === "") {
				allOutputAnswered = false;
				validations.set(key, {
					rowIndex,
					columnName: outputVariable,
					status: "unanswered",
				});
			} else if (userValue === correctValue) {
				outputCorrect++;
				validations.set(key, {
					rowIndex,
					columnName: outputVariable,
					status: "correct",
				});
			} else {
				validations.set(key, {
					rowIndex,
					columnName: outputVariable,
					status: "incorrect",
				});
			}
		}

		// Check intermediate columns (optional)
		if (showIntermediateColumns) {
			for (let rowIndex = 0; rowIndex < truthTableData.length; rowIndex++) {
				for (let i = 0; i < intermediateExpressions.length; i++) {
					const columnName = `intermediate_${i}`;
					const key = `${rowIndex}_${columnName}`;
					const userValue = userAnswers.get(key);
					const correctValue = truthTableData[rowIndex][columnName] ? "1" : "0";

					if (userValue === undefined || userValue === "") {
						validations.set(key, {
							rowIndex,
							columnName,
							status: "optional-unanswered",
						});
					} else if (userValue === correctValue) {
						validations.set(key, {
							rowIndex,
							columnName,
							status: "correct",
						});
					} else {
						validations.set(key, {
							rowIndex,
							columnName,
							status: "incorrect",
						});
					}
				}
			}
		}

		setCellValidations(validations);

		if (!allOutputAnswered) {
			setFeedbackMessage(
				`Please answer all rows in the output column (${outputVariable}).`,
			);
			return;
		}

		const correct = outputCorrect === truthTableData.length;
		setIsAnswered(true);
		setIsCorrect(correct);

		if (correct) {
			setFeedbackMessage("Correct! Perfect truth table!");
			if (onScoreUpdate) {
				onScoreUpdate(
					true,
					"Truth Table",
					"truthTable",
					currentLevel,
					false, // Normal mode
				);
			}
		} else {
			setFeedbackMessage(
				`Output column: ${outputCorrect}/${truthTableData.length} correct. Review the highlighted answers.`,
			);
			// Allow retry - don't mark as answered
			setIsAnswered(false);
			if (onScoreUpdate) {
				onScoreUpdate(
					false,
					"Truth Table",
					"truthTable",
					currentLevel,
					false, // Normal mode
				);
			}
		}
	}, [
		userAnswers,
		truthTableData,
		outputVariable,
		showIntermediateColumns,
		intermediateExpressions,
		currentLevel,
		onScoreUpdate,
	]); /**
	 * Checks answer in expert mode (all fields required, order-independent)
	 */
	const checkExpertModeAnswer = useCallback(() => {
		const validations = new Map<string, CellValidation>();
		let allFieldsFilled = true;
		const userRows: Array<{ rowIndex: number; data: TruthTableRow }> = [];

		// Collect all user answers
		for (let rowIndex = 0; rowIndex < truthTableData.length; rowIndex++) {
			const userRowData: TruthTableRow = {};

			// Check input columns
			for (const input of inputs) {
				const key = `${rowIndex}_${input}`;
				const userValue = userAnswers.get(key);
				if (userValue === undefined || userValue === "") {
					allFieldsFilled = false;
					validations.set(key, {
						rowIndex,
						columnName: input,
						status: "unanswered",
					});
				} else {
					userRowData[input] = userValue === "1";
				}
			}

			// Check intermediate columns
			if (showIntermediateColumns) {
				for (let i = 0; i < intermediateExpressions.length; i++) {
					const columnName = `intermediate_${i}`;
					const key = `${rowIndex}_${columnName}`;
					const userValue = userAnswers.get(key);
					if (userValue === undefined || userValue === "") {
						allFieldsFilled = false;
						validations.set(key, {
							rowIndex,
							columnName,
							status: "unanswered",
						});
					} else {
						userRowData[columnName] = userValue === "1";
					}
				}
			}

			// Check output column
			const outputKey = `${rowIndex}_${outputVariable}`;
			const outputValue = userAnswers.get(outputKey);
			if (outputValue === undefined || outputValue === "") {
				allFieldsFilled = false;
				validations.set(outputKey, {
					rowIndex,
					columnName: outputVariable,
					status: "unanswered",
				});
			} else {
				userRowData[outputVariable] = outputValue === "1";
			}

			userRows.push({ rowIndex, data: userRowData });
		}

		if (!allFieldsFilled) {
			setFeedbackMessage("Expert Mode: All fields must be filled.");
			setCellValidations(validations);
			return;
		}

		// Validate with order-independent matching
		const validationResult = validateExpertModeAnswers(
			userRows,
			truthTableData,
		);

		// Mark cells as correct/incorrect based on matching
		for (let rowIndex = 0; rowIndex < truthTableData.length; rowIndex++) {
			const matchedCorrectIndex = validationResult.rowMatches[rowIndex];

			const allColumns = [
				...inputs,
				...(showIntermediateColumns
					? intermediateExpressions.map((_, i) => `intermediate_${i}`)
					: []),
				outputVariable,
			];

			for (const columnName of allColumns) {
				const key = `${rowIndex}_${columnName}`;
				const userValue = userAnswers.get(key) === "1";

				if (matchedCorrectIndex !== -1) {
					const correctRow = truthTableData[matchedCorrectIndex];
					const isCorrectValue = userValue === correctRow[columnName];
					validations.set(key, {
						rowIndex,
						columnName,
						status: isCorrectValue ? "correct" : "incorrect",
					});
				} else {
					validations.set(key, {
						rowIndex,
						columnName,
						status: "incorrect",
					});
				}
			}
		}

		setCellValidations(validations);
		setIsAnswered(true);
		setIsCorrect(validationResult.isCorrect);

		if (validationResult.isCorrect) {
			setFeedbackMessage("Expert Mode: Perfect! All rows are correct!");
			if (onScoreUpdate) {
				onScoreUpdate(
					true,
					"Truth Table",
					"truthTable",
					currentLevel,
					true, // Expert mode
				);
			}
		} else {
			setFeedbackMessage(
				`Expert Mode: ${validationResult.correctRows}/${truthTableData.length} rows correct.`,
			);
			if (onScoreUpdate) {
				onScoreUpdate(
					false,
					"Truth Table",
					"truthTable",
					currentLevel,
					true, // Expert mode
				);
			}
		}
	}, [
		userAnswers,
		truthTableData,
		inputs,
		intermediateExpressions,
		outputVariable,
		showIntermediateColumns,
		currentLevel,
		onScoreUpdate,
	]); /**
	 * Sets the difficulty level and generates a new question
	 */
	const setLevel = useCallback((level: TruthTableDifficulty) => {
		setCurrentLevel(level);
		// Question will be generated by useEffect or manually called
	}, []);

	/**
	 * Toggles intermediate columns and recalculates table data
	 */
	const handleSetShowIntermediateColumns = useCallback(
		(show: boolean) => {
			setShowIntermediateColumns(show);
			// Recalculate table data with new setting
			if (currentExpression) {
				const data = calculateTruthTableData(
					currentExpression,
					inputs,
					intermediateExpressions,
					show,
				);
				setTruthTableData(data);
			}
		},
		[currentExpression, inputs, intermediateExpressions],
	);

	/**
	 * Toggles expert mode
	 */
	const handleSetExpertMode = useCallback((expert: boolean) => {
		setExpertMode(expert);
		// Clear validations when switching modes
		setCellValidations(new Map());
		setIsAnswered(false);
		setIsCorrect(null);
		setFeedbackMessage("");
	}, []);

	return {
		// State
		currentLevel,
		currentExpression,
		inputs,
		intermediateExpressions,
		truthTableData,
		outputVariable,

		// User interaction
		userAnswers,
		cellValidations,
		isAnswered,
		isCorrect,
		feedbackMessage,

		// Options
		showIntermediateColumns,
		expertMode,

		// Methods
		setLevel,
		setShowIntermediateColumns: handleSetShowIntermediateColumns,
		setExpertMode: handleSetExpertMode,
		setUserAnswer,
		checkAnswer,
		generateNewQuestion,
	};
}
