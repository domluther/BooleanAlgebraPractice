import { useEffect, useId, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type ExplanationSection, formatNumber } from "@/lib/numberUtils";
import { useQuizInteraction } from "@/lib/quizHooks";

interface BaseQuestion {
	category: "Capacity Calculator";
	answer: number;
	explanation: ExplanationSection[];
}

interface FileCountQuestion extends BaseQuestion {
	type: "fileCount";
	params: {
		driveSize: number;
		driveUnit: string;
		fileSize: number;
		fileUnit: string;
	};
}

interface CapacityQuestion extends BaseQuestion {
	type: "capacity";
	params: {
		driveUnit: string;
		fileSize: number;
		fileUnit: string;
		fileCount: number;
	};
}

type Question = FileCountQuestion | CapacityQuestion;

// Convert value from one unit to another
const convertValue = (
	value: number,
	fromUnit: string,
	toUnit: string,
): number => {
	const unitValues: { [key: string]: number } = {
		bytes: 0,
		kilobytes: 1,
		megabytes: 2,
		gigabytes: 3,
		terabytes: 4,
	};

	const difference = unitValues[fromUnit] - unitValues[toUnit];
	return value * 1000 ** difference;
};

// Helper function to get simple file sizes
const getSimpleFileSize = (): { size: number; unit: string } => {
	const simpleSizes = [
		{ size: 1, unit: "megabytes" },
		{ size: 2, unit: "megabytes" },
		{ size: 2.5, unit: "megabytes" },
		{ size: 5, unit: "megabytes" },
		{ size: 10, unit: "megabytes" },
		{ size: 20, unit: "megabytes" },
		{ size: 25, unit: "megabytes" },
		{ size: 50, unit: "megabytes" },
		{ size: 100, unit: "megabytes" },
		{ size: 200, unit: "megabytes" },
		{ size: 250, unit: "megabytes" },
		{ size: 500, unit: "megabytes" },
	];
	return simpleSizes[Math.floor(Math.random() * simpleSizes.length)];
};

// Helper function to get simple drive sizes
const getSimpleDriveSize = (): { size: number; unit: string } => {
	const simpleSizes = [
		{ size: 500, unit: "megabytes" },
		{ size: 1, unit: "gigabytes" },
		{ size: 2, unit: "gigabytes" },
		{ size: 4, unit: "gigabytes" },
		{ size: 5, unit: "gigabytes" },
		{ size: 10, unit: "gigabytes" },
		{ size: 20, unit: "gigabytes" },
		{ size: 50, unit: "gigabytes" },
		{ size: 100, unit: "gigabytes" },
	];
	return simpleSizes[Math.floor(Math.random() * simpleSizes.length)];
};

// Helper function to get the correct unit form (singular/plural)
const getUnitText = (value: number, unit: string): string => {
	if (value === 1) {
		return unit.replace(/s$/, ""); // Remove 's' for singular
	}
	return unit; // Keep plural form
};

// Helper function to get unit in singular form for use as adjectives (e.g., "5 megabyte files")
const getAdjectiveUnitText = (unit: string): string => {
	return unit.replace(/s$/, ""); // Always singular when used as adjective
};

const generateExplanation = (
	question: Question,
): { title: string; details: string[] }[] => {
	const steps: { title: string; details: string[] }[] = [];

	if (question.type === "capacity") {
		const totalInFileUnits =
			question.params.fileSize * question.params.fileCount;
		const finalValue = convertValue(
			totalInFileUnits,
			question.params.fileUnit,
			question.params.driveUnit,
		);

		steps.push({
			title: "Calculate the total size of all files",
			details: [
				`${formatNumber(question.params.fileCount)} files × ${formatNumber(question.params.fileSize)} ${getUnitText(question.params.fileSize, question.params.fileUnit)} = ${formatNumber(totalInFileUnits)} ${getUnitText(totalInFileUnits, question.params.fileUnit)}`,
			],
		});

		if (question.params.fileUnit !== question.params.driveUnit) {
			steps.push({
				title: `Convert to ${question.params.driveUnit}`,
				details: [
					`${formatNumber(totalInFileUnits)} ${getUnitText(totalInFileUnits, question.params.fileUnit)} = ${formatNumber(finalValue)} ${getUnitText(finalValue, question.params.driveUnit)}`,
				],
			});
		}
	} else {
		const driveInFileUnits = convertValue(
			question.params.driveSize,
			question.params.driveUnit,
			question.params.fileUnit,
		);

		steps.push({
			title: `Convert drive size to ${question.params.fileUnit}`,
			details: [
				`${question.params.driveSize} ${getUnitText(question.params.driveSize, question.params.driveUnit)} = ${formatNumber(driveInFileUnits)} ${getUnitText(driveInFileUnits, question.params.fileUnit)}`,
			],
		});

		steps.push({
			title: "Divide by file size to get number of files",
			details: [
				`${formatNumber(driveInFileUnits)} ${getUnitText(driveInFileUnits, question.params.fileUnit)} ÷ ${question.params.fileSize} ${getUnitText(question.params.fileSize, question.params.fileUnit)} = ${formatNumber(question.answer)} files`,
			],
		});
	}

	return steps;
};

const generateFileCountQuestion = (): FileCountQuestion => {
	// Generate "How many files can fit" question
	const drive = getSimpleDriveSize();
	const file = getSimpleFileSize();
	const driveInFileUnits = convertValue(drive.size, drive.unit, file.unit);
	const answer = Math.floor(driveInFileUnits / file.size);

	const params = {
		driveSize: drive.size,
		driveUnit: drive.unit,
		fileSize: file.size,
		fileUnit: file.unit,
	};

	const question: FileCountQuestion = {
		category: "Capacity Calculator",
		type: "fileCount",
		params,
		answer,
		explanation: [],
	};

	question.explanation = generateExplanation(question);
	return question;
};

const generateCapacityQuestion = (): CapacityQuestion => {
	// Generate "Total size of files" question
	const file = getSimpleFileSize();
	const fileCount = Math.floor(Math.random() * 8 + 2) * 5; // Will generate 10, 15, 20, 25, 30, 35, 40, or 45
	const targetUnit = Math.random() > 0.5 ? "gigabytes" : file.unit;
	const totalInFileUnits = fileCount * file.size;
	const answer = convertValue(totalInFileUnits, file.unit, targetUnit);

	const params = {
		fileCount,
		driveUnit: targetUnit,
		fileSize: file.size,
		fileUnit: file.unit,
	};

	const question: CapacityQuestion = {
		category: "Capacity Calculator",
		type: "capacity",
		params,
		answer,
		explanation: [],
	};

	question.explanation = generateExplanation(question);
	return question;
};

// Main question generator function - also moved outside since it's pure
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
): void => {
	setHasSubmitted(false);
	const questionTypes = [generateFileCountQuestion, generateCapacityQuestion];
	const newQuestion =
		questionTypes[Math.floor(Math.random() * questionTypes.length)]();
	setCurrentQuestion(newQuestion);
	setUserAnswer("");
	setFeedback(null);
};

interface CapacityCalculatorProps {
	onScoreUpdate: (isCorrect: boolean, questionType: string) => void;
}

export function CapacityCalculator({ onScoreUpdate }: CapacityCalculatorProps) {
	const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
	const [userAnswer, setUserAnswer] = useState<string>("");
	const [feedback, setFeedback] = useState<{
		isCorrect: boolean;
		message: string;
		explanation: ExplanationSection[];
	} | null>(null);
	const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

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
	const calculatorTitleId = useId();
	const currentQuestionId = useId();
	const answerInputId = useId();
	const feedbackMessageId = useId();
	const welcomeMessageId = useId();

	useEffect(() => {
		generateQuestion(
			setHasSubmitted,
			setCurrentQuestion,
			setUserAnswer,
			setFeedback,
		);
	}, []); // Safe empty dependency - generateQuestion is pure and state setters are stable

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
	}, [hasSubmitted, currentQuestion]);

	// Uses the adjective form of the unit for the question text
	const getQuestionText = (question: Question): string => {
		if (question.type === "fileCount") {
			const driveUnitText = getAdjectiveUnitText(question.params.driveUnit);
			const fileUnitText = getAdjectiveUnitText(question.params.fileUnit);

			return `A user has a ${question.params.driveSize}-${driveUnitText} drive. How many ${question.params.fileSize}-${fileUnitText} files can they store on it?`;
		} else {
			const fileSizeText = getUnitText(
				question.params.fileSize,
				question.params.fileUnit,
			);

			return `A user has ${question.params.fileCount} files that are each ${question.params.fileSize} ${fileSizeText}. What is the total size in ${question.params.driveUnit}?`;
		}
	};

	return (
		<main className="w-full" aria-labelledby={calculatorTitleId}>
			<h1 id={calculatorTitleId} className="sr-only">
				Capacity Calculator
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
											aria-invalid={
												feedback && !feedback.isCorrect ? "true" : "false"
											}
											className="p-6 text-lg font-bold text-center transition-all duration-200 border-2 shadow-lg border-checkbox-label-border text-foreground sm:text-2xl focus:border-checkbox-label-border-hover focus:ring-4 focus:ring-checkbox-label-border rounded-xl bg-card"
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
													: "bg-feedback-error-bg border-feedback-error-bg"
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
																	className="p-4 border rounded-lg bg-hint-card-bg border-hint-card-border"
																>
																	<h4 className="flex items-center mb-2 text-base font-bold text-hint-card-title">
																		<span className="flex items-center justify-center flex-shrink-0 w-6 h-6 mr-3 text-sm font-semibold rounded-full text-hint-card-title bg-hint-card-bg">
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
																				<span className="mr-2 text-hint-card-title">
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
							</section>
						) : (
							<section
								className="py-12 text-center"
								aria-labelledby={welcomeMessageId}
							>
								<div className="p-8 border shadow-lg border-hint-card-border bg-hint-content-bg rounded-xl">
									<div className="mb-4 text-6xl">💾</div>
									<h2
										id={welcomeMessageId}
										className="mb-4 text-2xl font-bold text-hint-card-title md:text-3xl"
									>
										Capacity Calculator
									</h2>
									<p className="max-w-md mx-auto mb-6 text-lg text-hint-card-text">
										Practice calculating storage capacity and file counts.
										Master digital storage concepts!
									</p>
									<button
										type="button"
										onClick={() => {
											generateQuestion(
												setHasSubmitted,
												setCurrentQuestion,
												setUserAnswer,
												setFeedback,
											);
										}}
										className="px-8 py-3 font-semibold transition-all duration-200 transform rounded-lg shadow-lg text-action-button-text bg-action-button-bg hover:bg-action-button-bg-hover hover:shadow-xl hover:-translate-y-1"
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
