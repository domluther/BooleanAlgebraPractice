import { useCallback, useEffect, useRef, useState } from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { Button } from "@/components/ui/button";
import { CircuitGenerator } from "@/lib/CircuitGenerator";
import { useTheme } from "@/contexts/theme-provider";
import {
	convertToNotation,
	getNotationType,
	type NotationType,
	setNotationType,
} from "@/lib/config";
import { useNameThat } from "@/lib/useNameThat";

/**
 * NameThat Component - Logic Gate Identification Game
 *
 * Level 1: Identify single GCSE logic gates (AND, OR, NOT) or invalid gates (NONE)
 * Level 2: Identify two-gate combinations (future)
 * Level 3: Identify circuits from truth tables (future)
 */

interface NameThatProps {
	/** Callback to record score with ScoreManager */
	onScoreUpdate?: (isCorrect: boolean, questionType: string) => void;
}

export function NameThat({ onScoreUpdate }: NameThatProps) {
	const {
		currentLevel,
		currentQuestion,
		isAnswered,
		isCorrect,
		feedbackMessage,
		questionTitle,
		checkAnswer,
		generateNewQuestion,
		setLevel,
	} = useNameThat({ onScoreUpdate });

	const { theme } = useTheme();
	const circuitRef = useRef<HTMLDivElement>(null);
	const circuitGeneratorRef = useRef<CircuitGenerator>(new CircuitGenerator());
	const [notationType, setNotationTypeState] = useState<NotationType>(
		getNotationType(),
	);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

	// Render circuit when question changes
	useEffect(() => {
		if (!circuitRef.current) return;

		// Always clear previous content first
		circuitRef.current.innerHTML = "";

		if (currentLevel === 3) {
			// Level 3: Display truth table HTML
			if (currentQuestion.truthTableHTML) {
				circuitRef.current.innerHTML = currentQuestion.truthTableHTML;
			} else {
				circuitRef.current.innerHTML =
					'<p class="text-destructive">Error: No truth table data</p>';
			}
		} else if (currentQuestion.expression !== "INVALID_GATE") {
			// Level 1 & 2: Display circuit
			// Generate new circuit
			try {
				const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
				circuitGeneratorRef.current.generateCircuit(
					currentQuestion.expression,
					circuitRef.current,
					isDarkMode,
				);
			} catch (error) {
				console.error("Error generating circuit:", error);
				circuitRef.current.innerHTML =
					'<p class="text-destructive">Error rendering circuit</p>';
			}
		} else if (currentQuestion.invalidGate) {
			// Level 1 NONE option: Render invalid gate SVG
			const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
			const color = isDarkMode ? "#e5e5e5" : "#333";
			const svg = currentQuestion.invalidGate.getSvg(color);
			circuitRef.current.innerHTML = `<svg width="200" height="120" viewBox="0 0 200 120">${svg}</svg>`;
		}

		// Cleanup function to clear content when component unmounts or before next render
		return () => {
			if (circuitRef.current) {
				circuitRef.current.innerHTML = "";
			}
		};
	}, [currentQuestion, currentLevel, theme]);

	const handleAnswerClick = useCallback(
		(answer: string) => {
			if (!isAnswered) {
				setSelectedAnswer(answer);
				checkAnswer(answer);
			}
		},
		[isAnswered, checkAnswer],
	);

	const handleNotationToggle = (checked: boolean) => {
		const newNotation: NotationType = checked ? "symbol" : "word";
		setNotationTypeState(newNotation);
		setNotationType(newNotation);
	};

	const handleKeyPress = (
		event: React.KeyboardEvent,
		answer: string,
		index: number,
	) => {
		// Support keyboard shortcuts 1-4
		if (event.key === (index + 1).toString()) {
			handleAnswerClick(answer);
		}
	};

	// Reset selected answer when starting new question
	useEffect(() => {
		if (!isAnswered) {
			setSelectedAnswer(null);
		}
	}, [isAnswered]);

	// Global keyboard shortcuts
	useEffect(() => {
		const handleGlobalKeyPress = (event: KeyboardEvent) => {
			// Handle Enter key for next question when answered
			if (event.key === "Enter" && isAnswered) {
				generateNewQuestion();
				return;
			}

			// Handle number keys 1-4 for answer selection
			if (isAnswered) return;

			const key = event.key;
			if (key >= "1" && key <= "4") {
				const index = parseInt(key, 10) - 1;
				if (index < currentQuestion.options.length) {
					handleAnswerClick(currentQuestion.options[index]);
				}
			}
		};
		window.addEventListener("keydown", handleGlobalKeyPress);
		return () => window.removeEventListener("keydown", handleGlobalKeyPress);
	}, [
		isAnswered,
		currentQuestion.options,
		generateNewQuestion,
		handleAnswerClick,
	]);
	return (
		<div className="flex flex-col gap-4">
			{/* Control Panel */}
			<ControlPanel
				difficulty={{
					value: currentLevel,
					onChange: (level) => setLevel(level as 1 | 2 | 3),
					options: [
						[1, "Easy"],
						[2, "Medium"],
						[3, "Hard"],
					],
				}}
				notation={{
					value: notationType,
					onChange: handleNotationToggle,
				}}
				onShuffle={generateNewQuestion}
			/>

			{/* Question Title */}
			<div className="text-center">
				<h2 className="text-xl font-semibold sm:text-2xl">{questionTitle}</h2>
			</div>
			{/* Circuit/Truth Table Display */}
			<div className="border-2 rounded-lg bg-card">
				<div className="flex items-center justify-center rounded-lg bg-stats-card-bg min-h-[150px]">
					<div
						ref={circuitRef}
						className={
							currentLevel === 3 ? "truth-table-display" : "circuit-display"
						}
						style={{ minHeight: "120px" }}
					/>
				</div>
			</div>
			{/* Answer Options */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{currentQuestion.options.map((option, index) => {
					const displayOption = convertToNotation(option, notationType);
					const isCorrectAnswer = option === currentQuestion.correctAnswer;
					const isSelectedWrongAnswer =
						isAnswered && !isCorrect && option === selectedAnswer;

					let className =
						"h-auto py-4 text-base sm:text-lg relative transition-all";

					if (isAnswered) {
						if (isCorrectAnswer) {
							className +=
								" bg-stats-streak hover:bg-stats-streak text-white border-stats-streak";
						} else if (isSelectedWrongAnswer) {
							className +=
								" bg-stats-accuracy-low hover:bg-stats-accuracy-low text-white border-stats-accuracy-low";
						} else {
							className += " opacity-50";
						}
					}

					return (
						<Button
							key={option}
							variant={isAnswered && isCorrectAnswer ? "default" : "outline"}
							className={className}
							onClick={() => handleAnswerClick(option)}
							onKeyDown={(e) => handleKeyPress(e, option, index)}
							disabled={isAnswered}
						>
							<span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-xs font-bold bg-stats-card-bg text-stats-label px-1.5 py-0.5 rounded border border-checkbox-label-border">
								{index + 1}
							</span>
							<span className="pl-4">{displayOption}</span>
						</Button>
					);
				})}
			</div>
			{/* Feedback Message */}
			{isAnswered && feedbackMessage && (
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
				<Button
					onClick={generateNewQuestion}
					size="lg"
					className="w-full text-lg bg-action-button-bg hover:bg-action-button-bg-hover text-action-button-text"
				>
					Next Question →
				</Button>
			)}
			{/* Keyboard Shortcuts Help */}
			<div className="py-2 text-sm text-center text-stats-label font-medium">
				💡 Use keys 1-4 for quick answers
				{isAnswered && " • Press Enter for next question"}
			</div>
		</div>
	);
}
