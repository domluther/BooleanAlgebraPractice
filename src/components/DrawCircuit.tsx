import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
	convertToNotation,
	getNotationType,
	type NotationType,
	setNotationType,
} from "@/lib/config";
import { useDrawCircuit, type DrawCircuitDifficulty } from "@/lib/useDrawCircuit";
import { CircuitDrawer } from "@/lib/CircuitDrawer";

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

export function DrawCircuit({ onScoreUpdate }: DrawCircuitProps) {
	const difficultySelectId = useId();
	const canvasId = useId();
	const interpretedExprId = useId();

	const {
		currentLevel,
		currentExpression,
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
	const [currentInterpretedExpression, setCurrentInterpretedExpression] = useState("Q = ?");
	const [removeButtonEnabled, setRemoveButtonEnabled] = useState(false);

	const circuitDrawerRef = useRef<CircuitDrawer | null>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const interpretedExprRef = useRef<HTMLDivElement>(null);

	// Initialize notation from localStorage
	useEffect(() => {
		setNotationTypeState(getNotationType());
	}, []);

	// Initialize CircuitDrawer and generate first question
	useEffect(() => {
		if (canvasRef.current && currentExpression) {
			// Clean up existing drawer
			if (circuitDrawerRef.current) {
				circuitDrawerRef.current.destroy();
			}

			// Create new drawer
			circuitDrawerRef.current = new CircuitDrawer(
				canvasId,
				() => isAnswered,
				notationType,
				(expr) => setCurrentInterpretedExpression(expr),
				(enabled) => setRemoveButtonEnabled(enabled)
			);

			// Start the drawer with current expression
			circuitDrawerRef.current.start(
				currentExpression,
				interpretedExprRef.current,
				currentLevel
			);
		}

		// Cleanup on unmount
		return () => {
			if (circuitDrawerRef.current) {
				circuitDrawerRef.current.destroy();
			}
		};
	}, [currentExpression, currentLevel, canvasId, notationType]);

	// Update notation when it changes
	useEffect(() => {
		if (circuitDrawerRef.current) {
			circuitDrawerRef.current.updateNotationType(notationType);
		}
	}, [notationType]);

	// Generate initial question
	useEffect(() => {
		if (!currentExpression) {
			generateQuestion();
		}
	}, [currentExpression, generateQuestion]);

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

	const handleCheckAnswer = () => {
		if (circuitDrawerRef.current) {
			const userExpression = circuitDrawerRef.current.getCurrentExpression();
			checkAnswer(userExpression);
		}
	};

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

	const handleNextQuestion = () => {
		nextQuestion();
	};

	const handleRandomQuestion = () => {
		generateQuestion();
	};

	// Determine target expression for display
	const targetExpressionDisplay = currentExpression
		? convertToNotation(currentExpression, notationType)
		: "";

	return (
		<div className="flex flex-col gap-4">
			{/* Control Panel */}
			<div className="p-4 rounded-lg border-2 bg-stats-card-bg border-stats-card-border">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					{/* Difficulty Selector */}
					<div className="flex items-center gap-3">
						<label
							htmlFor={difficultySelectId}
							className="font-medium text-sm whitespace-nowrap text-stats-label"
						>
							Difficulty:
						</label>
						<select
							id={difficultySelectId}
							value={currentLevel}
							onChange={handleDifficultyChange}
							className="px-3 py-1.5 rounded-md border-2 bg-background border-checkbox-label-border hover:border-checkbox-label-border-hover text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:border-checkbox-label-border-hover"
						>
							{Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</select>
					</div>

					{/* Help Toggle */}
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

					{/* Notation Toggle */}
					<div className="flex items-center gap-3">
						<span className="text-sm font-medium text-stats-label">Words</span>
						<Switch
							checked={notationType === "symbol"}
							onCheckedChange={handleNotationToggle}
							aria-label="Toggle between word and symbol notation"
							className="data-[state=checked]:bg-stats-points data-[state=unchecked]:bg-checkbox-label-border"
						/>
						<span className="text-sm font-medium text-stats-label">
							Symbols
						</span>
					</div>

					{/* Random Button */}
					<Button
						variant="outline"
						size="sm"
						onClick={handleRandomQuestion}
						title="Pick a random expression from current difficulty"
						className="text-xl px-3 border-2 border-checkbox-label-border hover:bg-checkbox-label-bg-hover hover:border-checkbox-label-border-hover"
					>
						🎲
					</Button>
				</div>
			</div>

			{/* Question Title */}
			<div className="text-center">
				<h2 className="text-xl font-semibold sm:text-2xl">
					Draw the circuit for this expression:
				</h2>
			</div>

			{/* Target Expression Display */}
			<div className="border-2 rounded-lg bg-card border-stats-card-border">
				<div className="bg-stats-card-bg rounded-lg p-3 text-center">
					<div className="text-xl font-semibold font-mono">
						{targetExpressionDisplay}
					</div>
				</div>
			</div>

			{/* Circuit Drawing Area */}
			<div className="flex gap-6 flex-wrap lg:flex-nowrap">
				{/* Toolbox */}
				<div className="flex-shrink-0 w-full sm:w-48 bg-stats-card-bg rounded-lg p-4 border-2 border-stats-card-border">
					<h3 className="text-center text-stats-label font-semibold mb-4 text-lg">
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
									src="/img/svg/and.svg"
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
								<img
									src="/img/svg/or.svg"
									alt="OR Gate"
									className="gate-svg"
								/>
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
									src="/img/svg/not.svg"
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
									src="/img/svg/xor.svg"
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
							className="w-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
							onClick={handleResetCircuit}
							disabled={isAnswered}
						>
							Reset
						</Button>
					</div>
				</div>

				{/* Canvas Container */}
				<div className="flex-1 min-w-0 bg-stats-card-bg border-2 border-stats-card-border rounded-lg flex items-center justify-center overflow-hidden">
					<canvas
						ref={canvasRef}
						id={canvasId}
						width="750"
						height="500"
						className="max-w-full h-auto cursor-crosshair"
						style={{ touchAction: "none" }}
					/>
				</div>
			</div>

			{/* Help Display (Show current circuit interpretation) */}
			{helpEnabled && (
				<div className="bg-stats-card-bg border-2 border-stats-card-border rounded-lg p-4">
					<div
						ref={interpretedExprRef}
						id={interpretedExprId}
						className="text-lg font-mono text-center text-stats-label"
					>
						{currentInterpretedExpression}
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
					<Button onClick={handleCheckAnswer} size="lg">
						Check My Circuit
					</Button>
				)}
				{(isAnswered || feedbackMessage) && (
					<Button onClick={handleNextQuestion} size="lg" variant="secondary">
						Next Question
					</Button>
				)}
			</div>
		</div>
	);
}
