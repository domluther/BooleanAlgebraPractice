import { ArrowRight } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
	type ExplanationSection,
	formatNumber,
	roundToPrecision,
} from "@/lib/numberUtils";
import { useQuizInteraction } from "@/lib/quizHooks";

interface Question {
	category: "Converting Units";
	finalValue: number;
	fromUnit: string;
	toUnit: string;
	answer: number;
	explanation: ExplanationSection[];
}

const ConversionPathVisual = ({
	fromUnit,
	toUnit,
}: {
	fromUnit: string;
	toUnit: string;
}) => {
	const path = getConversionPath(fromUnit, toUnit);

	return (
		<div className="flex flex-wrap items-center gap-1 p-3 rounded-lg shadow-inner sm:gap-2 sm:p-4 bg-hint-content-bg">
			{path.map((unit, index) => [
				<div
					key={unit}
					className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md shadow-sm ${getUnitColor(unit)}`}
				>
					{unit}
				</div>,
				index < path.length - 1 && (
					<ArrowRight
						key={`path-arrow-from-${unit}-to-${path[index + 1]}`}
						className="flex-shrink-0 w-3 h-3 text-hint-card-border sm:w-4 sm:h-4"
					/>
				),
			])}
		</div>
	);
};

// Utility constants and functions moved outside component
const units = [
	"bits",
	"bytes",
	"kilobytes",
	"megabytes",
	"gigabytes",
	"terabytes",
	"petabytes",
];

const getUnitColor = (unit: string): string => {
	const colors: Record<string, string> = {
		bits: "bg-purple-100 text-purple-900",
		bytes: "bg-blue-100 text-blue-900",
		kilobytes: "bg-cyan-100 text-cyan-900",
		megabytes: "bg-teal-100 text-teal-900",
		gigabytes: "bg-green-100 text-green-900",
		terabytes: "bg-amber-100 text-amber-900",
		petabytes: "bg-orange-100 text-orange-900",
	};
	return colors[unit] || "bg-gray-100";
};

const getConversionPath = (fromUnit: string, toUnit: string): string[] => {
	const fromIndex = units.indexOf(fromUnit as (typeof units)[number]);
	const toIndex = units.indexOf(toUnit as (typeof units)[number]);
	const path: string[] = [];

	if (fromUnit === "bits" && toUnit !== "bits") {
		path.push("bits", "bytes");
		let currentIndex = 1;
		while (currentIndex < toIndex) {
			path.push(units[currentIndex + 1]);
			currentIndex++;
		}
	} else if (toUnit === "bits" && fromUnit !== "bits") {
		let currentIndex = fromIndex;
		while (currentIndex > 1) {
			path.push(units[currentIndex]);
			currentIndex--;
		}
		path.push("bytes", "bits");
	} else {
		const step = fromIndex < toIndex ? 1 : -1;
		for (let i = fromIndex; i !== toIndex + step; i += step) {
			path.push(units[i]);
		}
	}

	return path;
};

const getStepsBetweenUnits = (fromUnit: string, toUnit: string): number => {
	const fromIndex = units.indexOf(fromUnit as (typeof units)[number]);
	const toIndex = units.indexOf(toUnit as (typeof units)[number]);
	return Math.abs(toIndex - fromIndex);
};

const getMultiplier = (unit: string): number => {
	const multipliers: Record<string, number> = {
		bytes: 1,
		kilobytes: 1000,
		megabytes: 1000000,
		gigabytes: 1000000000,
		terabytes: 1000000000000,
		petabytes: 1000000000000000,
	};
	return multipliers[unit];
};

const calculateAnswer = (value: number, fromUnit: string, toUnit: string) => {
	let valueInBytes: number;
	if (fromUnit === "bits") {
		valueInBytes = value / 8;
	} else {
		valueInBytes = value * getMultiplier(fromUnit);
	}

	if (toUnit === "bits") {
		return valueInBytes * 8;
	} else {
		return valueInBytes / getMultiplier(toUnit);
	}
};

const generateExplanation = (
	value: number,
	fromUnit: string,
	toUnit: string,
): ExplanationSection[] => {
	const fromIndex = units.indexOf(fromUnit as (typeof units)[number]);
	const toIndex = units.indexOf(toUnit as (typeof units)[number]);
	const explanation: ExplanationSection[] = [];

	// Add identification step
	explanation.push({
		title: "Identify the conversion",
		details: [
			`Starting value: ${formatNumber(value)} ${fromUnit}`,
			`Target unit: ${toUnit}`,
		],
	});

	const steps: string[] = [];
	let workingFromIndex = fromIndex;
	let workingValue = value;

	if (workingFromIndex < toIndex) {
		while (workingFromIndex < toIndex) {
			let step = `Convert ${formatNumber(workingValue)} ${units[workingFromIndex]} to ${units[workingFromIndex + 1]}`;
			// Bits to bytes - divide by 8, otherwise divide by 1000
			if (workingFromIndex === 0) {
				workingValue = roundToPrecision(workingValue / 8);
				step += ` → ${formatNumber(workingValue * 8)} ÷ 8 = ${formatNumber(workingValue)} ${units[workingFromIndex + 1]}`;
			} else {
				workingValue = roundToPrecision(workingValue / 1000);
				step += ` → ${formatNumber(workingValue * 1000)} ÷ 1,000 = ${formatNumber(workingValue)} ${units[workingFromIndex + 1]}`;
			}
			steps.push(step);
			workingFromIndex++;
		}
	} else {
		while (workingFromIndex > toIndex) {
			let step = `Convert ${formatNumber(workingValue)} ${units[workingFromIndex]} to ${units[workingFromIndex - 1]}`;
			// Bytes to bits - multiply by 8, otherwise multiply by 1000
			if (workingFromIndex === 1) {
				workingValue = roundToPrecision(workingValue * 8);
				step += ` → ${formatNumber(workingValue / 8)} × 8 = ${formatNumber(workingValue)} ${units[workingFromIndex - 1]}`;
			} else {
				workingValue = roundToPrecision(workingValue * 1000);
				step += ` → ${formatNumber(workingValue / 1000)} × 1,000 = ${formatNumber(workingValue)} ${units[workingFromIndex - 1]}`;
			}
			steps.push(step);
			workingFromIndex--;
		}
	}

	explanation.push({
		title: "Step-by-step conversion",
		details: steps,
	});

	return explanation;
};

// Main question generator function
const generateQuestion = (
	setHasSubmitted: (value: boolean) => void,
	setCurrentQuestion: (question: Question | null) => void,
	setUserAnswer: (answer: string) => void,
	setFeedback: (
		feedback: {
			isCorrect: boolean;
			message: string;
			explanation: ExplanationSection[];
		} | null,
	) => void,
	isAdvancedMode: boolean = false,
): void => {
	setHasSubmitted(false);
	let fromUnit: string, toUnit: string;
	const maxSteps = isAdvancedMode ? 3 : 1;

	do {
		fromUnit = units[Math.floor(Math.random() * (units.length - 1))];
		toUnit = units[Math.floor(Math.random() * units.length)];
	} while (
		fromUnit === toUnit ||
		getStepsBetweenUnits(fromUnit, toUnit) > maxSteps
	);

	// Max value for bits and bytes is 300 - simpler maths for students when */ 8
	const ceiling = fromUnit === "bits" || fromUnit === "bytes" ? 300 : 999;

	const stepCount = getStepsBetweenUnits(fromUnit, toUnit);
	const maxValue = Math.max(10, Math.floor(ceiling / stepCount));
	const initValue = Math.floor(Math.random() * maxValue) + 1;

	// Make values easier for mental math
	let finalValue: number;
	if (fromUnit === "bits") {
		// Make sure the value is a multiple of 8 if converting from bits
		finalValue = Math.ceil(initValue / 8) * 8;
	} else if (fromUnit === "bytes" && toUnit === "bits") {
		// For bytes to bits conversion, use friendlier numbers for ×8
		const friendlyByteValues = [
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 24, 25, 30, 32,
			40, 48, 50, 60, 64, 75, 80, 96, 100, 120, 125, 128, 150, 160, 180, 200,
			220, 240, 250, 256,
		];
		finalValue =
			friendlyByteValues[Math.floor(Math.random() * friendlyByteValues.length)];
	} else {
		finalValue = initValue;
	}

	const answer = calculateAnswer(finalValue, fromUnit, toUnit);

	const newQuestion: Question = {
		category: "Converting Units",
		finalValue,
		fromUnit,
		toUnit,
		answer,
		explanation: generateExplanation(finalValue, fromUnit, toUnit),
	};

	setCurrentQuestion(newQuestion);
	setUserAnswer("");
	setFeedback(null);
};

interface UnitConverterProps {
	onScoreUpdate: (isCorrect: boolean, questionType: string) => void;
}

export function UnitConverter({ onScoreUpdate }: UnitConverterProps) {
	const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
	const [userAnswer, setUserAnswer] = useState<string>("");
	const [feedback, setFeedback] = useState<{
		isCorrect: boolean;
		message: string;
		explanation: ExplanationSection[];
	} | null>(null);
	const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
	const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);
	const [showUnitsOrder, setShowUnitsOrder] = useState<boolean>(false);
	const [showConversionPath, setShowConversionPath] = useState<boolean>(false);

	const { handleAnswerChange, handleSubmit, inputRef } = useQuizInteraction(
		currentQuestion,
		userAnswer,
		setUserAnswer,
		hasSubmitted,
		setHasSubmitted,
		setFeedback,
		onScoreUpdate,
	);

	// Generate unique IDs for accessibility
	const converterTitleId = useId();
	const currentQuestionId = useId();
	const answerInputId = useId();
	const calculationHintId = useId();
	const conversionHintId = useId();
	const hintTitleId = useId();
	const conversionHintTitleId = useId();
	const feedbackMessageId = useId();

	useEffect(() => {
		generateQuestion(
			setHasSubmitted,
			setCurrentQuestion,
			setUserAnswer,
			setFeedback,
			isAdvancedMode,
		);
	}, [isAdvancedMode]); // Safe empty dependency - generateQuestion is pure and state setters are stable

	// Global keyboard listener for Enter key when hasSubmitted is true
	// biome-ignore lint/correctness/useExhaustiveDependencies: inputRef.current is stable and doesn't need to be in dependencies
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Enter" && hasSubmitted && currentQuestion) {
				// Don't trigger if focus is in the input (let form submission handle it)
				if (document.activeElement !== inputRef.current) {
					generateQuestion(
						setHasSubmitted,
						setCurrentQuestion,
						setUserAnswer,
						setFeedback,
						isAdvancedMode,
					);
					// Focus management - return focus to input after new question loads
					setTimeout(() => {
						if (inputRef.current) {
							inputRef.current.focus();
						}
					}, 100);
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [hasSubmitted, currentQuestion, isAdvancedMode]);

	const getQuestionText = (question: Question): string => {
		return `Convert ${formatNumber(question.finalValue)} ${question.fromUnit} to ${question.toUnit}`;
	};

	return (
		<main className="w-full" aria-labelledby={converterTitleId}>
			<h1 id={converterTitleId} className="sr-only">
				Unit Converter
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
									{getQuestionText(currentQuestion)}
								</h2>
								<form onSubmit={handleSubmit} className="mt-6">
									<div className="space-y-2">
										<label htmlFor={answerInputId} className="sr-only">
											Your answer for: {getQuestionText(currentQuestion)}
										</label>
										<Input
											id={answerInputId}
											ref={inputRef}
											type="text"
											inputMode="numeric"
											value={
												userAnswer
													? (userAnswer.includes(".") &&
															userAnswer.endsWith(".")) ||
														userAnswer.endsWith("0")
														? userAnswer
														: formatNumber(Number(userAnswer))
													: ""
											}
											onChange={handleAnswerChange}
											placeholder="Enter your answer and press Enter"
											disabled={hasSubmitted}
											aria-describedby={`${calculationHintId} ${conversionHintId}`}
											aria-invalid={
												feedback && !feedback.isCorrect ? "true" : "false"
											}
											className="p-6 text-lg font-bold text-center transition-all duration-200 border-2 border-indigo-200 shadow-lg text-foreground sm:text-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 rounded-xl bg-gradient-to-r from-white to-indigo-50"
										/>
									</div>
								</form>

								{feedback && (
									<div className="mt-6">
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
																	{formatNumber(currentQuestion.answer)}
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
																	setUserAnswer,
																	setFeedback,
																	isAdvancedMode,
																);
																// Focus management - return focus to input after new question loads
																setTimeout(() => {
																	if (inputRef.current) {
																		inputRef.current.focus();
																	}
																}, 100);
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
																		{section.details.map((detail) => (
																			<li
																				key={detail}
																				className="text-hint-card-text"
																			>
																				<span className="mr-2 text-hint-card-border">
																					•
																				</span>
																				{detail}
																			</li>
																		))}
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
									<div className="p-3 border rounded-lg sm:p-4 border-border bg-card">
										<div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
											{/* Units Order Hint */}
											<div className="flex items-center min-w-0 gap-2">
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

											{/* Conversion Path Hint */}
											<div className="flex items-center min-w-0 gap-2">
												<span className="text-base sm:text-lg">🗺️</span>
												<span className="text-xs font-semibold truncate text-foreground sm:text-sm">
													Conversion Path
												</span>
												<Switch
													checked={showConversionPath}
													onCheckedChange={setShowConversionPath}
													className="data-[state=unchecked]:bg-input data-[state=unchecked]:border-2 data-[state=unchecked]:border-input data-[state=checked]:bg-button-primary data-[state=checked]:border-primary flex-shrink-0"
													aria-label="Toggle conversion path hint"
													title="Show/hide the step-by-step conversion path between units"
												/>
											</div>

											{/* Advanced Mode */}
											<div className="flex items-center min-w-0 gap-2">
												<span className="text-base sm:text-lg">⚙️</span>
												<span className="text-xs font-semibold truncate text-foreground sm:text-sm">
													Advanced Mode
												</span>
												<Switch
													checked={isAdvancedMode}
													onCheckedChange={(checked) => {
														setIsAdvancedMode(checked);
														// Generate new question with the new mode
														generateQuestion(
															setHasSubmitted,
															setCurrentQuestion,
															setUserAnswer,
															setFeedback,
															checked,
														);
													}}
													className="data-[state=unchecked]:bg-input data-[state=unchecked]:border-2 data-[state=unchecked]:border-input data-[state=checked]:bg-button-primary data-[state=checked]:border-primary flex-shrink-0"
													aria-label="Toggle advanced mode"
													title="Enable harder questions with decimal values and complex conversions"
												/>
											</div>
										</div>
									</div>
								</div>
								{/* First Hint Section - Units Order */}
								{showUnitsOrder && (
									<section
										id={calculationHintId}
										aria-labelledby={hintTitleId}
										className="mt-6"
									>
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

								{/* Second Hint Section - Conversion Path */}
								{showConversionPath && (
									<section
										id={conversionHintId}
										aria-labelledby={conversionHintTitleId}
										className="mt-6"
									>
										<h3
											id={conversionHintTitleId}
											className="flex items-center mb-3 font-semibold text-hint-summary-text"
										>
											<span className="mr-2 text-lg">🗺️</span>
											Path for this conversion
										</h3>
										<div className="border-l-4 rounded-r-lg shadow-inner border-hint-card-border bg-hint-content-bg">
											<ConversionPathVisual
												fromUnit={currentQuestion.fromUnit}
												toUnit={currentQuestion.toUnit}
											/>
										</div>
									</section>
								)}
							</section>
						) : (
							<div className="py-8 text-center">
								<p className="text-muted-foreground">
									Unable to load question. Please reload the page or contact
									admin if the issue persists.
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
