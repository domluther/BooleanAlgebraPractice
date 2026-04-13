import { useEffect, useState } from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { Button } from "@/components/ui/button";
import {
	convertToNotation,
	convertToSymbolNotation,
	getNotationType,
	type NotationType,
	setNotationType,
} from "@/lib/config";
import { type KMapDifficulty, useKMap } from "@/lib/useKMap";

interface KMapProps {
	onScoreUpdate?: (isCorrect: boolean, questionType: string) => void;
}

const DIFFICULTY_LABELS: Record<KMapDifficulty, string> = {
	1: "Easy",
	2: "Medium",
	3: "Hard",
	4: "Expert",
};

/**
 * Returns the CSS classes for a K-Map cell based on its status.
 */
function cellClasses(
	status: ReturnType<ReturnType<typeof useKMap>["getCellStatus"]>,
	isAnswered: boolean,
): string {
	const base =
		"relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border border-checkbox-label-border font-mono font-bold text-lg select-none transition-colors";

	if (!isAnswered) {
		if (status === "selected") {
			return `${base} bg-action-button-bg text-action-button-text cursor-pointer hover:bg-action-button-bg-hover`;
		}
		return `${base} bg-background cursor-pointer hover:bg-muted`;
	}

	// Answered states
	switch (status) {
		case "correct-one":
			return `${base} bg-feedback-success-bg text-feedback-success-text`;
		case "correct-zero":
			return `${base} bg-background text-transparent`;
		case "incorrect-extra":
			return `${base} bg-feedback-error-bg text-feedback-error-text`;
		case "incorrect-missed":
			return `${base} bg-feedback-error-bg text-feedback-error-text`;
		default:
			return base;
	}
}

function cellContent(
	status: ReturnType<ReturnType<typeof useKMap>["getCellStatus"]>,
	isAnswered: boolean,
): string {
	if (!isAnswered) {
		return status === "selected" ? "1" : "";
	}
	switch (status) {
		case "correct-one":
			return "1";
		case "correct-zero":
			return "";
		case "incorrect-extra":
			return "1"; // user placed a 1 but shouldn't have
		case "incorrect-missed":
			return "1"; // show what should have been there
		default:
			return "";
	}
}

export function KMap({ onScoreUpdate }: KMapProps) {
	const {
		currentLevel,
		currentExpression,
		layout,
		isAnswered,
		isCorrect,
		setLevel,
		toggleCell,
		checkAnswer,
		generateNewQuestion,
		getCellStatus,
	} = useKMap({ onScoreUpdate });

	const [notationType, setNotationTypeState] = useState<NotationType>(
		getNotationType(),
	);

	const handleNotationToggle = (checked: boolean) => {
		const newNotation: NotationType = checked ? "symbol" : "word";
		setNotationTypeState(newNotation);
		setNotationType(newNotation);
	};

	// Keyboard shortcut: Enter to check / advance
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				if (isAnswered) {
					generateNewQuestion();
				} else {
					checkAnswer();
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isAnswered, checkAnswer, generateNewQuestion]);

	const displayExpression = convertToNotation(currentExpression, notationType);

	// Build axis label strings for the corner cell
	const colVarLabel = layout.colVars.join("");
	const rowVarLabel = layout.rowVars.join("");

	return (
		<div className="flex flex-col gap-4">
			{/* Control Panel */}
			<ControlPanel
				difficulty={{
					value: currentLevel,
					onChange: (level) => setLevel(level as KMapDifficulty),
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
			/>

			{/* Expression display */}
			<div className="border-2 rounded-lg bg-stats-card-bg">
				<div className="flex flex-col items-center gap-2 px-4 py-5">
					<p className="text-sm font-medium text-stats-label">
						Fill in all the 1s on the K-Map for this expression:
					</p>
					<p className="font-mono text-xl font-bold text-foreground text-center">
						{displayExpression}
					</p>
					{/* Also show symbol notation below if in word mode for clarity */}
					{notationType === "word" && (
						<p className="font-mono text-sm text-muted-foreground">
							{convertToSymbolNotation(currentExpression)}
						</p>
					)}
				</div>
			</div>

			{/* K-Map Grid */}
			<div className="flex justify-center overflow-x-auto">
				<div className="inline-block">
					{/* Column variable label */}
					<div
						className="flex justify-end mb-1 pr-1"
						style={{
							paddingLeft: `calc(3.5rem + 1px)`, // offset for row-header column
						}}
					>
						<span className="font-bold text-base text-foreground tracking-widest">
							{colVarLabel}
						</span>
					</div>

					<div className="flex">
						{/* Row variable label — rotated, sits to the left of the grid */}
						<div className="flex items-center justify-center pr-1">
							<span
								className="font-bold text-base text-foreground"
								style={{
									writingMode: "vertical-rl",
									transform: "rotate(180deg)",
									whiteSpace: "nowrap",
								}}
							>
								{rowVarLabel}
							</span>
						</div>

						{/* Table */}
						<table
							className="border-collapse border-2 border-checkbox-label-border"
							aria-label="K-Map grid"
						>
							<thead>
								<tr>
									{/* Top-left corner — diagonal split showing AB / CD axes */}
									<th
										className="relative w-14 h-12 sm:w-16 sm:h-14 border border-checkbox-label-border bg-muted"
										aria-hidden="true"
									>
										{/* Diagonal line using SVG */}
										<svg
											className="absolute inset-0 w-full h-full"
											preserveAspectRatio="none"
										>
											<line
												x1="0"
												y1="0"
												x2="100%"
												y2="100%"
												stroke="currentColor"
												strokeWidth="1"
												className="text-checkbox-label-border"
											/>
										</svg>
										{/* Row-var label bottom-left, col-var label top-right */}
										<span className="absolute bottom-0.5 left-1 text-xs font-semibold text-muted-foreground leading-none">
											{rowVarLabel}
										</span>
										<span className="absolute top-0.5 right-1 text-xs font-semibold text-muted-foreground leading-none">
											{colVarLabel}
										</span>
									</th>

									{/* Column headers */}
									{layout.colLabels.map((label) => (
										<th
											key={label}
											className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border border-checkbox-label-border bg-truth-table-input-header-bg text-truth-table-input-header-text font-mono font-semibold text-center text-sm"
										>
											{label}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{layout.rowLabels.map((rowLabel, rowIndex) => (
									<tr key={rowLabel}>
										{/* Row header */}
										<th
											scope="row"
											className="w-14 sm:w-16 border border-checkbox-label-border bg-truth-table-input-header-bg text-truth-table-input-header-text font-mono font-semibold text-center text-sm"
										>
											{rowLabel}
										</th>

										{/* Data cells */}
										{layout.colLabels.map((_, colIndex) => {
											const status = getCellStatus(rowIndex, colIndex);
											const content = cellContent(status, isAnswered);
											const classes = cellClasses(status, isAnswered);
											return (
												<td
													// biome-ignore lint/suspicious/noArrayIndexKey: grid positions are stable
													key={colIndex}
													className={classes}
													onClick={() => toggleCell(rowIndex, colIndex)}
													onKeyDown={(e) => {
														if (e.key === " " || e.key === "Enter") {
															e.preventDefault();
															toggleCell(rowIndex, colIndex);
														}
													}}
													role="button"
													tabIndex={isAnswered ? -1 : 0}
													aria-pressed={status === "selected"}
													aria-label={`Cell row ${rowLabel} column ${layout.colLabels[colIndex]}`}
												>
													<span className="absolute inset-0 flex items-center justify-center">
														{content}
													</span>
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Submit / Next button */}
			{!isAnswered ? (
				<div className="w-full max-w-md mx-auto">
					<Button
						onClick={checkAnswer}
						size="lg"
						className="w-full py-6 text-lg bg-action-button-bg hover:bg-action-button-bg-hover text-action-button-text"
					>
						Mark My Answer
					</Button>
				</div>
			) : (
				<>
					{/* Feedback */}
					<div
						className={`p-4 rounded-lg text-center font-semibold border-2 ${
							isCorrect
								? "bg-feedback-success-bg text-feedback-success-text border-stats-streak"
								: "bg-feedback-error-bg text-feedback-error-text border-stats-accuracy-low"
						}`}
					>
						{isCorrect
							? "✓ Correct! All cells filled in properly."
							: "✗ Not quite — incorrect cells are highlighted in red."}
					</div>

					<div className="w-full max-w-md mx-auto">
						<Button
							onClick={generateNewQuestion}
							size="lg"
							className="w-full py-6 text-lg bg-action-button-bg hover:bg-action-button-bg-hover text-action-button-text"
						>
							Next Question →
						</Button>
					</div>
				</>
			)}

			{/* Help text */}
			<div className="py-2 text-sm text-center text-stats-label">
				💡 Click cells to place a 1. Click again to remove.
				{isAnswered
					? " • Press Enter for next question"
					: " • Press Enter to check answer"}
			</div>
		</div>
	);
}
