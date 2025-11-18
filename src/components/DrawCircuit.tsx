import { useCallback, useEffect, useRef, useState } from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { Button } from "@/components/ui/button";
import { CircuitDrawer } from "@/lib/CircuitDrawer";
import {
	convertToNotation,
	getNotationType,
	type NotationType,
	setNotationType,
} from "@/lib/config";
import {
	type DrawCircuitDifficulty,
	useDrawCircuit,
} from "@/lib/useDrawCircuit";
import { useTheme } from "@/contexts/theme-provider";

/**
 * DrawCircuit Component - Interactive Circuit Drawing Game
 *
 * Users draw logic circuits using gates to match a target Boolean expression.
 * Supports 5 difficulty levels: Easy, Medium, Hard, Expert, A-Level
 */

interface DrawCircuitProps {
	/** Callback to record score with ScoreManager */
	onScoreUpdate?: (isCorrect: boolean, questionType: string) => void;
}

const DIFFICULTY_LABELS = {
	1: "Easy",
	2: "Medium",
	3: "Hard",
	4: "Expert",
	5: "A-Level",
} as const;

// Constant IDs for canvas and interpreted expression display
const CANVAS_ID = "draw-circuit-canvas";
const INTERPRETED_EXPR_ID = "interpreted-expression";

export function DrawCircuit({ onScoreUpdate }: DrawCircuitProps) {
	const { theme } = useTheme();
	const {
		currentLevel,
		currentExpression,
		questionId,
		isAnswered,
		isCorrect,
		feedbackMessage,
		helpEnabled,
		setDifficulty,
		generateQuestion,
		checkAnswer,
		nextQuestion,
		toggleHelp,
	} = useDrawCircuit(onScoreUpdate);

	const [notationType, setNotationTypeState] = useState<NotationType>("word");
	const [currentInterpretedExpression, setCurrentInterpretedExpression] =
		useState("Q = ?");
	const [removeButtonEnabled, setRemoveButtonEnabled] = useState(false);

	const circuitDrawerRef = useRef<CircuitDrawer | null>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const interpretedExprRef = useRef<HTMLDivElement>(null);
	const isAnsweredRef = useRef(isAnswered);

	// Determine actual theme (resolve "system" to "light" or "dark")
	const actualTheme = 
		theme === "system"
			? window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light"
			: theme;

	// Helper function to get the correct PNG path based on theme
	const getGateImagePath = (gateName: string) => {
		const suffix = actualTheme === "dark" ? "-dark" : "";
		return `/img/png/${gateName}${suffix}.png`;
	};

	// Keep isAnsweredRef in sync with isAnswered
	useEffect(() => {
		isAnsweredRef.current = isAnswered;
	}, [isAnswered]);

	// Initialize notation from localStorage
	useEffect(() => {
		setNotationTypeState(getNotationType());
	}, []);

	// Initialize CircuitDrawer and generate first question
	// questionId is included to force re-initialization even when expression is the same
	// biome-ignore lint/correctness/useExhaustiveDependencies: questionId is intentionally included to trigger reset when same expression appears
	useEffect(() => {
		if (canvasRef.current && currentExpression) {
			// Clean up existing drawer
			if (circuitDrawerRef.current) {
				circuitDrawerRef.current.destroy();
			}

			// Create new drawer - use ref to access current isAnswered value
			circuitDrawerRef.current = new CircuitDrawer(
				CANVAS_ID,
				() => isAnsweredRef.current,
				notationType,
				(expr) => setCurrentInterpretedExpression(expr),
				(enabled) => setRemoveButtonEnabled(enabled),
			);

			// Start the drawer with current expression
			circuitDrawerRef.current.start(
				currentExpression,
				interpretedExprRef.current,
				currentLevel,
			);
		}

		// Cleanup on unmount
		return () => {
			if (circuitDrawerRef.current) {
				circuitDrawerRef.current.destroy();
			}
		};
	}, [currentExpression, currentLevel, notationType, questionId]);

	// Update notation when it changes
	useEffect(() => {
		if (circuitDrawerRef.current) {
			circuitDrawerRef.current.updateNotationType(notationType);
		}
	}, [notationType]);

	const handleDifficultyChange = (
		event: React.ChangeEvent<HTMLSelectElement>,
	) => {
		const newDifficulty = Number.parseInt(
			event.target.value,
			10,
		) as DrawCircuitDifficulty;
		setDifficulty(newDifficulty);
		// setDifficulty now generates a new question automatically
	};

	const handleNotationToggle = (checked: boolean) => {
		const newNotation: NotationType = checked ? "symbol" : "word";
		setNotationTypeState(newNotation);
		setNotationType(newNotation);
	};

	const handleCheckAnswer = useCallback(() => {
		if (circuitDrawerRef.current) {
			const userExpression = circuitDrawerRef.current.getCurrentExpression();
			checkAnswer(userExpression);
		}
	}, [checkAnswer]);

	const handleResetCircuit = () => {
		if (circuitDrawerRef.current) {
			circuitDrawerRef.current.reset();
		}
	};

	const handleRemoveSelected = () => {
		if (circuitDrawerRef.current) {
			circuitDrawerRef.current.removeSelected();
		}
	};

	const handleNextQuestion = useCallback(() => {
		nextQuestion();
	}, [nextQuestion]);

	const handleRandomQuestion = () => {
		generateQuestion();
	};

	// Global keyboard handler for Enter key (defined after handlers)
	useEffect(() => {
		const handleGlobalKeyPress = (event: KeyboardEvent) => {
			if (event.key === "Enter") {
				event.preventDefault();
				if (isAnswered) {
					// Move to next question when answered
					handleNextQuestion();
				} else {
					// Mark answer when not answered
					handleCheckAnswer();
				}
			}
		};

		window.addEventListener("keydown", handleGlobalKeyPress);
		return () => window.removeEventListener("keydown", handleGlobalKeyPress);
	}, [isAnswered, handleCheckAnswer, handleNextQuestion]);

	// Determine target expression for display
	const targetExpressionDisplay = currentExpression
		? convertToNotation(currentExpression, notationType)
		: "";

	return (
		<div className="flex flex-col gap-4">
			{/* Control Panel */}
			<ControlPanel
				difficulty={{
					value: currentLevel,
					onChange: (level) =>
						handleDifficultyChange({
							target: { value: level.toString() },
						} as React.ChangeEvent<HTMLSelectElement>),
					options: Object.entries(DIFFICULTY_LABELS).map(([value, label]) => [
						Number(value),
						label,
					]),
				}}
				notation={{
					value: notationType,
					onChange: handleNotationToggle,
				}}
				onShuffle={handleRandomQuestion}
				additionalControls={
					<div className="flex items-center gap-2">
						<label className="flex items-center gap-2 text-sm text-stats-label whitespace-nowrap cursor-pointer">
							<input
								type="checkbox"
								checked={helpEnabled}
								onChange={() => toggleHelp()}
								className="h-4 w-4 rounded border-checkbox-label-border text-stats-points focus:ring-2 focus:ring-ring cursor-pointer"
							/>
							Show expression so far
						</label>
					</div>
				}
			/>

			{/* Question Title */}
			<div className="text-center">
				<h2 className="text-xl font-semibold sm:text-2xl">
					Draw the circuit for this expression:
				</h2>
			</div>

			{/* Target Expression Display */}
			<div className="border-2 rounded-lg bg-card">
				<div className="bg-stats-card-bg rounded-lg p-3 text-center">
					<div className="text-xl font-semibold font-mono">
						{targetExpressionDisplay}
					</div>
				</div>
			</div>

			{/* Circuit Drawing Area */}
			<div className="flex gap-6 flex-wrap lg:flex-nowrap">
				{/* Toolbox */}
				<div className="shrink-0 w-full sm:w-40 md:w-48 bg-stats-card-bg rounded-lg p-3 sm:p-4 border-2">
					<h3 className="text-center text-stats-label font-semibold mb-3 sm:mb-4 text-base sm:text-lg">
						Logic Gates
					</h3>

					{/* Gate buttons */}
					<div className="space-y-2">
						<div
							className="gate"
							draggable="true"
							id="drag-AND"
							data-gate-type="AND"
						>
							<div className="gate-icon">
								<img
									src={getGateImagePath("and")}
									alt="AND Gate"
									className="gate-svg"
								/>
							</div>
						</div>
						<div
							className="gate"
							draggable="true"
							id="drag-OR"
							data-gate-type="OR"
						>
							<div className="gate-icon">
								<img src={getGateImagePath("or")} alt="OR Gate" className="gate-svg" />
							</div>
						</div>
						<div
							className="gate"
							draggable="true"
							id="drag-NOT"
							data-gate-type="NOT"
						>
							<div className="gate-icon">
								<img
									src={getGateImagePath("not")}
									alt="NOT Gate"
									className="gate-svg"
								/>
							</div>
						</div>
						<div
							className="gate"
							draggable="true"
							id="drag-XOR"
							data-gate-type="XOR"
							style={{ display: currentLevel === 5 ? "flex" : "none" }}
						>
							<div className="gate-icon">
								<img
									src={getGateImagePath("xor")}
									alt="XOR Gate"
									className="gate-svg"
								/>
							</div>
						</div>
					</div>

					{/* Toolbox Buttons */}
					<div className="mt-6 space-y-2">
						<Button
							variant="destructive"
							size="sm"
							className="w-full"
							onClick={handleRemoveSelected}
							disabled={!removeButtonEnabled}
						>
							Remove Selected
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="w-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
							onClick={handleResetCircuit}
							disabled={isAnswered}
						>
							Reset
						</Button>
					</div>
				</div>

				{/* Canvas Container */}
				<div className="flex-1 min-w-0 bg-stats-card-bg border-2 rounded-lg flex items-center justify-center overflow-hidden">
					<canvas
						ref={canvasRef}
						id={CANVAS_ID}
						width="750"
						height="500"
						className="max-w-full h-auto cursor-crosshair"
						style={{ touchAction: "none" }}
					/>
				</div>
			</div>

			{/* Help Display (Show current circuit interpretation) */}
			{helpEnabled && (
				<div className="bg-stats-card-bg border-2 rounded-lg p-4">
					<div
						ref={interpretedExprRef}
						id={INTERPRETED_EXPR_ID}
						className="text-lg font-mono text-center text-stats-label"
					>
						{convertToNotation(currentInterpretedExpression, notationType)}
					</div>
				</div>
			)}

			{/* Feedback and Action Buttons */}
			{feedbackMessage && (
				<div
					className={`rounded-lg p-4 text-center font-medium border-2 ${
						isCorrect
							? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700"
							: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700"
					}`}
					dangerouslySetInnerHTML={{ __html: feedbackMessage }}
				/>
			)}

			<div className="flex justify-center gap-4">
				{!isAnswered && (
					<div className="max-w-md mx-auto w-full">
						<Button
							onClick={handleCheckAnswer}
							size="lg"
							className="w-full text-lg py-6 bg-action-button-bg hover:bg-action-button-bg-hover text-action-button-text"
						>
							Mark My Answer
						</Button>
					</div>
				)}
				{(isAnswered || feedbackMessage) && (
					<div className="max-w-md mx-auto w-full">
						<Button
							onClick={handleNextQuestion}
							size="lg"
							className="w-full text-lg py-6 bg-action-button-bg hover:bg-action-button-bg-hover text-action-button-text"
						>
							Next Question →
						</Button>
					</div>
				)}
			</div>

			{/* Keyboard Shortcuts Help */}
			<div className="py-2 text-sm text-center text-stats-label font-medium">
				{isAnswered
					? "💡 Press Enter for next question"
					: "💡 Press Enter to check answer"}
			</div>
		</div>
	);
}
