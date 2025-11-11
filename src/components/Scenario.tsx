import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
	convertToNotation,
	getNotationType,
	type NotationType,
	setNotationType,
} from "@/lib/config";
import { useScenario, type ScenarioDifficulty } from "@/lib/useScenario";
import { ControlPanel } from "@/components/ControlPanel";
import { CircuitDrawer } from "@/lib/CircuitDrawer";

/**
 * Scenario Component - Real-World Boolean Logic Scenarios
 *
 * Presents real-world scenarios and asks users to solve them using one of three question types:
 * - Expression Writing: Write the Boolean expression
 * - Truth Table: Fill in the truth table
 * - Draw Circuit: Draw the logic circuit
 *
 * Supports 4 difficulty levels
 */

interface ScenarioProps {
	/** Callback to record score with ScoreManager */
	onScoreUpdate?: (
		isCorrect: boolean,
		questionType: string,
		mode: string,
		level: number,
		isExpert: boolean,
	) => void;
}

const DIFFICULTY_LABELS = {
	1: "Easy",
	2: "Medium",
	3: "Hard",
	4: "A-Level",
} as const;

const SYMBOL_BUTTONS = [
	{ word: "AND", symbol: "∧", shortcut: "^" },
	{ word: "OR", symbol: "∨", shortcut: "v" },
	{ word: "NOT", symbol: "¬", shortcut: "!" },
	{ word: "XOR", symbol: "⊻", shortcut: "" },
];

// Constants for canvas IDs
const CANVAS_ID = "scenario-circuit-canvas";
const INTERPRETED_EXPR_ID = "scenario-interpreted-expression";

export function Scenario({ onScoreUpdate }: ScenarioProps) {
	const {
		currentLevel,
		currentScenario,
		questionType,
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

		// Circuit state
		currentExpression,
		helpEnabled,
		toggleHelp,

		// Methods
		setDifficulty,
		generateQuestion,
		checkAnswer,
		checkCircuitAnswer,
		nextQuestion,
	} = useScenario({ onScoreUpdate });

	const [notationType, setNotationTypeState] = useState<NotationType>(
		getNotationType(),
	);

	// Circuit drawing refs
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const interpretedExprRef = useRef<HTMLDivElement>(null);
	const circuitDrawerRef = useRef<CircuitDrawer | null>(null);
	const [currentInterpretedExpression, setCurrentInterpretedExpression] =
		useState("Q = ?");
	const [removeButtonEnabled, setRemoveButtonEnabled] = useState(false);

	// Expression input ref
	const inputRef = useRef<HTMLInputElement>(null);

	const handleNotationToggle = (checked: boolean) => {
		const newNotation: NotationType = checked ? "symbol" : "word";
		setNotationTypeState(newNotation);
		setNotationType(newNotation);
	};

	// Initialize CircuitDrawer for draw-circuit question type
	useEffect(() => {
		if (
			questionType === "draw-circuit" &&
			canvasRef.current &&
			currentExpression
		) {
			// Clean up existing drawer
			if (circuitDrawerRef.current) {
				circuitDrawerRef.current.destroy();
			}

			// Create new drawer
			circuitDrawerRef.current = new CircuitDrawer(
				CANVAS_ID,
				() => isAnswered,
				notationType,
				(expr) => setCurrentInterpretedExpression(expr),
				(enabled) => setRemoveButtonEnabled(enabled),
			);

			// Start with the target expression
			circuitDrawerRef.current.start(
				currentExpression,
				interpretedExprRef.current,
				currentLevel,
			);
		}

		// Cleanup on unmount or question type change
		return () => {
			if (circuitDrawerRef.current) {
				circuitDrawerRef.current.destroy();
				circuitDrawerRef.current = null;
			}
		};
	}, [currentExpression, currentLevel, questionType, notationType, isAnswered]);

	// Update notation when it changes (for circuit drawer)
	useEffect(() => {
		if (circuitDrawerRef.current && questionType === "draw-circuit") {
			circuitDrawerRef.current.updateNotationType(notationType);
		}
	}, [notationType, questionType]);

	const handleCheckAnswer = () => {
		if (questionType === "draw-circuit") {
			// Get expression from circuit drawer
			if (circuitDrawerRef.current) {
				const userExpression = circuitDrawerRef.current.getCurrentExpression();
				checkCircuitAnswer(userExpression);
			}
		} else {
			checkAnswer();
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

	const insertSymbol = (symbol: string) => {
		if (inputRef.current) {
			const input = inputRef.current;
			const cursorPos = input.selectionStart || 0;
			const currentValue = input.value;
			const newValue =
				currentValue.slice(0, cursorPos) +
				` ${symbol} ` +
				currentValue.slice(cursorPos);

			setUserAnswer(newValue);

			// Move cursor after inserted symbol
			setTimeout(() => {
				const newCursorPos = cursorPos + symbol.length + 2;
				input.setSelectionRange(newCursorPos, newCursorPos);
				input.focus();
			}, 0);
		}
	};

	const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter" && !isAnswered) {
			handleCheckAnswer();
		}

		if (notationType === "symbol") {
			let symbol = "";
			switch (event.key) {
				case "^":
					symbol = "∧";
					break;
				case "v":
				case "V":
					symbol = "∨";
					break;
				case "!":
					symbol = "¬";
					break;
				default:
					return;
			}

			event.preventDefault();
			insertSymbol(symbol);
		}
	};

	const getCellValue = (rowIndex: number, columnName: string): string => {
		const key = `${rowIndex}-${columnName}`;
		return userAnswers[key] || "";
	};

	const getCellClassName = (
		baseClass: string,
		rowIndex: number,
		columnName: string,
	): string => {
		const key = `${rowIndex}-${columnName}`;
		const validation = cellValidations[key];

		if (validation === undefined) {
			return baseClass;
		}

		return `${baseClass} ${
			validation
				? "border-stats-streak bg-feedback-success-bg/20"
				: "border-stats-accuracy-low bg-feedback-error-bg/20"
		}`;
	};

	const handleTruthTableCellChange = (
		rowIndex: number,
		columnName: string,
		value: string,
	) => {
		setUserAnswer_TruthTable(rowIndex, columnName, value);
	};

	const title = questionType === "expression" ? "Write the Boolean expression for this scenario:" : questionType === "truth-table" ? "Complete the truth table for this scenario:" : "Draw the logic circuit for this scenario:";

	const getQuestionTypeIcon = () => {
		switch (questionType) {
			case "expression":
				return "✏️ Expression";
			case "truth-table":
				return "📊 Truth Table";
			case "draw-circuit":
				return "⚡ Circuit";
		}
	};

	if (!currentScenario) {
		return <div>Loading scenario...</div>;
	}

	return (
		<div className="flex flex-col gap-4">
			{/* Control Panel */}
			<ControlPanel
				difficulty={{
					value: currentLevel,
					onChange: (level) => setDifficulty(level as ScenarioDifficulty),
					options: Object.entries(DIFFICULTY_LABELS).map(([value, label]) => [
						Number(value),
						label,
					]),
				}}
				notation={{
					value: notationType,
					onChange: handleNotationToggle,
				}}
				onShuffle={generateQuestion}
				additionalControls={
					<div className="text-sm font-medium text-stats-label whitespace-nowrap">
						{getQuestionTypeIcon()}
					</div>
				}
			/>

			<div className="text-center">
				<h2 className="text-xl font-semibold sm:text-2xl">
					{title}
				</h2>
			</div>


			{/* Scenario Card */}
			<div className="p-6 rounded-lg border-2 bg-stats-card-bg">
				<h3 className="text-2xl font-bold mb-4 text-stats-points">
					{currentScenario.title}
				</h3>

				<p className="mb-4 text-base leading-relaxed whitespace-pre-wrap">
					{currentScenario.scenario}
				</p>

				<div className="space-y-2 border-t-2 pt-4 mt-4">
					<p className="font-semibold text-stats-label">Variables:</p>
					{Object.entries(currentScenario.inputs).map(([variable, meaning]) => (
						<p key={variable} className="text-sm">
							<span className="font-mono font-bold text-stats-points">
								{variable}
							</span>
							: {meaning}
						</p>
					))}
				</div>
			</div>

			{/* Question Type: Expression Writing */}
			{questionType === "expression" && (
				<>

					{/* Input Field */}
					<div className="max-w-2xl mx-auto w-full space-y-3">
						<Input
							ref={inputRef}
							type="text"
							value={userAnswer}
							onChange={(e) => setUserAnswer(e.target.value)}
							onKeyDown={handleKeyPress}
							placeholder={`Enter expression (e.g., Q = A ${notationType === "symbol" ? "∧" : "AND"} B)`}
							disabled={isAnswered}
							className="!text-xl py-6 border-2 border-checkbox-label-border hover:border-checkbox-label-border-hover focus-visible:ring-ring focus-visible:border-checkbox-label-border-hover text-center"
						/>
					</div>

			{/* Symbol Helper Buttons - Only in Symbol Mode */}
			{notationType === "symbol" && (
				<>
					<div className="flex flex-wrap gap-2 justify-center">
						{SYMBOL_BUTTONS.filter(
							(btn) => btn.word !== "XOR" || currentLevel === 4,
						).map((btn) => (
							<Button
								key={btn.word}
								variant="outline"
								size="sm"
								onClick={() => insertSymbol(btn.symbol)}
								disabled={isAnswered}
								className="border-2 border-checkbox-label-border hover:bg-checkbox-label-bg-hover hover:border-checkbox-label-border-hover px-4"
								title={
									btn.shortcut
										? `${btn.word} (${btn.symbol}) - Press ${btn.shortcut}`
										: `${btn.word} (${btn.symbol})`
								}
							>
								<span className="font-bold text-lg">{btn.symbol}</span>
							</Button>
						))}
					</div>
					<div className="text-center text-sm text-stats-label">
						Keyboard: ^ (AND), v (OR), ! (NOT)
					</div>
				</>
			)}
				</>
			)}

			{/* Question Type: Truth Table */}
			{questionType === "truth-table" && (
				<>
					{/* Truth Table Options */}
					<div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4 bg-stats-card-bg rounded-lg border-2">
						{/* Intermediate Columns Toggle */}
						<div className="flex items-center gap-3">
							<span className="text-sm font-medium text-stats-label">
								Show Intermediate Columns
							</span>
							<Switch
								checked={showIntermediateColumns}
								onCheckedChange={setShowIntermediateColumns}
								disabled={isAnswered}
								aria-label="Toggle intermediate columns"
								className="data-[state=checked]:bg-stats-points data-[state=unchecked]:bg-checkbox-label-border"
							/>
						</div>

						{/* Expert Mode Toggle */}
						<div className="flex items-center gap-3">
							<span className="text-sm font-medium text-stats-label">
								Expert Mode
							</span>
							<Switch
								checked={expertMode}
								onCheckedChange={setExpertMode}
								disabled={isAnswered}
								aria-label="Toggle expert mode"
								className="data-[state=checked]:bg-stats-points data-[state=unchecked]:bg-checkbox-label-border"
							/>
						</div>
					</div>

					{/* Truth Table */}
					<div className="overflow-x-auto">
						<table className="w-full border-collapse border-2 border-checkbox-label-border">
							<thead>
								<tr className="bg-stats-card-bg">
									{/* Input Headers */}
									{inputs.map((input) => (
										<th
											key={input}
											className="px-4 py-2 text-center font-semibold border-2 border-checkbox-label-border text-stats-label"
										>
											{input}
										</th>
									))}
									{/* Intermediate Headers */}
									{showIntermediateColumns &&
										intermediateExpressions.map((expr, index) => (
											<th
												key={`inter-${index}`}
												className="px-4 py-2 text-center font-semibold border-2 border-checkbox-label-border bg-stats-card-bg text-stats-label"
											>
												{convertToNotation(expr, notationType)}
											</th>
										))}
									{/* Output Header */}
									<th className="px-4 py-2 text-center font-semibold border-2 border-checkbox-label-border bg-stats-card-bg text-stats-points">
										{outputVariable}
									</th>
								</tr>
							</thead>
							<tbody>
								{truthTableData.map((row, rowIndex) => (
									<tr
										key={`row-${inputs.map((input) => (row[input] ? "1" : "0")).join("-")}`}
									>
										{/* Input Cells */}
										{inputs.map((input) => (
											<td
												key={input}
												className="px-4 py-2 text-center border border-checkbox-label-border"
											>
												{expertMode ? (
													<select
														value={getCellValue(rowIndex, input)}
														onChange={(e) =>
															handleTruthTableCellChange(
																rowIndex,
																input,
																e.target.value,
															)
														}
														disabled={isAnswered}
														className={getCellClassName(
															"w-full px-2 py-1 rounded border bg-background text-center",
															rowIndex,
															input,
														)}
													>
														<option value="">?</option>
														<option value="0">0</option>
														<option value="1">1</option>
													</select>
												) : (
													<span className="font-mono">
														{row[input] ? "1" : "0"}
													</span>
												)}
											</td>
										))}

										{/* Intermediate Cells */}
										{showIntermediateColumns &&
											intermediateExpressions.map((_, index) => {
												const columnName = `intermediate_${index}`;
												return (
													<td
														key={columnName}
														className="px-4 py-2 text-center border border-checkbox-label-border"
													>
														<select
															value={getCellValue(rowIndex, columnName)}
															onChange={(e) =>
																handleTruthTableCellChange(
																	rowIndex,
																	columnName,
																	e.target.value,
																)
															}
															disabled={isAnswered}
															className={getCellClassName(
																"w-full px-2 py-1 rounded border bg-background text-center",
																rowIndex,
																columnName,
															)}
														>
															<option value="">?</option>
															<option value="0">0</option>
															<option value="1">1</option>
														</select>
													</td>
												);
											})}

										{/* Output Cell */}
										<td className="px-4 py-2 text-center border border-checkbox-label-border bg-stats-card-bg/30">
											<select
												value={getCellValue(rowIndex, outputVariable)}
												onChange={(e) =>
													handleTruthTableCellChange(
														rowIndex,
														outputVariable,
														e.target.value,
													)
												}
												disabled={isAnswered}
												className={getCellClassName(
													"w-full px-2 py-1 rounded border bg-background text-center font-semibold",
													rowIndex,
													outputVariable,
												)}
											>
												<option value="">?</option>
												<option value="0">0</option>
												<option value="1">1</option>
											</select>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* Help Text */}
					<div className="py-2 text-sm text-center text-stats-label">
						{expertMode
							? "🎓 Expert Mode: Fill in all cells in any order"
							: "💡 Fill in the output column to complete the truth table"}
						{showIntermediateColumns &&
							!expertMode &&
							" • Intermediate columns are optional"}
					</div>
				</>
			)}

			{/* Question Type: Draw Circuit */}
			{questionType === "draw-circuit" && (
				<>

					{/* Circuit Drawing Area */}
					<div className="flex gap-6 flex-wrap lg:flex-nowrap">
						{/* Toolbox */}
						<div className="flex-shrink-0 w-full sm:w-48 bg-stats-card-bg rounded-lg p-4 border-2">
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
										<img src="/img/svg/or.svg" alt="OR Gate" className="gate-svg" />
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
									style={{ display: currentLevel === 4 ? "flex" : "none" }}
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

					{/* Help Display */}
					{helpEnabled && (
						<div className="bg-stats-card-bg border-2 rounded-lg p-4">
							<div
								ref={interpretedExprRef}
								id={INTERPRETED_EXPR_ID}
								className="text-lg font-mono text-center text-stats-label"
							>
								{currentInterpretedExpression}
							</div>
						</div>
					)}
				</>
			)}

			{/* Check Answer Button */}
			{!isAnswered && (
				<div className="max-w-md mx-auto w-full">
					<Button
						onClick={handleCheckAnswer}
						size="lg"
						className="w-full text-lg py-6 bg-action-button-bg hover:bg-action-button-bg-hover text-action-button-text"
					>
						Check Answer
					</Button>
				</div>
			)}

			{/* Feedback Message */}
			{feedbackMessage && (
				<div
					className={`p-4 rounded-lg text-center font-semibold border-2 ${
						isCorrect
							? "bg-feedback-success-bg text-feedback-success-text border-stats-streak"
							: "bg-feedback-error-bg text-feedback-error-text border-stats-accuracy-low"
					}`}
				>
					{feedbackMessage}
				</div>
			)}

			{/* Next Button */}
			{isAnswered && (
				<div className="max-w-md mx-auto w-full">
					<Button
						onClick={nextQuestion}
						size="lg"
						className="w-full text-lg py-6 bg-action-button-bg hover:bg-action-button-bg-hover text-action-button-text"
					>
						Next Question →
					</Button>
				</div>
			)}
		</div>
	);
}
