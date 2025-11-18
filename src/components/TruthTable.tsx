import { useEffect, useRef, useState } from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CircuitGenerator } from "@/lib/CircuitGenerator";
import { useTheme } from "@/contexts/theme-provider";
import {
	convertToNotation,
	getNotationType,
	type NotationType,
	setNotationType,
} from "@/lib/config";
import { useTruthTable } from "@/lib/useTruthTable";

/**
 * TruthTable Component - Boolean Truth Table Game
 *
 * Fill in truth tables for Boolean expressions.
 * Supports 5 difficulty levels and two modes:
 * - Normal: Fill in output column only
 * - Expert: Fill in all columns (order-independent validation)
 */

interface TruthTableProps {
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

export function TruthTable({ onScoreUpdate }: TruthTableProps) {
	const {
		currentLevel,
		currentExpression,
		inputs,
		intermediateExpressions,
		truthTableData,
		outputVariable,
		userAnswers,
		cellValidations,
		isAnswered,
		isCorrect,
		feedbackMessage,
		showIntermediateColumns,
		expertMode,
		setLevel,
		setShowIntermediateColumns,
		setExpertMode,
		setUserAnswer,
		checkAnswer,
		generateNewQuestion,
	} = useTruthTable({ onScoreUpdate });

	const { theme } = useTheme();
	const circuitRef = useRef<HTMLDivElement>(null);
	const circuitGeneratorRef = useRef<CircuitGenerator>(new CircuitGenerator());
	const [notationType, setNotationTypeState] = useState<NotationType>(
		getNotationType(),
	);

	// Render circuit when question changes
	useEffect(() => {
		if (circuitRef.current && currentExpression) {
			// Clear previous circuit
			circuitRef.current.innerHTML = "";

			// Generate new circuit
			try {
				const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
				circuitGeneratorRef.current.generateCircuit(
					currentExpression,
					circuitRef.current,
					isDarkMode,
				);
			} catch (error) {
				console.error("Error generating circuit:", error);
				circuitRef.current.innerHTML =
					'<p class="text-destructive">Error rendering circuit</p>';
			}
		}
	}, [currentExpression, theme]);

	// Regenerate table when level changes
	useEffect(() => {
		generateNewQuestion();
	}, [generateNewQuestion]);

	// Global keyboard handler for Enter key
	useEffect(() => {
		const handleGlobalKeyPress = (event: KeyboardEvent) => {
			if (event.key === "Enter") {
				if (isAnswered) {
					// Move to next question when answered
					event.preventDefault();
					generateNewQuestion();
				} else {
					// Mark answer when not answered
					event.preventDefault();
					checkAnswer();
				}
			}
		};

		window.addEventListener("keydown", handleGlobalKeyPress);
		return () => window.removeEventListener("keydown", handleGlobalKeyPress);
	}, [isAnswered, generateNewQuestion, checkAnswer]);

	const handleNotationToggle = (checked: boolean) => {
		const newNotation: NotationType = checked ? "symbol" : "word";
		setNotationTypeState(newNotation);
		setNotationType(newNotation);
	};

	const handleCellChange = (
		rowIndex: number,
		columnName: string,
		value: string,
	) => {
		if (isAnswered) return;
		setUserAnswer(rowIndex, columnName, value as "0" | "1" | "");
	};

	const getCellKey = (rowIndex: number, columnName: string) => {
		return `${rowIndex}_${columnName}`;
	};

	const getCellValue = (rowIndex: number, columnName: string) => {
		const key = getCellKey(rowIndex, columnName);
		return userAnswers.get(key) || "";
	};

	const getCellStatus = (rowIndex: number, columnName: string) => {
		const key = getCellKey(rowIndex, columnName);
		return cellValidations.get(key)?.status || "";
	};

	const getCellClassName = (
		baseClass: string,
		rowIndex: number,
		columnName: string,
	) => {
		const status = getCellStatus(rowIndex, columnName);
		let className = `${baseClass} `;

		if (status === "correct") {
			className += "bg-feedback-success-bg text-feedback-success-text";
		} else if (status === "incorrect") {
			className += "bg-feedback-error-bg text-feedback-error-text";
		} else if (status === "unanswered") {
			className += "border-stats-accuracy-low border-2";
		}

		return className;
	};

	const displayExpression = convertToNotation(currentExpression, notationType);

	return (
		<div className="flex flex-col gap-4">
			{/* Control Panel */}
			<ControlPanel
				difficulty={{
					value: currentLevel,
					onChange: (level) => setLevel(level as 1 | 2 | 3 | 4 | 5),
					options: Object.entries(DIFFICULTY_LABELS).map(([value, label]) => [
						Number(value),
						label,
					]),
				}}
				notation={{
					value: notationType,
					onChange: handleNotationToggle,
				}}
				onShuffle={generateNewQuestion}
				additionalControls={
					<>
						{/* Intermediate Columns Toggle */}
						<div className="flex items-center gap-3">
							<span className="text-sm font-medium text-stats-label">
								Show Intermediate Columns
							</span>
							<Switch
								checked={showIntermediateColumns}
								onCheckedChange={setShowIntermediateColumns}
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
								aria-label="Toggle expert mode"
								className="data-[state=checked]:bg-stats-points data-[state=unchecked]:bg-checkbox-label-border"
							/>
						</div>
					</>
				}
			/>

			{/* Circuit Display with Expression Label */}
			<div className="border-2 rounded-lg bg-stats-card-bg ">
				<div className="flex flex-col gap-4">
					{/* Circuit */}
					<div className="flex items-center justify-center rounded-lg min-h-[150px]">
						<div
							ref={circuitRef}
							className="circuit-display"
							style={{ minHeight: "120px" }}
						/>
					</div>

					{/* Expression Label */}
					<div className="text-center pb-2">
						<p className="text-base font-mono font-bold text-muted-foreground">
							{displayExpression}
						</p>
					</div>
				</div>
			</div>

			{/* Truth Table */}
			<div className="overflow-x-auto">
				<table className="w-full border-collapse">
					<thead>
						<tr>
							{/* Input Headers */}
					{inputs.map((input) => (
						<th
							key={input}
							className="px-4 py-2 text-center font-semibold border-2 border-checkbox-label-border bg-truth-table-input-header-bg text-truth-table-input-header-text"
						>
							{input}
						</th>
					))}							{/* Intermediate Headers */}
							{showIntermediateColumns &&
								intermediateExpressions.map((expr) => {
									const displayExpr = convertToNotation(expr, notationType);
									const truncated =
										displayExpr.length > 10
											? `${displayExpr.substring(0, 10)}...`
											: displayExpr;
									return (
										<th
											key={expr}
											className="px-4 py-2 text-center font-semibold border-2 border-checkbox-label-border bg-truth-table-intermediate-header-bg text-truth-table-intermediate-header-text"
											title={displayExpr}
										>
											{truncated}
										</th>
									);
								})}
						{/* Output Header */}
						<th className="px-4 py-2 text-center font-semibold border-2 border-checkbox-label-border bg-truth-table-output-header-bg text-truth-table-output-header-text">
							{outputVariable}
							</th>
						</tr>
					</thead>
					<tbody>
						{truthTableData.map((row, rowIndex) => (
							<tr
								key={`row-${inputs.map((input) => (row[input] ? "1" : "0")).join("-")}`}
								className="group"
							>
								{/* Input Cells */}
								{inputs.map((input) => (
									<td
										key={input}
										className="px-4 py-2 text-center border border-checkbox-label-border bg-truth-table-input-cell-bg group-hover:bg-truth-table-input-cell-hover transition-colors"
									>
										{expertMode ? (
											<select
												value={getCellValue(rowIndex, input)}
												onChange={(e) =>
													handleCellChange(rowIndex, input, e.target.value)
												}
												disabled={isAnswered}
												className={getCellClassName(
													"w-16 px-2 py-1 rounded border bg-background text-center",
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
												className="px-4 py-2 text-center border border-checkbox-label-border bg-truth-table-intermediate-cell-bg group-hover:bg-truth-table-intermediate-cell-hover transition-colors"
											>
												<select
													value={getCellValue(rowIndex, columnName)}
													onChange={(e) =>
														handleCellChange(
															rowIndex,
															columnName,
															e.target.value,
														)
													}
													disabled={isAnswered}
													className={getCellClassName(
														"w-16 px-2 py-1 rounded border bg-background text-center",
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
							<td className="px-4 py-2 text-center border border-checkbox-label-border bg-truth-table-output-cell-bg group-hover:bg-truth-table-output-cell-hover transition-colors">
								<select
										value={getCellValue(rowIndex, outputVariable)}
										onChange={(e) =>
											handleCellChange(rowIndex, outputVariable, e.target.value)
										}
										disabled={isAnswered}
										className={getCellClassName(
											"w-16 px-2 py-1 rounded border bg-background text-center font-semibold",
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

			{/* Submit Button */}
			{!isAnswered && (
				<div className="max-w-md mx-auto w-full">
					<Button
						onClick={checkAnswer}
						size="lg"
						className="w-full text-lg py-6 bg-action-button-bg hover:bg-action-button-bg-hover text-action-button-text"
					>
						Mark My Answer
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
						onClick={generateNewQuestion}
						size="lg"
						className="w-full text-lg py-6 bg-action-button-bg hover:bg-action-button-bg-hover text-action-button-text"
					>
						Next Question →
					</Button>
				</div>
			)}

			{/* Help Text */}
			<div className="py-2 text-sm text-center text-stats-label">
				{expertMode
					? "🎓 Expert Mode: Fill in all cells in any order"
					: "💡 Fill in the output column to complete the truth table"}
				{showIntermediateColumns &&
					!expertMode &&
					" • Intermediate columns are optional"}
				{isAnswered
					? " • Press Enter for next question"
					: " • Press Enter to check answer"}
			</div>
		</div>
	);
}
