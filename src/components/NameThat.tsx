import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CircuitGenerator } from "@/lib/CircuitGenerator";
import { useNameThat } from "@/lib/useNameThat";
import {
	convertToNotation,
	getNotationType,
	setNotationType,
	type NotationType,
} from "@/lib/config";

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

	const circuitRef = useRef<HTMLDivElement>(null);
	const circuitGeneratorRef = useRef<CircuitGenerator>(new CircuitGenerator());
	const [notationType, setNotationTypeState] = useState<NotationType>(
		getNotationType(),
	);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

	// Render circuit when question changes
	useEffect(() => {
		if (circuitRef.current && currentQuestion.expression !== "INVALID_GATE") {
			// Clear previous circuit
			circuitRef.current.innerHTML = "";

			// Generate new circuit
			try {
				circuitGeneratorRef.current.generateCircuit(
					currentQuestion.expression,
					circuitRef.current,
				);
			} catch (error) {
				console.error("Error generating circuit:", error);
				circuitRef.current.innerHTML =
					'<p class="text-destructive">Error rendering circuit</p>';
			}
		} else if (circuitRef.current && currentQuestion.invalidGateSVG) {
			// Render invalid gate SVG
			circuitRef.current.innerHTML = currentQuestion.invalidGateSVG;
		}
	}, [currentQuestion]);

	const handleAnswerClick = (answer: string) => {
		if (!isAnswered) {
			setSelectedAnswer(answer);
			checkAnswer(answer);
		}
	};

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

	// Reset selected answer when generating new question
	useEffect(() => {
		setSelectedAnswer(null);
	}, [currentQuestion]);

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
				const index = parseInt(key) - 1;
				if (index < currentQuestion.options.length) {
					handleAnswerClick(currentQuestion.options[index]);
				}
			}
		};

		window.addEventListener("keydown", handleGlobalKeyPress);
		return () => window.removeEventListener("keydown", handleGlobalKeyPress);
	}, [isAnswered, currentQuestion.options, generateNewQuestion]);

	return (
		<div className="flex flex-col gap-4">
			{/* Control Panel */}
			<div className="p-4 rounded-lg border-2 bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					{/* Difficulty Selector */}
					<div className="flex items-center gap-3">
						<label
							htmlFor="difficulty-select"
							className="font-medium text-sm whitespace-nowrap text-blue-900 dark:text-blue-100"
						>
							Difficulty:
						</label>
						<select
							id="difficulty-select"
							value={currentLevel}
							onChange={(e) => setLevel(Number(e.target.value) as 1 | 2 | 3)}
							className="px-3 py-1.5 rounded-md border-2 bg-background border-blue-300 dark:border-blue-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value={1}>Easy</option>
							<option value={2}>Medium</option>
							<option value={3}>Hard</option>
						</select>
					</div>

					{/* Notation Toggle */}
					<div className="flex items-center gap-3">
						<span className="text-sm font-medium text-blue-900 dark:text-blue-100">
							Words
						</span>
						<Switch
							checked={notationType === "symbol"}
							onCheckedChange={handleNotationToggle}
							aria-label="Toggle between word and symbol notation"
							className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-blue-200 dark:data-[state=unchecked]:bg-blue-900"
						/>
						<span className="text-sm font-medium text-blue-900 dark:text-blue-100">
							Symbols
						</span>
					</div>

					{/* Regenerate Button */}
					<Button
						variant="outline"
						size="sm"
						onClick={generateNewQuestion}
						title="Generate a new question"
						className="text-xl px-3 border-2 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:border-blue-400 dark:hover:border-blue-600"
					>
						🎲
					</Button>
				</div>
			</div>

			{/* Question Title */}
			<div className="text-center">
				<h2 className="text-xl font-semibold sm:text-2xl">{questionTitle}</h2>
			</div>

			{/* Circuit Display */}
			<div className="p-4 border-2 rounded-lg bg-card border-blue-200 dark:border-blue-800 sm:p-6">
				<div className="flex items-center justify-center p-6 rounded-lg bg-blue-50/30 dark:bg-blue-950/20 min-h-[150px]">
					<div
						ref={circuitRef}
						className="circuit-display"
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
								" bg-green-600 hover:bg-green-600 text-white border-green-700";
						} else if (isSelectedWrongAnswer) {
							className +=
								" bg-red-600 hover:bg-red-600 text-white border-red-700";
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
							<span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded border border-blue-300 dark:border-blue-700">
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
							? "bg-green-50 text-green-900 border-green-500 dark:bg-green-950 dark:text-green-100 dark:border-green-700"
							: "bg-red-50 text-red-900 border-red-500 dark:bg-red-950 dark:text-red-100 dark:border-red-700"
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
					className="w-full text-lg bg-blue-600 hover:bg-blue-700 text-white"
				>
					Next Question →
				</Button>
			)}

			{/* Keyboard Shortcuts Help */}
			<div className="py-2 text-sm text-center text-blue-600 dark:text-blue-400 font-medium">
				💡 Use keys 1-4 for quick answers
				{isAnswered && " • Press Enter for next question"}
			</div>
		</div>
	);
}
