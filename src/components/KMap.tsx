import { useCallback, useEffect, useRef, useState } from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
	convertToNotation,
	convertToSymbolNotation,
	getNotationType,
	type NotationType,
	setNotationType,
} from "@/lib/config";
import {
	GROUP_BORDER_COLORS,
	GROUP_COLORS,
	isCellInGroup,
} from "@/lib/kmapUtils";
import { type KMapDifficulty, useKMap } from "@/lib/useKMap";
import { useKMapGrouping } from "@/lib/useKMapGrouping";

type HeadingMode = "graycode" | "variables";

/**
 * Converts a Gray-code label like "01" into variable form like "ĀB"
 * using overbar notation for complemented variables.
 */
function grayCodeToVarLabel(code: string, vars: string[]): React.ReactNode {
	return (
		<>
			{code.split("").map((bit, i) => {
				const varName = vars[i];
				if (bit === "0") {
					return (
						<span key={varName} style={{ textDecoration: "overline" }}>
							{varName}
						</span>
					);
				}
				return <span key={varName}>{varName}</span>;
			})}
		</>
	);
}

interface KMapProps {
	onScoreUpdate?: (isCorrect: boolean, questionType: string) => void;
}

const DIFFICULTY_LABELS: Record<KMapDifficulty, string> = {
	1: "Easy",
	2: "Medium",
	3: "Hard",
	4: "Expert",
};

const SYMBOL_BUTTONS = [
	{ word: "AND", symbol: "∧", shortcut: "^" },
	{ word: "OR", symbol: "∨", shortcut: "v" },
	{ word: "NOT", symbol: "¬", shortcut: "!" },
];

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
		solution,
		isAnswered,
		isCorrect,
		setLevel,
		toggleCell,
		checkAnswer,
		generateNewQuestion,
		retryAnswer,
		getCellStatus,
	} = useKMap({ onScoreUpdate });

	const [phase, setPhase] = useState<"fill" | "group">("fill");
	const [headingMode, setHeadingMode] = useState<HeadingMode>("graycode");

	const [notationType, setNotationTypeState] = useState<NotationType>(
		getNotationType(),
	);

	const grouping = useKMapGrouping({ solution, layout });

	const handleNotationToggle = (checked: boolean) => {
		const newNotation: NotationType = checked ? "symbol" : "word";
		setNotationTypeState(newNotation);
		setNotationType(newNotation);
	};

	const handleNewQuestion = useCallback(() => {
		generateNewQuestion();
		grouping.resetGroups();
		setPhase("fill");
	}, [generateNewQuestion, grouping.resetGroups]);

	const handleContinueToGrouping = useCallback(() => {
		setPhase("group");
	}, []);

	// Refs for term input fields to support cursor-position insertion
	const termInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
	const finalInputRef = useRef<HTMLInputElement>(null);
	const lastFocusedInputRef = useRef<{
		el: HTMLInputElement;
		groupId?: string;
	} | null>(null);

	const insertSymbolAtCursor = useCallback(
		(input: HTMLInputElement, symbol: string, groupId?: string) => {
			const cursorPos = input.selectionStart ?? 0;
			const currentValue = groupId
				? (grouping.groupTermInputs[groupId] ?? "")
				: grouping.finalExpressionInput;
			const newValue = `${currentValue.slice(0, cursorPos)} ${symbol} ${currentValue.slice(cursorPos)}`;

			if (groupId) {
				grouping.setGroupTermInput(groupId, newValue);
			} else {
				grouping.setFinalExpression(newValue);
			}

			setTimeout(() => {
				const newCursorPos = cursorPos + symbol.length + 2;
				input.setSelectionRange(newCursorPos, newCursorPos);
				input.focus();
			}, 0);
		},
		[
			grouping.groupTermInputs,
			grouping.finalExpressionInput,
			grouping.setGroupTermInput,
			grouping.setFinalExpression,
		],
	);

	const handleSymbolKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>, groupId?: string) => {
			if (notationType !== "symbol") return;
			const shortcutMap: Record<string, string> = {
				"^": "∧",
				v: "∨",
				V: "∨",
				"¬": "¬",
				"!": "¬",
			};
			const symbol = shortcutMap[e.key];
			if (symbol) {
				e.preventDefault();
				insertSymbolAtCursor(e.currentTarget, symbol, groupId);
			}
		},
		[notationType, insertSymbolAtCursor],
	);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && phase === "group") {
				grouping.cancelSelection();
				return;
			}
			if (e.key === "Enter") {
				// Don't handle Enter if user is typing in an input field
				if (
					e.target instanceof HTMLInputElement ||
					e.target instanceof HTMLTextAreaElement
				) {
					return;
				}
				e.preventDefault();
				if (phase === "fill") {
					if (isAnswered) {
						if (isCorrect) {
							handleContinueToGrouping();
						} else {
							retryAnswer();
						}
					} else {
						checkAnswer();
					}
				} else if (!grouping.isChecked) {
					grouping.checkGroups();
				} else if (grouping.isOptimal && !grouping.areTermsChecked) {
					grouping.checkTerms();
				} else if (
					grouping.areTermsChecked &&
					grouping.finalExpressionResult &&
					grouping.termResults &&
					!Object.values(grouping.termResults).some((r) => !r)
				) {
					handleNewQuestion();
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		phase,
		isAnswered,
		isCorrect,
		checkAnswer,
		retryAnswer,
		grouping.isChecked,
		grouping.isOptimal,
		grouping.areTermsChecked,
		grouping.finalExpressionResult,
		grouping.termResults,
		grouping.checkGroups,
		grouping.checkTerms,
		grouping.cancelSelection,
		handleNewQuestion,
		handleContinueToGrouping,
	]);

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
					onChange: (level) => {
						setLevel(level as KMapDifficulty);
						grouping.resetGroups();
						setPhase("fill");
					},
					options: Object.entries(DIFFICULTY_LABELS).map(([value, label]) => [
						Number(value),
						label,
					]),
				}}
				notation={{
					value: notationType,
					onChange: handleNotationToggle,
				}}
				onShuffle={handleNewQuestion}
				additionalControls={
					<div className="flex items-center gap-3">
						<span className="text-sm font-medium text-stats-label">Gray</span>
						<Switch
							checked={headingMode === "variables"}
							onCheckedChange={(checked) =>
								setHeadingMode(checked ? "variables" : "graycode")
							}
							aria-label="Toggle between Gray code and variable headings"
							className="data-[state=checked]:bg-stats-points data-[state=unchecked]:bg-checkbox-label-border"
						/>
						<span className="text-sm font-medium text-stats-label">
							Variables
						</span>
					</div>
				}
			/>

			{/* Expression display */}
			<div className="border-2 rounded-lg bg-stats-card-bg">
				<div className="flex flex-col items-center gap-2 px-4 py-5">
					<p className="text-sm font-medium text-stats-label">
						{phase === "fill"
							? "Fill in all the 1s on the K-Map for this expression:"
							: "Draw rectangular groups around the 1s to simplify:"}
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
					{/* Table */}
					<table
						className="border-collapse border-2 border-checkbox-label-border"
						aria-label="K-Map grid"
					>
						<thead>
							<tr>
								{/* Top-left corner — diagonal split showing AB / CD axes */}
								<th className="relative w-14 h-12 sm:w-16 sm:h-14 border border-checkbox-label-border bg-muted">
									{/* Diagonal line using SVG */}
									<svg
										className="absolute inset-0 w-full h-full"
										preserveAspectRatio="none"
										aria-hidden="true"
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
										{headingMode === "variables"
											? grayCodeToVarLabel(label, layout.colVars)
											: label}
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
										{headingMode === "variables"
											? grayCodeToVarLabel(rowLabel, layout.rowVars)
											: rowLabel}
									</th>

									{/* Data cells */}
									{layout.colLabels.map((_, colIndex) => {
										if (phase === "group") {
											const value = solution[rowIndex][colIndex];
											const isStart =
												grouping.groupStart?.[0] === rowIndex &&
												grouping.groupStart?.[1] === colIndex;
											const cellGroups = grouping.groups.filter((g) =>
												isCellInGroup(rowIndex, colIndex, g),
											);
											return (
												<td
													// biome-ignore lint/suspicious/noArrayIndexKey: grid positions are stable
													key={colIndex}
													className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border border-checkbox-label-border font-mono font-bold text-lg select-none transition-colors ${
														grouping.isChecked
															? "bg-background"
															: "bg-background cursor-pointer hover:bg-muted"
													}`}
													onClick={() =>
														grouping.handleCellClick(rowIndex, colIndex)
													}
													onKeyDown={(e) => {
														if (e.key === " " || e.key === "Enter") {
															e.preventDefault();
															grouping.handleCellClick(rowIndex, colIndex);
														}
													}}
													tabIndex={grouping.isChecked ? -1 : 0}
													aria-label={`Cell row ${rowLabel} column ${layout.colLabels[colIndex]}`}
												>
													{/* Group overlays */}
													{cellGroups.map((group) => {
														const borderColor =
															GROUP_BORDER_COLORS[
																group.colorIndex % GROUP_BORDER_COLORS.length
															];
														const bgColor =
															GROUP_COLORS[
																group.colorIndex % GROUP_COLORS.length
															];
														// Check visual adjacency for borders
														const aboveRow =
															(rowIndex - 1 + layout.rowCount) %
															layout.rowCount;
														const belowRow = (rowIndex + 1) % layout.rowCount;
														const leftCol =
															(colIndex - 1 + layout.colCount) %
															layout.colCount;
														const rightCol = (colIndex + 1) % layout.colCount;
														// Show border if the adjacent cell is NOT in this group
														// OR if the adjacent cell is not visually adjacent (wrap-around boundary)
														const isTop =
															!isCellInGroup(aboveRow, colIndex, group) ||
															rowIndex === 0;
														const isBottom =
															!isCellInGroup(belowRow, colIndex, group) ||
															rowIndex === layout.rowCount - 1;
														const isLeft =
															!isCellInGroup(rowIndex, leftCol, group) ||
															colIndex === 0;
														const isRight =
															!isCellInGroup(rowIndex, rightCol, group) ||
															colIndex === layout.colCount - 1;
														return (
															<div
																key={group.id}
																className="absolute inset-0 pointer-events-none"
																style={{
																	backgroundColor: bgColor,
																	borderStyle: "solid",
																	borderColor,
																	borderTopWidth: isTop ? "3px" : "0",
																	borderBottomWidth: isBottom ? "3px" : "0",
																	borderLeftWidth: isLeft ? "3px" : "0",
																	borderRightWidth: isRight ? "3px" : "0",
																	borderTopLeftRadius:
																		isTop && isLeft ? "6px" : "0",
																	borderTopRightRadius:
																		isTop && isRight ? "6px" : "0",
																	borderBottomLeftRadius:
																		isBottom && isLeft ? "6px" : "0",
																	borderBottomRightRadius:
																		isBottom && isRight ? "6px" : "0",
																	zIndex: 10,
																}}
															/>
														);
													})}
													{/* Start cell indicator */}
													{isStart && (
														<div
															className="absolute inset-0 border-2 border-dashed border-foreground pointer-events-none rounded"
															style={{ zIndex: 20 }}
														/>
													)}
													{/* Cell value */}
													<span
														className="absolute inset-0 flex items-center justify-center"
														style={{ zIndex: 30 }}
													>
														{value ? "1" : ""}
													</span>
												</td>
											);
										}

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
												tabIndex={isAnswered ? -1 : 0}
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

			{phase === "fill" ? (
				<>
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

							{isCorrect ? (
								<div className="flex flex-col gap-2 w-full max-w-md mx-auto">
									<Button
										onClick={handleContinueToGrouping}
										size="lg"
										className="w-full py-6 text-lg bg-action-button-bg hover:bg-action-button-bg-hover text-action-button-text"
									>
										Continue to Grouping →
									</Button>
									<Button
										onClick={handleNewQuestion}
										variant="outline"
										size="lg"
										className="w-full py-4 text-base"
									>
										Skip to Next Question
									</Button>
								</div>
							) : (
								<div className="flex flex-col gap-2 w-full max-w-md mx-auto">
									<Button
										onClick={retryAnswer}
										size="lg"
										className="w-full py-6 text-lg bg-action-button-bg hover:bg-action-button-bg-hover text-action-button-text"
									>
										Try Again
									</Button>
									<Button
										onClick={handleNewQuestion}
										variant="outline"
										size="lg"
										className="w-full py-4 text-base"
									>
										Next Question →
									</Button>
								</div>
							)}
						</>
					)}

					{/* Help text */}
					<div className="py-2 text-sm text-center text-stats-label">
						💡 Click cells to place a 1. Click again to remove.
						{isAnswered
							? isCorrect
								? " • Press Enter to continue to grouping"
								: " • Press Enter to try again"
							: " • Press Enter to check answer"}
					</div>
				</>
			) : (
				<>
					{/* Grouping phase status */}
					{grouping.groupStart && (
						<div className="p-3 rounded-lg bg-muted text-foreground text-center text-sm border border-checkbox-label-border">
							Click another cell to complete the group. Press Escape to cancel.
						</div>
					)}

					{/* Grouping error */}
					{grouping.error && (
						<div className="p-3 rounded-lg bg-feedback-error-bg text-feedback-error-text text-center text-sm border border-stats-accuracy-low">
							{grouping.error}
						</div>
					)}

					{/* Group list */}
					{grouping.groups.length > 0 && (
						<div className="space-y-2">
							<h3 className="text-sm font-semibold text-stats-label">
								Groups:
							</h3>
							{grouping.groups.map((group) => {
								const borderColor =
									GROUP_BORDER_COLORS[
										group.colorIndex % GROUP_BORDER_COLORS.length
									];
								const termResult = grouping.termResults?.[group.id];
								const showResult =
									grouping.areTermsChecked && termResult !== undefined;
								return (
									<div
										key={group.id}
										className={`flex items-center gap-2 px-3 py-2 rounded border ${
											showResult
												? termResult
													? "border-stats-streak bg-feedback-success-bg"
													: "border-stats-accuracy-low bg-feedback-error-bg"
												: "border-checkbox-label-border bg-stats-card-bg"
										}`}
									>
										<div
											className="w-4 h-4 rounded shrink-0"
											style={{ backgroundColor: borderColor }}
										/>
										{grouping.isChecked && grouping.isOptimal ? (
											<input
												ref={(el) => {
													termInputRefs.current[group.id] = el;
												}}
												data-kmap-term-input=""
												data-group-id={group.id}
												type="text"
												value={grouping.groupTermInputs[group.id] ?? ""}
												onChange={(e) =>
													grouping.setGroupTermInput(group.id, e.target.value)
												}
												onFocus={(e) => {
													lastFocusedInputRef.current = {
														el: e.currentTarget,
														groupId: group.id,
													};
												}}
												onKeyDown={(e) => handleSymbolKeyDown(e, group.id)}
												placeholder={
													notationType === "symbol"
														? "e.g. A ∧ B"
														: "e.g. A AND B"
												}
												className="font-mono text-sm flex-1 bg-transparent border-b border-muted-foreground/30 focus:border-foreground outline-none py-0.5 text-foreground placeholder:text-muted-foreground/50"
												disabled={
													grouping.areTermsChecked && termResult === true
												}
											/>
										) : (
											<span className="font-mono text-sm flex-1 text-muted-foreground italic">
												Group {grouping.groups.indexOf(group) + 1}
											</span>
										)}
										{!grouping.isChecked && (
											<button
												type="button"
												onClick={() => grouping.removeGroup(group.id)}
												className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
												aria-label="Remove group"
											>
												×
											</button>
										)}
										{showResult && (
											<span className="text-lg leading-none">
												{termResult ? "✓" : "✗"}
											</span>
										)}
									</div>
								);
							})}

							{/* Final simplified expression input */}
							{grouping.isChecked && grouping.isOptimal && (
								<div className="pt-2 space-y-1">
									<label
										htmlFor="final-expression"
										className="text-xs font-semibold text-stats-label"
									>
										Simplified expression:
									</label>
									<div
										className={`flex items-center gap-2 px-3 py-2 rounded border ${
											grouping.areTermsChecked
												? grouping.finalExpressionResult
													? "border-stats-streak bg-feedback-success-bg"
													: "border-stats-accuracy-low bg-feedback-error-bg"
												: "border-checkbox-label-border bg-stats-card-bg"
										}`}
									>
										<span className="font-mono text-sm text-foreground shrink-0">
											Q =
										</span>
										<input
											ref={finalInputRef}
											data-kmap-term-input=""
											id="final-expression"
											type="text"
											value={grouping.finalExpressionInput}
											onChange={(e) =>
												grouping.setFinalExpression(e.target.value)
											}
											onFocus={(e) => {
												lastFocusedInputRef.current = {
													el: e.currentTarget,
												};
											}}
											onKeyDown={(e) => handleSymbolKeyDown(e)}
											placeholder={
												notationType === "symbol"
													? "e.g. A ∨ (B ∧ C)"
													: "e.g. A OR (B AND C)"
											}
											className="font-mono text-sm flex-1 bg-transparent border-b border-muted-foreground/30 focus:border-foreground outline-none py-0.5 text-foreground placeholder:text-muted-foreground/50"
											disabled={
												grouping.areTermsChecked &&
												grouping.finalExpressionResult === true
											}
										/>
										{grouping.areTermsChecked && (
											<span className="text-lg leading-none">
												{grouping.finalExpressionResult ? "✓" : "✗"}
											</span>
										)}
									</div>
								</div>
							)}
						</div>
					)}

					{/* Symbol helper buttons */}
					{notationType === "symbol" &&
						grouping.isChecked &&
						grouping.isOptimal && (
							<div className="space-y-1">
								<div className="flex flex-wrap justify-center gap-2">
									{SYMBOL_BUTTONS.map((btn) => (
										<Button
											key={btn.word}
											variant="outline"
											size="sm"
											onClick={() => {
												const last = lastFocusedInputRef.current;
												if (last) {
													insertSymbolAtCursor(
														last.el,
														btn.symbol,
														last.groupId,
													);
												}
											}}
											disabled={
												grouping.areTermsChecked &&
												grouping.finalExpressionResult === true &&
												grouping.termResults !== null &&
												!Object.values(grouping.termResults).some((r) => !r)
											}
											className="px-4 border-2 border-checkbox-label-border hover:bg-checkbox-label-bg-hover hover:border-checkbox-label-border-hover"
											title={`${btn.word} (${btn.symbol}) - Press ${btn.shortcut}`}
										>
											<span className="text-lg font-bold">{btn.symbol}</span>
										</Button>
									))}
								</div>
								<div className="text-xs text-center text-stats-label">
									Keyboard: ^ (AND), v (OR), ! (NOT)
								</div>
							</div>
						)}

					{/* Check / Next buttons */}
					{!grouping.isChecked ? (
						<div className="flex flex-col gap-2 w-full max-w-md mx-auto">
							<Button
								onClick={grouping.checkGroups}
								size="lg"
								className="w-full py-6 text-lg bg-action-button-bg hover:bg-action-button-bg-hover text-action-button-text"
							>
								Check Groups
							</Button>
							<Button
								onClick={handleNewQuestion}
								variant="outline"
								size="lg"
								className="w-full py-4 text-base"
							>
								Skip to Next Question
							</Button>
						</div>
					) : !grouping.isAllCovered || !grouping.isOptimal ? (
						<>
							{/* Grouping feedback — not covered or not optimal */}
							<div
								className={`p-4 rounded-lg text-center font-semibold border-2 ${
									!grouping.isAllCovered
										? "bg-feedback-error-bg text-feedback-error-text border-stats-accuracy-low"
										: "bg-amber-50 text-amber-800 border-amber-400 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-600"
								}`}
							>
								{!grouping.isAllCovered
									? "✗ Some 1s are not covered by any group."
									: `⚠ ${grouping.checkFeedback}`}
							</div>
							<div className="flex flex-col gap-2 w-full max-w-md mx-auto">
								<Button
									onClick={grouping.resetGroups}
									size="lg"
									className="w-full py-6 text-lg bg-action-button-bg hover:bg-action-button-bg-hover text-action-button-text"
								>
									Try Again
								</Button>
								<Button
									onClick={handleNewQuestion}
									variant="outline"
									size="lg"
									className="w-full py-4 text-base"
								>
									Next Question →
								</Button>
							</div>
						</>
					) : !grouping.areTermsChecked ||
						!grouping.finalExpressionResult ||
						(grouping.termResults &&
							Object.values(grouping.termResults).some((r) => !r)) ? (
						<>
							{/* Optimal groups — now enter terms */}
							<div className="p-4 rounded-lg text-center font-semibold border-2 bg-feedback-success-bg text-feedback-success-text border-stats-streak">
								✓ Optimal grouping! Now enter what each group simplifies to.
							</div>

							{grouping.areTermsChecked && (
								<div className="p-3 rounded-lg text-center text-sm border-2 bg-feedback-error-bg text-feedback-error-text border-stats-accuracy-low">
									Some answers are incorrect. Check the marked fields and try
									again.
								</div>
							)}

							<div className="flex flex-col gap-2 w-full max-w-md mx-auto">
								<Button
									onClick={grouping.checkTerms}
									size="lg"
									className="w-full py-6 text-lg bg-action-button-bg hover:bg-action-button-bg-hover text-action-button-text"
								>
									Check Answers
								</Button>
								<Button
									onClick={handleNewQuestion}
									variant="outline"
									size="lg"
									className="w-full py-4 text-base"
								>
									Skip to Next Question
								</Button>
							</div>
						</>
					) : (
						<>
							{/* All correct */}
							<div className="p-4 rounded-lg text-center font-semibold border-2 bg-feedback-success-bg text-feedback-success-text border-stats-streak">
								✓ All correct! Expression fully simplified.
							</div>
							<div className="w-full max-w-md mx-auto">
								<Button
									onClick={handleNewQuestion}
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
						💡
						{!grouping.isChecked
							? " Click cells to draw groups • Press Escape to cancel selection"
							: grouping.isOptimal &&
									(!grouping.areTermsChecked ||
										(grouping.termResults &&
											Object.values(grouping.termResults).some((r) => !r)) ||
										!grouping.finalExpressionResult)
								? " Type what each group simplifies to, then the final expression"
								: grouping.areTermsChecked && grouping.finalExpressionResult
									? " All correct! Press Next Question to continue"
									: " Fix your groups and try again"}
					</div>
				</>
			)}
		</div>
	);
}
