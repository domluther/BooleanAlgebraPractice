import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { type ExplanationSection, formatNumber } from "@/lib/numberUtils";
import { Button } from "./ui/button";

interface Question {
	category: "Multiple Choice";
	type:
		| "conversion"
		| "smallest"
		| "largest"
		| "second smallest"
		| "second largest";
	params: {
		sourceValue?: number;
		sourceUnit?: string;
		targetUnit?: string;
		values?: Array<{ value: number; unit: string; bytes: number }>;
	};
	questionText: string;
	options: string[];
	correctAnswer: number; // Index of correct answer (0-3)
	explanation: ExplanationSection[];
}

const expandUnit = (unit: string): string => {
	switch (unit) {
		case "bytes":
			return "bytes";
		case "KB":
			return "kilobytes";
		case "MB":
			return "megabytes";
		case "GB":
			return "gigabytes";
		case "TB":
			return "terabytes";
		default:
			return unit;
	}
};

// Units array for the order hint
const units = ["bytes", "KB", "MB", "GB", "TB"];

const getUnitColor = (unit: string): string => {
	const colors: Record<string, string> = {
		bytes: "bg-blue-100 text-blue-900",
		KB: "bg-cyan-100 text-cyan-900",
		MB: "bg-teal-100 text-teal-900",
		GB: "bg-green-100 text-green-900",
		TB: "bg-amber-100 text-amber-900",
	};
	return colors[unit] || "bg-gray-100";
};

// Unit conversion utilities
const unitConversions: { [key: string]: number } = {
	// All values in bytes
	bytes: 1,
	KB: 1000,
	MB: 1000 * 1000,
	GB: 1000 * 1000 * 1000,
	TB: 1000 * 1000 * 1000 * 1000,
};

const convertToBytes = (value: number, unit: string): number => {
	return value * unitConversions[unit];
};

const convertFromBytes = (bytes: number, targetUnit: string): number => {
	return bytes / unitConversions[targetUnit];
};

// Question generators
const generateConversionQuestion = (): Question => {
	// Define conversion pairs that work well without calculator
	const conversionPairs = [
		// Decimal TB to GB conversions
		{ source: 0.2, sourceUnit: "TB", targetUnit: "GB", answer: 200 },
		{ source: 0.5, sourceUnit: "TB", targetUnit: "GB", answer: 500 },
		{ source: 0.75, sourceUnit: "TB", targetUnit: "GB", answer: 750 },
		{ source: 1.2, sourceUnit: "TB", targetUnit: "GB", answer: 1200 },
		{ source: 1.5, sourceUnit: "TB", targetUnit: "GB", answer: 1500 },
		{ source: 2.5, sourceUnit: "TB", targetUnit: "GB", answer: 2500 },

		// Multi-digit TB to GB conversions
		{ source: 12, sourceUnit: "TB", targetUnit: "GB", answer: 12000 },
		{ source: 25, sourceUnit: "TB", targetUnit: "GB", answer: 25000 },
		{ source: 35, sourceUnit: "TB", targetUnit: "GB", answer: 35000 },
		{ source: 48, sourceUnit: "TB", targetUnit: "GB", answer: 48000 },
		{ source: 75, sourceUnit: "TB", targetUnit: "GB", answer: 75000 },

		// Decimal TB to MB conversions
		{ source: 0.15, sourceUnit: "TB", targetUnit: "MB", answer: 150000 },
		{ source: 0.25, sourceUnit: "TB", targetUnit: "MB", answer: 250000 },
		{ source: 0.8, sourceUnit: "TB", targetUnit: "MB", answer: 800000 },

		// Decimal GB to MB conversions
		{ source: 1.5, sourceUnit: "GB", targetUnit: "MB", answer: 1500 },
		{ source: 2.5, sourceUnit: "GB", targetUnit: "MB", answer: 2500 },
		{ source: 3.2, sourceUnit: "GB", targetUnit: "MB", answer: 3200 },
		{ source: 4.8, sourceUnit: "GB", targetUnit: "MB", answer: 4800 },
		{ source: 6.4, sourceUnit: "GB", targetUnit: "MB", answer: 6400 },
		{ source: 7.5, sourceUnit: "GB", targetUnit: "MB", answer: 7500 },
		{ source: 12.5, sourceUnit: "GB", targetUnit: "MB", answer: 12500 },

		// Multi-digit GB to MB conversions
		{ source: 15, sourceUnit: "GB", targetUnit: "MB", answer: 15000 },
		{ source: 24, sourceUnit: "GB", targetUnit: "MB", answer: 24000 },
		{ source: 32, sourceUnit: "GB", targetUnit: "MB", answer: 32000 },
		{ source: 64, sourceUnit: "GB", targetUnit: "MB", answer: 64000 },

		// Multi-thousand MB to GB conversions
		{ source: 1200, sourceUnit: "MB", targetUnit: "GB", answer: 1.2 },
		{ source: 1500, sourceUnit: "MB", targetUnit: "GB", answer: 1.5 },
		{ source: 2400, sourceUnit: "MB", targetUnit: "GB", answer: 2.4 },
		{ source: 3200, sourceUnit: "MB", targetUnit: "GB", answer: 3.2 },
		{ source: 4800, sourceUnit: "MB", targetUnit: "GB", answer: 4.8 },
		{ source: 6400, sourceUnit: "MB", targetUnit: "GB", answer: 6.4 },
		{ source: 7500, sourceUnit: "MB", targetUnit: "GB", answer: 7.5 },
		{ source: 12500, sourceUnit: "MB", targetUnit: "GB", answer: 12.5 },

		// Decimal MB to KB conversions
		{ source: 1.5, sourceUnit: "MB", targetUnit: "KB", answer: 1500 },
		{ source: 2.5, sourceUnit: "MB", targetUnit: "KB", answer: 2500 },
		{ source: 4.2, sourceUnit: "MB", targetUnit: "KB", answer: 4200 },
		{ source: 6.8, sourceUnit: "MB", targetUnit: "KB", answer: 6800 },
		{ source: 12.5, sourceUnit: "MB", targetUnit: "KB", answer: 12500 },

		// Multi-digit MB to KB conversions
		{ source: 15, sourceUnit: "MB", targetUnit: "KB", answer: 15000 },
		{ source: 24, sourceUnit: "MB", targetUnit: "KB", answer: 24000 },
		{ source: 32, sourceUnit: "MB", targetUnit: "KB", answer: 32000 },
		{ source: 48, sourceUnit: "MB", targetUnit: "KB", answer: 48000 },
		{ source: 64, sourceUnit: "MB", targetUnit: "KB", answer: 64000 },

		// Multi-thousand KB to MB conversions
		{ source: 1200, sourceUnit: "KB", targetUnit: "MB", answer: 1.2 },
		{ source: 1500, sourceUnit: "KB", targetUnit: "MB", answer: 1.5 },
		{ source: 2400, sourceUnit: "KB", targetUnit: "MB", answer: 2.4 },
		{ source: 3200, sourceUnit: "KB", targetUnit: "MB", answer: 3.2 },
		{ source: 4800, sourceUnit: "KB", targetUnit: "MB", answer: 4.8 },
		{ source: 6400, sourceUnit: "KB", targetUnit: "MB", answer: 6.4 },
		{ source: 7500, sourceUnit: "KB", targetUnit: "MB", answer: 7.5 },
		{ source: 12500, sourceUnit: "KB", targetUnit: "MB", answer: 12.5 },
		{ source: 15000, sourceUnit: "KB", targetUnit: "MB", answer: 15 },
		{ source: 24000, sourceUnit: "KB", targetUnit: "MB", answer: 24 },
		{ source: 32000, sourceUnit: "KB", targetUnit: "MB", answer: 32 },

		// Multi-million bytes to MB conversions
		{ source: 1500000, sourceUnit: "bytes", targetUnit: "MB", answer: 1.5 },
		{ source: 2500000, sourceUnit: "bytes", targetUnit: "MB", answer: 2.5 },
		{ source: 12000000, sourceUnit: "bytes", targetUnit: "MB", answer: 12 },
		{ source: 15000000, sourceUnit: "bytes", targetUnit: "MB", answer: 15 },
		{ source: 24000000, sourceUnit: "bytes", targetUnit: "MB", answer: 24 },
		{ source: 32000000, sourceUnit: "bytes", targetUnit: "MB", answer: 32 },
		{ source: 48000000, sourceUnit: "bytes", targetUnit: "MB", answer: 48 },

		// Decimal MB to bytes conversions
		{ source: 1.5, sourceUnit: "MB", targetUnit: "bytes", answer: 1500000 },
		{ source: 2.5, sourceUnit: "MB", targetUnit: "bytes", answer: 2500000 },
		{ source: 4.2, sourceUnit: "MB", targetUnit: "bytes", answer: 4200000 },
		{ source: 6.8, sourceUnit: "MB", targetUnit: "bytes", answer: 6800000 },
		{ source: 12.5, sourceUnit: "MB", targetUnit: "bytes", answer: 12500000 },

		// Multi-hundred KB to bytes conversions
		{ source: 150, sourceUnit: "KB", targetUnit: "bytes", answer: 150000 },
		{ source: 250, sourceUnit: "KB", targetUnit: "bytes", answer: 250000 },
		{ source: 420, sourceUnit: "KB", targetUnit: "bytes", answer: 420000 },
		{ source: 680, sourceUnit: "KB", targetUnit: "bytes", answer: 680000 },
		{ source: 1250, sourceUnit: "KB", targetUnit: "bytes", answer: 1250000 },

		// Large bytes to KB conversions
		{ source: 150000, sourceUnit: "bytes", targetUnit: "KB", answer: 150 },
		{ source: 250000, sourceUnit: "bytes", targetUnit: "KB", answer: 250 },
		{ source: 420000, sourceUnit: "bytes", targetUnit: "KB", answer: 420 },
		{ source: 680000, sourceUnit: "bytes", targetUnit: "KB", answer: 680 },
		{ source: 1250000, sourceUnit: "bytes", targetUnit: "KB", answer: 1250 },
		{ source: 3200000, sourceUnit: "bytes", targetUnit: "KB", answer: 3200 },
		// Original
		{ source: 0.2, sourceUnit: "TB", targetUnit: "GB", answer: 200 },
		{ source: 2, sourceUnit: "TB", targetUnit: "GB", answer: 2000 },
		{ source: 3, sourceUnit: "TB", targetUnit: "GB", answer: 3000 },
		{ source: 35, sourceUnit: "TB", targetUnit: "GB", answer: 35000 },
		{ source: 5, sourceUnit: "TB", targetUnit: "GB", answer: 5000 },
		{ source: 2, sourceUnit: "TB", targetUnit: "MB", answer: 2000000 },
		{ source: 4, sourceUnit: "GB", targetUnit: "MB", answer: 4000 },
		{ source: 5, sourceUnit: "GB", targetUnit: "MB", answer: 5000 },
		{ source: 8, sourceUnit: "GB", targetUnit: "MB", answer: 8000 },
		{ source: 3000, sourceUnit: "MB", targetUnit: "GB", answer: 3 },
		{ source: 5000, sourceUnit: "MB", targetUnit: "GB", answer: 5 },
		{ source: 2000, sourceUnit: "KB", targetUnit: "MB", answer: 2 },
		{ source: 4000, sourceUnit: "KB", targetUnit: "MB", answer: 4 },
		{ source: 8000, sourceUnit: "KB", targetUnit: "MB", answer: 8 },
		{ source: 3, sourceUnit: "MB", targetUnit: "KB", answer: 3000 },
		{ source: 5, sourceUnit: "MB", targetUnit: "KB", answer: 5000 },
		{ source: 2000000, sourceUnit: "bytes", targetUnit: "MB", answer: 2 },
		{ source: 4000000, sourceUnit: "bytes", targetUnit: "MB", answer: 4 },
	];

	const conversion =
		conversionPairs[Math.floor(Math.random() * conversionPairs.length)];
	const {
		source: sourceValue,
		sourceUnit,
		targetUnit,
		answer: correctAnswer,
	} = conversion;

	// Generate believable distractors
	let wrongAnswers: number[];

	// For conversions where we expect the same starting digit, create distractors with different scales
	if (
		(sourceUnit === "TB" && targetUnit === "MB") ||
		(sourceUnit === "GB" && targetUnit === "KB") ||
		(sourceUnit === "MB" && targetUnit === "bytes")
	) {
		// These are big jumps - create distractors with wrong number of zeros
		wrongAnswers = [
			correctAnswer / 1000, // Missing 3 zeros
			correctAnswer / 100, // Missing 2 zeros
			correctAnswer * 10, // Extra zero
		];
	} else if (sourceUnit === "TB" && targetUnit === "GB") {
		// TB to GB: should have same starting digit with 000
		wrongAnswers = [
			sourceValue * 100, // Wrong scale (100 instead of 1000)
			sourceValue * 10, // Wrong scale (10 instead of 1000)
			sourceValue * 10000, // Too many zeros
		];
	} else if (targetUnit === "bytes") {
		// Converting to bytes - create distractors with different scales
		wrongAnswers = [
			correctAnswer / 1000, // Divided instead of multiplied
			correctAnswer * 10, // Wrong scale
			correctAnswer / 100, // Wrong calculation
		];
	} else {
		// General distractors
		wrongAnswers = [
			correctAnswer * 10,
			correctAnswer / 10,
			correctAnswer * 100,
		];
	}

	// Ensure wrong answers are positive and reasonable
	wrongAnswers = wrongAnswers.filter((ans) => ans > 0 && ans !== correctAnswer);

	// Take first 3 distractors and add correct answer
	const allOptions = [correctAnswer, ...wrongAnswers.slice(0, 3)];
	const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
	const correctIndex = shuffledOptions.indexOf(correctAnswer);

	const formattedOptions = shuffledOptions.map((option) => {
		if (targetUnit === "bytes") {
			return `${formatNumber(Math.round(option))} ${targetUnit}`;
		}
		return `${formatNumber(option)} ${targetUnit}`;
	});

	return {
		category: "Multiple Choice",
		type: "conversion",
		params: { sourceValue, sourceUnit, targetUnit },
		questionText: `Identify the quantity of ${expandUnit(targetUnit)} that is the same as ${formatNumber(sourceValue)} ${expandUnit(sourceUnit)}.`,
		options: formattedOptions,
		correctAnswer: correctIndex,
		explanation: [
			{
				title: "Identify the conversion",
				details: [
					`Converting ${formatNumber(sourceValue)} ${sourceUnit} to ${targetUnit}`,
					`1 ${sourceUnit} = ${formatNumber(unitConversions[sourceUnit] / unitConversions[targetUnit])} ${targetUnit}`,
				],
			},
			{
				title: "Calculate the result",
				details: [
					`${formatNumber(sourceValue)} × ${formatNumber(unitConversions[sourceUnit] / unitConversions[targetUnit])} = ${formatNumber(correctAnswer)} ${targetUnit}`,
				],
			},
		],
	};
};

const generateComparisonQuestion = (): Question => {
	const types: Question["type"][] = [
		"smallest",
		"second smallest",
		"second largest",
		"largest",
	];
	const type: Question["type"] =
		types[Math.floor(Math.random() * types.length)];

	// Predefined sets of values that are calculator-friendly and create good distractors
	const comparisonSets = [
		// Set 1: Mix of units with clear ordering
		[
			{ value: 300, unit: "MB" },
			{ value: 2.1, unit: "GB" },
			{ value: 200000, unit: "KB" },
			{ value: 0.0025, unit: "TB" },
		],
		// Set 2: Different scale mix
		[
			{ value: 2000000, unit: "bytes" },
			{ value: 2300, unit: "KB" },
			{ value: 200, unit: "MB" },
			{ value: 0.1, unit: "GB" },
		],
		// Set 3: Close values requiring careful conversion
		[
			{ value: 1500, unit: "MB" },
			{ value: 1.6, unit: "GB" },
			{ value: 1300000, unit: "KB" },
			{ value: 0.0014, unit: "TB" },
		],
		// Set 4: Another mix
		[
			{ value: 5000000, unit: "bytes" },
			{ value: 4800, unit: "KB" },
			{ value: 5.2, unit: "MB" },
			{ value: 0.004, unit: "GB" },
		],
		// Set 5: Larger numbers
		[
			{ value: 800, unit: "MB" },
			{ value: 0.9, unit: "GB" },
			{ value: 750000, unit: "KB" },
			{ value: 0.00085, unit: "TB" },
		],
		// Set 6: Small file sizes
		[
			{ value: 50000, unit: "bytes" },
			{ value: 45, unit: "KB" },
			{ value: 0.06, unit: "MB" },
			{ value: 0.000055, unit: "GB" },
		],
		// Set 7: Medium range mix
		[
			{ value: 750, unit: "MB" },
			{ value: 0.8, unit: "GB" },
			{ value: 700000, unit: "KB" },
			{ value: 850000000, unit: "bytes" },
		],
		// Set 8: Close decimals
		[
			{ value: 2.5, unit: "GB" },
			{ value: 2400, unit: "MB" },
			{ value: 2600000, unit: "KB" },
			{ value: 0.0023, unit: "TB" },
		],
		// Set 9: Round numbers
		[
			{ value: 3000, unit: "MB" },
			{ value: 3.2, unit: "GB" },
			{ value: 2800000, unit: "KB" },
			{ value: 0.032, unit: "TB" },
		],
		// Set 10: Smaller scale
		[
			{ value: 120, unit: "MB" },
			{ value: 0.15, unit: "GB" },
			{ value: 100000, unit: "KB" },
			{ value: 140000000, unit: "bytes" },
		],
		// Set 11: Mixed decimals
		[
			{ value: 4.5, unit: "GB" },
			{ value: 4200, unit: "MB" },
			{ value: 4800000, unit: "KB" },
			{ value: 0.004, unit: "TB" },
		],
		// Set 12: Large range
		[
			{ value: 6000, unit: "MB" },
			{ value: 5.8, unit: "GB" },
			{ value: 6200000, unit: "KB" },
			{ value: 0.0059, unit: "TB" },
		],
		// Set 13: Very small files
		[
			{ value: 15000, unit: "bytes" },
			{ value: 12, unit: "KB" },
			{ value: 0.018, unit: "MB" },
			{ value: 0.000014, unit: "GB" },
		],
		// Set 14: Tricky decimals
		[
			{ value: 12, unit: "GB" },
			{ value: 1300, unit: "MB" },
			{ value: 1100000, unit: "KB" },
			{ value: 0.0012, unit: "TB" },
		],
		// Set 15: Mid-range variety
		[
			{ value: 900, unit: "MB" },
			{ value: 0.85, unit: "GB" },
			{ value: 950000, unit: "KB" },
			{ value: 880000000, unit: "bytes" },
		],
		// Set 16: Large files
		[
			{ value: 7500, unit: "MB" },
			{ value: 7.2, unit: "GB" },
			{ value: 7800000, unit: "KB" },
			{ value: 0.007, unit: "TB" },
		],
		// Set 17: Close comparison
		[
			{ value: 2.8, unit: "GB" },
			{ value: 2700, unit: "MB" },
			{ value: 2900000, unit: "KB" },
			{ value: 0.0026, unit: "TB" },
		],
		// Set 18: Mixed small/large
		[
			{ value: 350, unit: "MB" },
			{ value: 0.4, unit: "GB" },
			{ value: 320000, unit: "KB" },
			{ value: 380000000, unit: "bytes" },
		],
		// Set 19: Even distribution
		[
			{ value: 180, unit: "MB" },
			{ value: 1.7, unit: "GB" },
			{ value: 1900000, unit: "KB" },
			{ value: 0.0018, unit: "TB" },
		],
		// Set 20: Final variety set
		[
			{ value: 650, unit: "MB" },
			{ value: 0.7, unit: "GB" },
			{ value: 600000, unit: "KB" },
			{ value: 680000000, unit: "bytes" },
		],
		// Set 21: Mix of units with clear ordering
		[
			{ value: 300, unit: "MB" },
			{ value: 2.1, unit: "GB" },
			{ value: 200000, unit: "KB" },
			{ value: 0.025, unit: "TB" },
		],
		// Set 22: Different scale mix
		[
			{ value: 2000000, unit: "bytes" },
			{ value: 2300, unit: "KB" },
			{ value: 200, unit: "MB" },
			{ value: 0.1, unit: "GB" },
		],
		// Set 23: Close values requiring careful conversion
		[
			{ value: 1500, unit: "MB" },
			{ value: 1.6, unit: "GB" },
			{ value: 1300000, unit: "KB" },
			{ value: 0.0014, unit: "TB" },
		],
		// Set 24: Bytes looks biggest but isn't
		[
			{ value: 8000000, unit: "bytes" },
			{ value: 12, unit: "MB" },
			{ value: 9500, unit: "KB" },
			{ value: 0.01, unit: "GB" },
		],
		// Set 25: TB looks smallest but is largest
		[
			{ value: 450, unit: "MB" },
			{ value: 520000, unit: "KB" },
			{ value: 600000000, unit: "bytes" },
			{ value: 0.8, unit: "GB" },
		],
		// Set 26: KB number is huge but actually small
		[
			{ value: 750000, unit: "KB" },
			{ value: 0.9, unit: "GB" },
			{ value: 800, unit: "MB" },
			{ value: 700000000, unit: "bytes" },
		],
		// Set 27: Decimal GB is actually largest
		[
			{ value: 1200000, unit: "KB" },
			{ value: 1500000000, unit: "bytes" },
			{ value: 1100, unit: "MB" },
			{ value: 1.8, unit: "GB" },
		],
		// Set 28: Small TB beats everything
		[
			{ value: 2500, unit: "MB" },
			{ value: 2800000, unit: "KB" },
			{ value: 2200000000, unit: "bytes" },
			{ value: 0.003, unit: "TB" },
		],
		// Set 29: Bytes looks massive but is tiny
		[
			{ value: 95000000, unit: "bytes" },
			{ value: 120, unit: "MB" },
			{ value: 110000, unit: "KB" },
			{ value: 0.08, unit: "GB" },
		],
		// Set 30: Close race between units
		[
			{ value: 0.65, unit: "GB" },
			{ value: 680, unit: "MB" },
			{ value: 620000, unit: "KB" },
			{ value: 700000000, unit: "bytes" },
		],
		// Set 31: TB decimal wins despite small number
		[
			{ value: 1800, unit: "MB" },
			{ value: 1950000, unit: "KB" },
			{ value: 1700000000, unit: "bytes" },
			{ value: 0.002, unit: "TB" },
		],
		// Set 32: GB decimal vs large KB
		[
			{ value: 1.4, unit: "GB" },
			{ value: 1500000, unit: "KB" },
			{ value: 1350, unit: "MB" },
			{ value: 1600000000, unit: "bytes" },
		],
		// Set 33: Mixed small/medium values
		[
			{ value: 85000000, unit: "bytes" },
			{ value: 92, unit: "MB" },
			{ value: 88000, unit: "KB" },
			{ value: 0.09, unit: "GB" },
		],
		// Set 34: Large KB vs small GB
		[
			{ value: 950000, unit: "KB" },
			{ value: 0.85, unit: "GB" },
			{ value: 1000, unit: "MB" },
			{ value: 900000000, unit: "bytes" },
		],
		// Set 35: Tricky ordering
		[
			{ value: 1.25, unit: "GB" },
			{ value: 1350000, unit: "KB" },
			{ value: 1200, unit: "MB" },
			{ value: 1400000000, unit: "bytes" },
		],
		// Set 36: Small decimals vs large numbers
		[
			{ value: 0.0035, unit: "TB" },
			{ value: 3200, unit: "MB" },
			{ value: 3400000, unit: "KB" },
			{ value: 3000000000, unit: "bytes" },
		],
		// Set 37: Close competition
		[
			{ value: 2.3, unit: "GB" },
			{ value: 2400000, unit: "KB" },
			{ value: 2200, unit: "MB" },
			{ value: 2500000000, unit: "bytes" },
		],
		// Set 38: Misleading large numbers
		[
			{ value: 750000000, unit: "bytes" },
			{ value: 0.82, unit: "GB" },
			{ value: 800000, unit: "KB" },
			{ value: 720, unit: "MB" },
		],
		// Set 39: Very close values
		[
			{ value: 1.15, unit: "GB" },
			{ value: 1180, unit: "MB" },
			{ value: 1120000, unit: "KB" },
			{ value: 1200000000, unit: "bytes" },
		],
		// Set 40: Final challenging set
		[
			{ value: 0.0028, unit: "TB" },
			{ value: 2650, unit: "MB" },
			{ value: 2900000, unit: "KB" },
			{ value: 2400000000, unit: "bytes" },
		],
	];

	const selectedSetIndex = Math.floor(Math.random() * comparisonSets.length);
	const selectedSet = comparisonSets[selectedSetIndex];

	// Use KB for small file sets (Set 6 and Set 13), MB for others
	const useKB = selectedSetIndex === 5 || selectedSetIndex === 12; // Set 6 and Set 13 (0-indexed)
	const commonUnit = useKB ? "KB" : "MB";

	// Calculate bytes for each value
	const valuesWithBytes = selectedSet.map((v) => ({
		...v,
		bytes: convertToBytes(v.value, v.unit),
	}));

	// Sort by bytes to find correct answer
	valuesWithBytes.sort((a, b) => a.bytes - b.bytes);
	const correctValue =
		type === "smallest"
			? valuesWithBytes[0]
			: type === "second smallest"
				? valuesWithBytes[1]
				: type === "second largest"
					? valuesWithBytes[2]
					: valuesWithBytes[3];

	// Shuffle the display order
	const shuffledValues = [...valuesWithBytes].sort(() => Math.random() - 0.5);
	const correctAnswerIndex = shuffledValues.findIndex(
		(v) => v.bytes === correctValue.bytes,
	);

	const formattedOptions = shuffledValues.map(
		(v) => `${formatNumber(v.value)} ${v.unit}`,
	);

	return {
		category: "Multiple Choice",
		type,
		params: { values: shuffledValues },
		questionText: `Identify the ${type} secondary storage capacity.`,
		options: formattedOptions,
		correctAnswer: correctAnswerIndex,
		explanation: [
			{
				title: `Convert all values to a common base unit (${commonUnit})`,
				details: shuffledValues.map((v) => {
					const converted = convertFromBytes(v.bytes, commonUnit);
					if (v.unit === commonUnit) {
						return `${formatNumber(v.value)} ${v.unit} = ${formatNumber(v.value)} ${commonUnit}`;
					}
					return `${formatNumber(v.value)} ${v.unit} = ${formatNumber(Number(converted.toFixed(3)))} ${commonUnit}`;
				}),
			},
			{
				title: `Find the ${type} value`,
				details: (() => {
					// Sort all values by their byte equivalent for display
					const sortedByBytes = [...valuesWithBytes].sort(
						(a, b) => a.bytes - b.bytes,
					);
					const sortedValues = sortedByBytes.map((v) => {
						const converted = Number(
							convertFromBytes(v.bytes, commonUnit).toFixed(3),
						);
						const isCorrect = v.bytes === correctValue.bytes;
						return {
							original: `${formatNumber(v.value)} ${v.unit}`,
							converted: converted,
							isCorrect,
						};
					});

					// Create the ordered comparison string with markers for bold text
					const comparisonParts = sortedValues.map((item) => {
						const convertedText = `${formatNumber(item.converted)} ${commonUnit}`;
						if (item.isCorrect) {
							return `[BOLD]${convertedText}[/BOLD]`;
						}
						return convertedText;
					});

					const comparisonString = comparisonParts.join(" < ");
					const correctConverted = Number(
						convertFromBytes(correctValue.bytes, commonUnit).toFixed(3),
					);

					return [
						comparisonString,
						`${type.charAt(0).toUpperCase() + type.slice(1)}: ${formatNumber(correctValue.value)} ${correctValue.unit} = [BOLD]${formatNumber(correctConverted)} ${commonUnit}[/BOLD]`,
					];
				})(),
			},
		],
	};
};

// Main question generator function
const generateQuestion = (
	setHasSubmitted: (value: boolean) => void,
	setCurrentQuestion: (question: Question | null) => void,
	setSelectedAnswer: (answer: number | null) => void,
	setFeedback: (
		feedback: {
			isCorrect: boolean;
			message: string;
			explanation: ExplanationSection[];
		} | null,
	) => void,
	enableConversion: boolean,
	enableComparison: boolean,
): void => {
	setHasSubmitted(false);

	// Build question types array based on enabled options
	const questionTypes = [];
	if (enableConversion) questionTypes.push(generateConversionQuestion);
	if (enableComparison) questionTypes.push(generateComparisonQuestion);

	// Ensure at least one question type is enabled - Should never be possible due to UI constraints
	if (questionTypes.length === 0) {
		console.warn("No question types enabled, defaulting to both");
		questionTypes.push(generateConversionQuestion, generateComparisonQuestion);
	}

	const newQuestion =
		questionTypes[Math.floor(Math.random() * questionTypes.length)]();
	setCurrentQuestion(newQuestion);
	setSelectedAnswer(null);
	setFeedback(null);
};

interface UnitConverterProps {
	onScoreUpdate: (isCorrect: boolean, questionType: string) => void;
}

export function MultipleChoice({ onScoreUpdate }: UnitConverterProps) {
	const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [feedback, setFeedback] = useState<{
		isCorrect: boolean;
		message: string;
		explanation: ExplanationSection[];
	} | null>(null);
	const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
	const [showUnitsOrder, setShowUnitsOrder] = useState<boolean>(false);
	const [enableConversion, setEnableConversion] = useState<boolean>(true);
	const [enableComparison, setEnableComparison] = useState<boolean>(true);

	// Generate unique IDs for accessibility
	const converterTitleId = useId();
	const currentQuestionId = useId();
	const feedbackMessageId = useId();
	const welcomeMessageId = useId();
	const hintTitleId = useId();

	useEffect(() => {
		generateQuestion(
			setHasSubmitted,
			setCurrentQuestion,
			setSelectedAnswer,
			setFeedback,
			enableConversion,
			enableComparison,
		);
	}, [enableConversion, enableComparison]);

	// Handle option selection and submission
	const handleOptionClick = useCallback(
		(optionIndex: number) => {
			if (hasSubmitted || !currentQuestion) return;

			setSelectedAnswer(optionIndex);
			setHasSubmitted(true);

			const isCorrect = optionIndex === currentQuestion.correctAnswer;

			setFeedback({
				isCorrect,
				message: isCorrect ? "Correct!" : "Incorrect",
				explanation: currentQuestion.explanation,
			});
			console.log("Option clicked:", optionIndex);
			onScoreUpdate(isCorrect, currentQuestion.category);
		},
		[hasSubmitted, currentQuestion, onScoreUpdate],
	);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (hasSubmitted || !currentQuestion) return;

			const key = parseInt(event.key, 10);
			if (key >= 1 && key <= 4) {
				const optionIndex = key - 1; // Convert '1' key to index 0, etc.
				if (optionIndex < currentQuestion.options.length) {
					handleOptionClick(optionIndex);
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [hasSubmitted, currentQuestion, handleOptionClick]);

	// Global keyboard listener for Enter key when hasSubmitted is true
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Enter" && hasSubmitted && currentQuestion) {
				generateQuestion(
					setHasSubmitted,
					setCurrentQuestion,
					setSelectedAnswer,
					setFeedback,
					enableConversion,
					enableComparison,
				);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [hasSubmitted, currentQuestion, enableConversion, enableComparison]);

	const getButtonClassName = (optionIndex: number): string => {
		// MODIFICATION: Added 'relative' and changed 'text-left' to 'text-center'
		const baseClasses =
			"relative w-full p-6 text-center text-lg font-semibold transition-all duration-200 rounded-lg border-2 shadow-md hover:shadow-lg";

		if (!hasSubmitted) {
			return `${baseClasses} border-checkbox-label-border bg-card hover:bg-checkbox-label-bg-hover hover:border-checkbox-label-border-hover text-foreground hover:text-hint-card-title`;
		}

		if (optionIndex === currentQuestion?.correctAnswer) {
			return `${baseClasses} bg-feedback-success-bg border-stats-accuracy-high text-feedback-success-text`;
		}

		if (optionIndex === selectedAnswer) {
			return `${baseClasses} bg-feedback-error-bg border-stats-accuracy-low text-feedback-error-text`;
		}

		return `${baseClasses} bg-muted border-border text-muted-foreground`;
	};

	return (
		<main className="w-full" aria-labelledby={converterTitleId}>
			<h1 id={converterTitleId} className="sr-only">
				Unit Converter Quiz
			</h1>
			<div className="p-2 sm:p-4">
				<Card className="py-0 mx-auto shadow-xl bg-card/80 backdrop-blur">
					<CardContent className="p-4 space-y-4 sm:p-6 lg:p-8 sm:space-y-6">
						{/* Live region for screen reader announcements */}
						<div aria-live="polite" aria-atomic="true" className="sr-only">
							{feedback?.message}
						</div>

						{currentQuestion ? (
							<section aria-labelledby={currentQuestionId}>
								<h2
									id={currentQuestionId}
									className="p-6 text-lg font-semibold rounded-lg shadow text-question-prompt-text bg-question-prompt-bg"
								>
									{currentQuestion.questionText}
								</h2>

								<div className="mt-6">
									<fieldset>
										<legend className="sr-only">Choose your answer</legend>
										<div className="flex flex-col gap-4 mb-2 sm:grid sm:grid-cols-2">
											{/* MODIFICATION: Updated button structure */}
											{currentQuestion.options.map((option, index) => (
												<Button
													key={option}
													type="button"
													onClick={() => handleOptionClick(index)}
													disabled={hasSubmitted}
													className={getButtonClassName(index)}
													aria-describedby={
														hasSubmitted ? feedbackMessageId : undefined
													}
												>
													<span className="absolute flex items-center justify-center text-sm font-bold rounded-full shadow-sm text-level-card-text bg-level-card-bg top-2 left-2 w-7 h-7">
														{index + 1}
													</span>

													<span>{option}</span>

													{hasSubmitted && (
														<span className="absolute text-2xl -translate-y-1/2 right-4 top-1/2">
															{index === currentQuestion.correctAnswer
																? "✅"
																: index === selectedAnswer
																	? "❌"
																	: ""}
														</span>
													)}
												</Button>
											))}
										</div>
									</fieldset>
								</div>

								{feedback && (
									<div className="mt-4">
										<Alert
											id={feedbackMessageId}
											aria-live="polite"
											className={`border-2 shadow-lg ${
												feedback.isCorrect
													? "bg-feedback-success-bg border-stats-accuracy-high"
													: "bg-feedback-error-bg border-stats-accuracy-low"
											}`}
										>
											<AlertDescription>
												<div className="w-full space-y-4">
													{/* Result Header */}
													<div
														className={`p-4 rounded-lg ${
															feedback.isCorrect
																? "bg-feedback-success-bg"
																: "bg-feedback-error-bg"
														}`}
													>
														<div
															className={`flex items-center text-xl font-bold ${
																feedback.isCorrect
																	? "text-feedback-success-text"
																	: "text-feedback-error-text"
															}`}
														>
															<span className="mr-3 text-2xl">
																{feedback.isCorrect ? "🎉" : "❌"}
															</span>
															<span>
																{feedback.isCorrect
																	? "Excellent work!"
																	: "Not quite right"}
															</span>
														</div>
														{!feedback.isCorrect && (
															<div className="mt-2 font-semibold text-feedback-error-text">
																The correct answer is{" "}
																<span className="px-2 py-1 border rounded text-feedback-error-text bg-feedback-error-bg border-stats-accuracy-low">
																	{
																		currentQuestion.options[
																			currentQuestion.correctAnswer
																		]
																	}
																</span>
															</div>
														)}
													</div>

													{/* Next Question Button */}
													<div className="flex justify-center pt-2">
														<button
															type="button"
															onClick={() => {
																generateQuestion(
																	setHasSubmitted,
																	setCurrentQuestion,
																	setSelectedAnswer,
																	setFeedback,
																	enableConversion,
																	enableComparison,
																);
															}}
															aria-label="Generate next question"
															className="px-8 py-3 font-semibold transition-all duration-200 transform rounded-lg shadow-lg text-action-button-text bg-action-button-bg hover:bg-action-button-bg-hover hover:shadow-xl hover:-translate-y-1"
														>
															<span className="mr-2">🎯</span>
															Next Question
														</button>
													</div>

													{/* Explanation Section */}
													<div className="space-y-4">
														<h3 className="flex items-center mb-3 text-lg font-bold text-hint-card-title">
															<span className="mr-2">📚</span>
															Step-by-step explanation:
														</h3>
														{feedback.explanation.map(
															(section, sectionIndex) => (
																<div
																	key={section.title}
																	className="p-4 bg-opacity-50 border rounded-lg bg-card border-border"
																>
																	<h4 className="flex items-center mb-2 text-base font-bold text-hint-card-title">
																		<span className="flex items-center justify-center flex-shrink-0 w-6 h-6 mr-3 text-sm font-semibold border rounded-full text-hint-card-title bg-hint-card-bg border-hint-card-border">
																			{sectionIndex + 1}
																		</span>
																		{section.title}
																	</h4>
																	<ul className="space-y-1 ml-9">
																		{section.details.map(
																			(detail, detailIndex) => {
																				// Parse bold markers and render accordingly
																				const renderDetailWithBold = (
																					text: string,
																				) => {
																					const parts = text.split(
																						/(\[BOLD\].*?\[\/BOLD\])/,
																					);
																					return parts.map((part) => {
																						if (
																							part.startsWith("[BOLD]") &&
																							part.endsWith("[/BOLD]")
																						) {
																							const boldText = part.replace(
																								/\[BOLD\]|\[\/BOLD\]/g,
																								"",
																							);
																							return (
																								<span
																									key={`bold-${boldText}`}
																									className="font-bold text-hint-card-title"
																								>
																									{boldText}
																								</span>
																							);
																						}
																						return part;
																					});
																				};
																				return (
																					<li
																						key={`detail-${detail.slice(0, 50)}-${detailIndex}`}
																						className="text-hint-card-text"
																					>
																						<span className="mr-2 text-hint-card-border">
																							•
																						</span>
																						{renderDetailWithBold(detail)}
																					</li>
																				);
																			},
																		)}
																	</ul>
																</div>
															),
														)}
													</div>
												</div>
											</AlertDescription>
										</Alert>
									</div>
								)}

								{/* Settings Section */}
								<div className="mt-6">
									<div className="p-3 border rounded-lg border-border sm:p-4 bg-card">
										<div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
											{/* Question Type Settings */}
											<div className="col-span-2 space-y-2 sm:space-y-3">
												<h4 className="text-sm font-semibold text-foreground sm:text-base">
													Question Types
												</h4>
												<div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
													{/* Conversion Questions */}
													<div className="flex items-center min-w-0 gap-2">
														<span className="text-base sm:text-lg">🔄</span>
														<span className="text-xs font-semibold truncate text-foreground sm:text-sm">
															Conversion
														</span>
														<Switch
															checked={enableConversion}
															onCheckedChange={(checked) => {
																if (!checked && !enableComparison) {
																	// If trying to disable conversion when comparison is off,
																	// disable conversion and enable comparison
																	setEnableConversion(false);
																	setEnableComparison(true);
																} else {
																	setEnableConversion(checked);
																}
															}}
															className="data-[state=unchecked]:bg-input data-[state=unchecked]:border-2 data-[state=unchecked]:border-input data-[state=checked]:bg-button-primary data-[state=checked]:border-primary flex-shrink-0"
															aria-label="Toggle conversion questions"
															title="Enable/disable unit conversion questions"
														/>
													</div>

													{/* Comparison Questions */}
													<div className="flex items-center min-w-0 gap-2">
														<span className="text-base sm:text-lg">📊</span>
														<span className="text-xs font-semibold truncate text-foreground sm:text-sm">
															Comparison
														</span>
														<Switch
															checked={enableComparison}
															onCheckedChange={(checked) => {
																if (!checked && !enableConversion) {
																	// If trying to disable comparison when conversion is off,
																	// disable comparison and enable conversion
																	setEnableComparison(false);
																	setEnableConversion(true);
																} else {
																	setEnableComparison(checked);
																}
															}}
															className="data-[state=unchecked]:bg-input data-[state=unchecked]:border-2 data-[state=unchecked]:border-input data-[state=checked]:bg-button-primary data-[state=checked]:border-primary flex-shrink-0"
															aria-label="Toggle comparison questions"
															title="Enable/disable size comparison questions"
														/>
													</div>
												</div>
											</div>

											{/* Units Order Hint */}
											<div className="flex items-center justify-start min-w-0 gap-2 sm:justify-end">
												<span className="text-base sm:text-lg">📋</span>
												<span className="text-xs font-semibold truncate text-foreground sm:text-sm">
													Units Order
												</span>
												<Switch
													checked={showUnitsOrder}
													onCheckedChange={setShowUnitsOrder}
													className="data-[state=unchecked]:bg-input data-[state=unchecked]:border-2 data-[state=unchecked]:border-input data-[state=checked]:bg-button-primary data-[state=checked]:border-primary flex-shrink-0"
													aria-label="Toggle units order hint"
													title="Show/hide the ordered list of units from smallest to largest"
												/>
											</div>
										</div>
									</div>
								</div>

								{/* Units Order Hint Section */}
								{showUnitsOrder && (
									<section aria-labelledby={hintTitleId} className="mt-6">
										<h3
											id={hintTitleId}
											className="flex items-center mb-3 font-semibold text-hint-summary-text"
										>
											<span className="mr-2 text-lg">📋</span>
											Units in order (smallest to largest)
										</h3>
										<div className="p-4 border-l-4 rounded-r-lg shadow-inner border-hint-card-border bg-hint-content-bg">
											<div className="flex flex-wrap items-center gap-2">
												{units.map((unit, index) => [
													<span
														key={unit}
														className={`px-2 py-1 rounded text-sm ${getUnitColor(unit)}`}
													>
														{unit}
													</span>,
													index < units.length - 1 && (
														<ArrowRight
															key={`arrow-from-${unit}-to-${units[index + 1]}`}
															className="w-4 h-4 text-hint-card-border"
														/>
													),
												])}
											</div>
										</div>
									</section>
								)}

								<details className="mt-6 group">
									<summary className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg px-4 py-3 bg-hint-summary-bg border border-hint-summary-border hover:bg-hint-summary-bg-hover transition-all duration-200 shadow-sm hover:shadow-md list-none [&::-webkit-details-marker]:hidden">
										<span className="flex items-center font-semibold text-hint-summary-text">
											<span className="mr-2 text-lg">💡</span>
											Get conversion help
											<span className="ml-auto transition-transform duration-200 group-open:rotate-180">
												▼
											</span>
										</span>
									</summary>
									<section>
										<div className="p-4 mt-3 border-l-4 rounded-r-lg shadow-inner border-hint-card-border bg-hint-content-bg">
											<div className="text-sm font-light text-hint-summary-text">
												{currentQuestion.type === "conversion"
													? "💾 - Remember: 1 KB = 1,000 bytes, 1 MB = 1,000 KB, 1 GB = 1,000 MB, 1 TB = 1,000 GB"
													: "📊 - Convert all values to the same unit (like bytes) to compare them easily"}
											</div>
										</div>
									</section>
								</details>
							</section>
						) : (
							<section
								className="py-12 text-center"
								aria-labelledby={welcomeMessageId}
							>
								<div className="p-8 border shadow-lg border-hint-card-border bg-hint-content-bg rounded-xl">
									<div className="mb-4 text-6xl">📏</div>
									<h2
										id={welcomeMessageId}
										className="mb-4 text-2xl font-bold text-hint-card-title md:text-3xl"
									>
										Unit Converter Quiz
									</h2>
									<p className="max-w-md mx-auto mb-6 text-lg text-hint-card-text">
										Practice converting between storage units and comparing file
										sizes. Master bytes, KB, MB, GB, and TB!
									</p>
									<button
										type="button"
										onClick={() => {
											generateQuestion(
												setHasSubmitted,
												setCurrentQuestion,
												setSelectedAnswer,
												setFeedback,
												enableConversion,
												enableComparison,
											);
										}}
										className="px-8 py-3 font-semibold transition-all duration-200 transform rounded-lg shadow-lg text-button-primary-text bg-button-primary hover:bg-button-primary-hover hover:shadow-xl hover:-translate-y-1"
									>
										<span className="mr-2">🚀</span>
										Start Practicing
									</button>
								</div>
							</section>
						)}
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
