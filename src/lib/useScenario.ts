// src/lib/useScenario.ts
// Custom hook for Scenario Mode
// Orchestrates expression/truth-table/draw-circuit question types with real-world scenarios

import { useCallback, useEffect, useState } from "react";
import {
	areExpressionsLogicallyEquivalent,
	checkExpressionAnswer as checkExpression,
	generateAllAcceptedAnswers,
} from "./expressionUtils";
import { getRandomScenario, type ScenarioQuestion } from "./scenarioData";
import {
	calculateTruthTableData,
	parseExpressionForTable,
	type TruthTableRow,
} from "./truthTableUtils";

export type ScenarioDifficulty = 1 | 2 | 3 | 4;
export type QuestionType = "expression" | "truth-table" | "draw-circuit";

interface UseScenarioProps {
	onScoreUpdate?: (
		isCorrect: boolean,
		questionType: string,
		mode: string,
		level: number,
		isExpert: boolean,
	) => void;
}

interface UseScenarioReturn {
	// Scenario state
	currentLevel: ScenarioDifficulty;
	currentScenario: ScenarioQuestion | null;
	questionType: QuestionType;

	// Common state
	isAnswered: boolean;
	isCorrect: boolean | null;
	feedbackMessage: string;

	// Expression state
	userAnswer: string;
	setUserAnswer: (answer: string) => void;

	// Truth table state
	inputs: string[];
	intermediateExpressions: string[];
	truthTableData: TruthTableRow[];
	outputVariable: string;
	userAnswers: Record<string, string>;
	cellValidations: Record<string, boolean>;
	showIntermediateColumns: boolean;
	expertMode: boolean;
	setShowIntermediateColumns: (show: boolean) => void;
	setExpertMode: (expert: boolean) => void;
	setUserAnswer_TruthTable: (
		rowIndex: number,
		columnName: string,
		value: string,
	) => void;

	// Circuit drawing state
	currentExpression: string;
	helpEnabled: boolean;
	toggleHelp: () => void;

	// Methods
	setDifficulty: (level: ScenarioDifficulty) => void;
	generateQuestion: () => void;
	checkAnswer: (notationType?: "symbol" | "word") => void;
	checkCircuitAnswer: (userExpression: string) => void;
	nextQuestion: () => void;
}

// LocalStorage key for difficulty persistence
const STORAGE_KEY = "scenarioDifficulty";

/**
 * Get initial difficulty from localStorage or default to 1
 */
function getInitialDifficulty(): ScenarioDifficulty {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored) {
		const parsed = Number.parseInt(stored, 10);
		if (parsed >= 1 && parsed <= 4) {
			return parsed as ScenarioDifficulty;
		}
	}
	return 1;
}

/**
 * Save difficulty to localStorage
 */
function saveDifficulty(level: ScenarioDifficulty): void {
	localStorage.setItem(STORAGE_KEY, level.toString());
}

/**
 * Generate initial question based on saved difficulty
 */
function generateInitialQuestion(
	level: ScenarioDifficulty,
): ScenarioQuestion | null {
	return getRandomScenario(level);
}

/**
 * Randomly select a question type
 */
function selectRandomQuestionType(): QuestionType {
	const types: QuestionType[] = ["expression", "truth-table", "draw-circuit"];
	return types[Math.floor(Math.random() * types.length)];
}

export function useScenario({
	onScoreUpdate,
}: UseScenarioProps): UseScenarioReturn {
	// Initialize state
	const [currentLevel, setCurrentLevel] = useState<ScenarioDifficulty>(
		getInitialDifficulty(),
	);
	const [questionType, setQuestionType] = useState<QuestionType>(
		selectRandomQuestionType(),
	);
	const [currentScenario, setCurrentScenario] =
		useState<ScenarioQuestion | null>(() =>
			generateInitialQuestion(currentLevel),
		);

	// Common state
	const [isAnswered, setIsAnswered] = useState(false);
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
	const [feedbackMessage, setFeedbackMessage] = useState("");

	// Track attempt state for scoring (especially for circuit drawing)
	const [hasAttemptedCurrentQuestion, setHasAttemptedCurrentQuestion] =
		useState(false);
	const [questionWasAnsweredCorrectly, setQuestionWasAnsweredCorrectly] =
		useState(false);

	// Expression state
	const [userAnswer, setUserAnswer] = useState("");

	// Truth table state
	const [inputs, setInputs] = useState<string[]>([]);
	const [intermediateExpressions, setIntermediateExpressions] = useState<
		string[]
	>([]);
	const [truthTableData, setTruthTableData] = useState<TruthTableRow[]>([]);
	const [outputVariable, setOutputVariable] = useState("Q");
	const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
	const [cellValidations, setCellValidations] = useState<
		Record<string, boolean>
	>({});
	const [showIntermediateColumns, setShowIntermediateColumns] = useState(false);
	const [expertMode, setExpertMode] = useState(false);

	// Circuit drawing state
	const [helpEnabled, setHelpEnabled] = useState(false);

	// Generate truth table when scenario changes (for truth-table type)
	useEffect(() => {
		if (currentScenario && questionType === "truth-table") {
			const parsedData = parseExpressionForTable(currentScenario.expression);
			setInputs(parsedData.inputs);
			setIntermediateExpressions(parsedData.intermediateExpressions);

			// Extract output variable from expression (e.g., "Q = A AND B" -> "Q")
			const outputVar = currentScenario.expression.split(" = ")[0].trim();
			setOutputVariable(outputVar);

			const data = calculateTruthTableData(
				currentScenario.expression,
				parsedData.inputs,
				parsedData.intermediateExpressions,
				showIntermediateColumns,
			);
			setTruthTableData(data);

			// Reset user answers
			setUserAnswers({});
			setCellValidations({});
		}
	}, [currentScenario, questionType, showIntermediateColumns]);

	const setDifficulty = useCallback(
		(level: ScenarioDifficulty) => {
			// If moving away from circuit question that was attempted but not answered correctly,
			// record it as an incorrect attempt
			if (
				questionType === "draw-circuit" &&
				currentScenario &&
				hasAttemptedCurrentQuestion &&
				!questionWasAnsweredCorrectly &&
				onScoreUpdate
			) {
				onScoreUpdate(false, "Scenario", "scenario", currentLevel, false);
			}

			setCurrentLevel(level);
			saveDifficulty(level);

			// Generate new question with the new level
			const newScenario = getRandomScenario(level);
			const newQuestionType = selectRandomQuestionType();

			setCurrentScenario(newScenario);
			setQuestionType(newQuestionType);
			setIsAnswered(false);
			setIsCorrect(null);
			setFeedbackMessage("");
			setUserAnswer("");
			setUserAnswers({});
			setCellValidations({});
			setHelpEnabled(false);
			setHasAttemptedCurrentQuestion(false);
			setQuestionWasAnsweredCorrectly(false);
		},
		[
			questionType,
			currentScenario,
			hasAttemptedCurrentQuestion,
			questionWasAnsweredCorrectly,
			currentLevel,
			onScoreUpdate,
		],
	);

	const generateQuestion = useCallback(() => {
		// If moving away from circuit question that was attempted but not answered correctly,
		// record it as an incorrect attempt
		if (
			questionType === "draw-circuit" &&
			currentScenario &&
			hasAttemptedCurrentQuestion &&
			!questionWasAnsweredCorrectly &&
			onScoreUpdate
		) {
			onScoreUpdate(false, "Scenario", "scenario", currentLevel, false);
		}

		const newScenario = getRandomScenario(currentLevel);
		const newQuestionType = selectRandomQuestionType();

		setCurrentScenario(newScenario);
		setQuestionType(newQuestionType);
		setIsAnswered(false);
		setIsCorrect(null);
		setFeedbackMessage("");
		setUserAnswer("");
		setUserAnswers({});
		setCellValidations({});
		setHelpEnabled(false);
		setHasAttemptedCurrentQuestion(false);
		setQuestionWasAnsweredCorrectly(false);
	}, [
		questionType,
		currentScenario,
		hasAttemptedCurrentQuestion,
		questionWasAnsweredCorrectly,
		currentLevel,
		onScoreUpdate,
	]);

	const setUserAnswer_TruthTable = useCallback(
		(rowIndex: number, columnName: string, value: string) => {
			const key = `${rowIndex}-${columnName}`;
			setUserAnswers((prev) => ({ ...prev, [key]: value }));
		},
		[],
	);

	const toggleHelp = useCallback(() => {
		setHelpEnabled((prev) => !prev);
	}, []);

	const checkExpressionAnswer = useCallback(
		(notationType: "symbol" | "word" = "word") => {
			if (!currentScenario) return;

			const result = checkExpression(
				userAnswer,
				currentScenario.expression,
				notationType,
			);

			setIsCorrect(result.isCorrect);
			setIsAnswered(true);
			setFeedbackMessage(result.message);

			// Record score
			if (onScoreUpdate) {
				onScoreUpdate(
					result.isCorrect,
					"Scenario",
					"scenario",
					currentLevel,
					false,
				);
			}
		},
		[currentScenario, userAnswer, currentLevel, onScoreUpdate],
	);

	const checkTruthTableAnswer = useCallback(() => {
		if (!currentScenario) return;

		let allCorrect = true;
		const newValidations: Record<string, boolean> = {};

		// Determine which columns to check
		const columnsToCheck: string[] = [];

		if (expertMode) {
			// In expert mode, check all inputs
			columnsToCheck.push(...inputs);
		}

		// Always check intermediate columns if shown
		if (showIntermediateColumns) {
			for (let i = 0; i < intermediateExpressions.length; i++) {
				columnsToCheck.push(`intermediate_${i}`);
			}
		}

		// Always check output
		columnsToCheck.push(outputVariable);

		// Validate each cell
		for (let rowIndex = 0; rowIndex < truthTableData.length; rowIndex++) {
			const row = truthTableData[rowIndex];

			for (const columnName of columnsToCheck) {
				const key = `${rowIndex}-${columnName}`;
				const userValue = userAnswers[key] || "";

				// Get expected value
				let expectedValue: string;
				if (columnName.startsWith("intermediate_")) {
					const index = Number.parseInt(
						columnName.replace("intermediate_", ""),
						10,
					);
					expectedValue = row[`intermediate_${index}`] ? "1" : "0";
				} else {
					expectedValue = row[columnName] ? "1" : "0";
				}

				const isCorrectCell = userValue === expectedValue;
				newValidations[key] = isCorrectCell;

				if (!isCorrectCell) {
					allCorrect = false;
				}
			}
		}

		setCellValidations(newValidations);
		setIsCorrect(allCorrect);
		setIsAnswered(true);

		if (allCorrect) {
			setFeedbackMessage("✅ Correct! Well done!");
		} else {
			setFeedbackMessage(
				"❌ Some cells are incorrect. Check the highlighted cells.",
			);
		}

		// Record score
		if (onScoreUpdate) {
			onScoreUpdate(
				allCorrect,
				"Scenario",
				"scenario",
				currentLevel,
				expertMode,
			);
		}
	}, [
		currentScenario,
		truthTableData,
		userAnswers,
		inputs,
		intermediateExpressions,
		outputVariable,
		expertMode,
		showIntermediateColumns,
		currentLevel,
		onScoreUpdate,
	]);

	const checkCircuitAnswer = useCallback(
		(userExpression: string) => {
			if (!currentScenario) return;
			if (isAnswered) return; // Don't check if already answered correctly

			const trimmedAnswer = userExpression.trim();
			if (!trimmedAnswer || trimmedAnswer === "Q = ?") {
				setFeedbackMessage("Please draw a circuit");
				setIsCorrect(false);
				return;
			}

			// Mark that user has attempted this question
			setHasAttemptedCurrentQuestion(true);

			const acceptedAnswers = generateAllAcceptedAnswers(
				currentScenario.expression,
			);
			const logicallyEquivalent = areExpressionsLogicallyEquivalent(
				trimmedAnswer,
				currentScenario.expression,
			);

			const correct =
				acceptedAnswers.includes(trimmedAnswer) || logicallyEquivalent;

			if (correct) {
				// Only record score and lock answer when correct
				if (onScoreUpdate) {
					onScoreUpdate(true, "Scenario", "scenario", currentLevel, false);
				}
				setQuestionWasAnsweredCorrectly(true);
				setFeedbackMessage("✅ Correct! The circuit matches the expression.");
				setIsCorrect(true);
				setIsAnswered(true); // Lock the answer only when correct
			} else {
				// Allow continued editing - don't lock the answer
				setFeedbackMessage(
					`❌ Incorrect. Your circuit diagram does not match the target expression.<br/>You can continue editing your circuit and try again, or move on to the next question.`,
				);
				setIsCorrect(false);
				// Don't set isAnswered to true - allow user to keep editing
				// Don't record score yet - wait until they get it right or move on
			}
		},
		[currentScenario, currentLevel, onScoreUpdate, isAnswered],
	);

	const checkAnswer = useCallback(
		(notationType: "symbol" | "word" = "word") => {
			switch (questionType) {
				case "expression":
					checkExpressionAnswer(notationType);
					break;
				case "truth-table":
					checkTruthTableAnswer();
					break;
				case "draw-circuit":
					// For draw-circuit, we need the expression from CircuitDrawer
					// This will be called from the component with the expression
					break;
			}
		},
		[questionType, checkExpressionAnswer, checkTruthTableAnswer],
	);

	const nextQuestion = useCallback(() => {
		generateQuestion();
	}, [generateQuestion]);

	return {
		// Scenario state
		currentLevel,
		currentScenario,
		questionType,

		// Common state
		isAnswered,
		isCorrect,
		feedbackMessage,

		// Expression state
		userAnswer,
		setUserAnswer,

		// Truth table state
		inputs,
		intermediateExpressions,
		truthTableData,
		outputVariable,
		userAnswers,
		cellValidations,
		showIntermediateColumns,
		expertMode,
		setShowIntermediateColumns,
		setExpertMode,
		setUserAnswer_TruthTable,

		// Circuit drawing state
		currentExpression: currentScenario?.expression || "",
		helpEnabled,
		toggleHelp,

		// Methods
		setDifficulty,
		generateQuestion,
		checkAnswer,
		checkCircuitAnswer, // Export this for component to call with expression
		nextQuestion,
	};
}
