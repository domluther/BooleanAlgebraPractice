/**
 * Shared utility functions for number formatting and manipulation
 * Used across GCSE Units components to maintain consistency and reduce duplication
 */

/**
 * Shared type for explanation sections used across all components
 */
export interface ExplanationSection {
	title: string;
	details: string[];
}

/**
 * Formats a number with thousands separators and handles floating-point precision
 * @param num The number to format
 * @returns Formatted string with commas as thousands separators
 */
export const formatNumber = (num: number): string => {
	// Round to 10 decimal places to avoid floating-point precision issues
	const rounded = Math.round(num * 1e10) / 1e10;
	const parts = rounded.toString().split(".");
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return parts.join(".");
};

/**
 * Removes formatting (commas) from a number string
 * @param str The formatted string to unformat
 * @returns Clean number string without commas
 */
export const unformatNumber = (str: string): string => {
	return str.replace(/,/g, "");
};

/**
 * Rounds a number to prevent floating-point precision errors
 * @param num The number to round
 * @param precision Number of decimal places to preserve (default: 10)
 * @returns Rounded number
 */
export const roundToPrecision = (
	num: number,
	precision: number = 10,
): number => {
	const factor = 10 ** precision;
	return Math.round(num * factor) / factor;
};
