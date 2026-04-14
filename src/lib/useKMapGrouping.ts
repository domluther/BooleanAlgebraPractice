import { useCallback, useState } from "react";
import { convertToWordNotation } from "./config";
import { areExpressionsLogicallyEquivalent } from "./expressionUtils";
import {
	areAllOnesCovered,
	findExpandableGroups,
	findRedundantGroups,
	GROUP_COLORS,
	getGroupDimensions,
	getSimplifiedExpression,
	getSimplifiedTermForGroup,
	type KMapGroup,
	type KMapLayout,
	validateGroup,
} from "./kmapUtils";

interface UseKMapGroupingProps {
	solution: boolean[][];
	layout: KMapLayout;
}

export function useKMapGrouping({ solution, layout }: UseKMapGroupingProps) {
	const [groups, setGroups] = useState<KMapGroup[]>([]);
	const [groupStart, setGroupStart] = useState<[number, number] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isChecked, setIsChecked] = useState(false);
	const [isAllCovered, setIsAllCovered] = useState(false);
	const [isOptimal, setIsOptimal] = useState(false);
	const [checkFeedback, setCheckFeedback] = useState<string | null>(null);

	const handleCellClick = useCallback(
		(row: number, col: number) => {
			if (isChecked) return;
			setError(null);

			if (groupStart === null) {
				setGroupStart([row, col]);
			} else {
				const [sr, sc] = groupStart;

				const minRow = Math.min(sr, row);
				const maxRow = Math.max(sr, row);
				const minCol = Math.min(sc, col);
				const maxCol = Math.max(sc, col);

				// Try the direct (non-wrapping) rectangle first
				const directResult = validateGroup(
					minRow,
					minCol,
					maxRow,
					maxCol,
					solution,
					layout,
				);

				let bestGroup: [number, number, number, number] | null = null;

				if (directResult.valid) {
					bestGroup = [minRow, minCol, maxRow, maxCol];
				} else {
					// Direct failed — try single-axis wraps first (more intuitive),
					// then double-axis wrap only as a last resort.
					const singleAxisCandidates: [number, number, number, number][] = [];
					if (layout.colCount > 2) {
						// Wrap columns only
						singleAxisCandidates.push([minRow, maxCol, maxRow, minCol]);
					}
					if (layout.rowCount > 2) {
						// Wrap rows only
						singleAxisCandidates.push([maxRow, minCol, minRow, maxCol]);
					}

					let bestSize = 0;
					for (const [csr, csc, cer, cec] of singleAxisCandidates) {
						const result = validateGroup(csr, csc, cer, cec, solution, layout);
						if (result.valid) {
							const tempGroup: KMapGroup = {
								id: "",
								startRow: csr,
								startCol: csc,
								endRow: cer,
								endCol: cec,
								colorIndex: 0,
							};
							const { width, height } = getGroupDimensions(tempGroup, layout);
							const size = width * height;
							if (size > bestSize) {
								bestSize = size;
								bestGroup = [csr, csc, cer, cec];
							}
						}
					}

					// Only try double-axis wrap if no single-axis wrap worked
					if (!bestGroup && layout.colCount > 2 && layout.rowCount > 2) {
						const result = validateGroup(
							maxRow,
							maxCol,
							minRow,
							minCol,
							solution,
							layout,
						);
						if (result.valid) {
							bestGroup = [maxRow, maxCol, minRow, minCol];
						}
					}
				}

				if (!bestGroup) {
					// Show the error from the direct (non-wrap) attempt
					const result = validateGroup(
						minRow,
						minCol,
						maxRow,
						maxCol,
						solution,
						layout,
					);
					setError(result.reason ?? "Invalid group.");
					setGroupStart(null);
					return;
				}

				const [bsr, bsc, ber, bec] = bestGroup;
				const newGroup: KMapGroup = {
					id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
					startRow: bsr,
					startCol: bsc,
					endRow: ber,
					endCol: bec,
					colorIndex: groups.length % GROUP_COLORS.length,
				};

				setGroups((prev) => [...prev, newGroup]);
				setGroupStart(null);
			}
		},
		[groupStart, groups.length, solution, layout, isChecked],
	);

	const removeGroup = useCallback((id: string) => {
		setGroups((prev) => prev.filter((g) => g.id !== id));
		setIsChecked(false);
		setIsAllCovered(false);
	}, []);

	const cancelSelection = useCallback(() => {
		setGroupStart(null);
		setError(null);
	}, []);

	const checkGroups = useCallback(() => {
		if (groups.length === 0) {
			setError("Draw at least one group before checking.");
			return;
		}
		const covered = areAllOnesCovered(groups, solution);
		setIsAllCovered(covered);
		setIsChecked(true);

		if (!covered) {
			setIsOptimal(false);
			setCheckFeedback(null);
			return;
		}

		// Check for non-optimal groupings
		const issues: string[] = [];
		const redundant = findRedundantGroups(groups, solution);
		const expandable = findExpandableGroups(groups, solution, layout);

		if (redundant.length > 0) {
			issues.push("some groups are redundant and could be removed");
		}
		if (expandable.length > 0) {
			issues.push("some groups could be made larger");
		}

		if (issues.length > 0) {
			setIsOptimal(false);
			setCheckFeedback(
				`All 1s are covered, but ${issues.join(" and ")}. Try to use the fewest, largest groups possible.`,
			);
		} else {
			setIsOptimal(true);
			setCheckFeedback(null);
		}
	}, [groups, solution, layout]);

	const resetGroups = useCallback(() => {
		setGroups([]);
		setGroupStart(null);
		setError(null);
		setIsChecked(false);
		setIsAllCovered(false);
		setIsOptimal(false);
		setCheckFeedback(null);
		setGroupTermInputs({});
		setFinalExpressionInput("");
		setTermResults(null);
		setFinalExpressionResult(null);
		setAreTermsChecked(false);
	}, []);

	// --- Term input and validation ---
	const [groupTermInputs, setGroupTermInputs] = useState<
		Record<string, string>
	>({});
	const [finalExpressionInput, setFinalExpressionInput] = useState("");
	const [termResults, setTermResults] = useState<Record<
		string,
		boolean
	> | null>(null);
	const [finalExpressionResult, setFinalExpressionResult] = useState<
		boolean | null
	>(null);
	const [areTermsChecked, setAreTermsChecked] = useState(false);

	const setGroupTermInput = useCallback((groupId: string, value: string) => {
		setGroupTermInputs((prev) => ({ ...prev, [groupId]: value }));
		setAreTermsChecked(false);
		setTermResults(null);
		setFinalExpressionResult(null);
	}, []);

	const setFinalExpression = useCallback((value: string) => {
		setFinalExpressionInput(value);
		setAreTermsChecked(false);
		setFinalExpressionResult(null);
	}, []);

	const checkTerms = useCallback(() => {
		const results: Record<string, boolean> = {};
		for (const group of groups) {
			const userInput = convertToWordNotation(
				(groupTermInputs[group.id] ?? "").trim(),
			).toUpperCase();
			if (!userInput) {
				results[group.id] = false;
				continue;
			}
			const expected = getSimplifiedTermForGroup(group, layout);
			// Compare as full expressions: "Q = term"
			results[group.id] = areExpressionsLogicallyEquivalent(
				`Q = ${userInput}`,
				`Q = ${expected}`,
			);
		}
		setTermResults(results);

		// Check final expression
		const userFinal = convertToWordNotation(
			finalExpressionInput.trim(),
		).toUpperCase();
		if (userFinal) {
			const expectedFull = getSimplifiedExpression(groups, layout);
			// User may or may not include "Q = " prefix
			const userExpr = userFinal.includes("=") ? userFinal : `Q = ${userFinal}`;
			setFinalExpressionResult(
				areExpressionsLogicallyEquivalent(userExpr, expectedFull),
			);
		} else {
			setFinalExpressionResult(false);
		}

		setAreTermsChecked(true);
	}, [groups, groupTermInputs, finalExpressionInput, layout]);

	const simplifiedExpression = getSimplifiedExpression(groups, layout);

	return {
		groups,
		groupStart,
		error,
		isChecked,
		isAllCovered,
		isOptimal,
		checkFeedback,
		simplifiedExpression,
		handleCellClick,
		removeGroup,
		cancelSelection,
		checkGroups,
		resetGroups,
		// Term input
		groupTermInputs,
		finalExpressionInput,
		termResults,
		finalExpressionResult,
		areTermsChecked,
		setGroupTermInput,
		setFinalExpression,
		checkTerms,
	};
}
