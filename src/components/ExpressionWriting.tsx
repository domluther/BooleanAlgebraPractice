import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CircuitGenerator } from "@/lib/CircuitGenerator";
import {
	getNotationType,
	type NotationType,
	setNotationType,
} from "@/lib/config";
import { useExpressionWriting } from "@/lib/useExpressionWriting";

/**
 * ExpressionWriting Component - Boolean Expression Writing Game
 *
 * Displays a circuit diagram and asks the user to write the Boolean expression.
 * Supports 5 difficulty levels: Easy, Medium, Hard, Expert, A-Level
 */

interface ExpressionWritingProps {
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

const SYMBOL_BUTTONS = [
	{ word: "AND", symbol: "∧", shortcut: "^" },
	{ word: "OR", symbol: "∨", shortcut: "v" },
	{ word: "NOT", symbol: "¬", shortcut: "!" },
	{ word: "XOR", symbol: "⊻", shortcut: "" },
];

export function ExpressionWriting({ onScoreUpdate }: ExpressionWritingProps) {
	const difficultySelectId = useId();
	const expressionInputId = useId();

	const {
		currentLevel,
		currentQuestion,
		userAnswer,
		isAnswered,
		isCorrect,
		feedbackMessage,
		setUserAnswer,
		checkAnswer,
		generateNewQuestion,
		setLevel,
	} = useExpressionWriting({ onScoreUpdate });

	const circuitRef = useRef<HTMLDivElement>(null);
	const circuitGeneratorRef = useRef<CircuitGenerator>(new CircuitGenerator());
	const inputRef = useRef<HTMLInputElement>(null);
	const [notationType, setNotationTypeState] = useState<NotationType>(
		getNotationType(),
	);
	const justAnsweredRef = useRef(false);

	// Render circuit when question changes
	useEffect(() => {
		if (circuitRef.current) {
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
		}

		// Focus input on new question
		if (inputRef.current && !isAnswered) {
			inputRef.current.focus();
		}
	}, [currentQuestion, isAnswered]);

	// Global keyboard handler for Enter key
	useEffect(() => {
		const handleGlobalKeyPress = (event: KeyboardEvent) => {
			// Only handle Enter for next question if answered and not just answered
			if (event.key === "Enter" && isAnswered && !justAnsweredRef.current) {
				generateNewQuestion();
			}
		};

		window.addEventListener("keydown", handleGlobalKeyPress);
		return () => window.removeEventListener("keydown", handleGlobalKeyPress);
	}, [isAnswered, generateNewQuestion]);

	// Reset the justAnswered flag after a short delay when isAnswered changes
	useEffect(() => {
		if (isAnswered) {
			justAnsweredRef.current = true;
			const timer = setTimeout(() => {
				justAnsweredRef.current = false;
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [isAnswered]);

	const handleNotationToggle = (checked: boolean) => {
		const newNotation: NotationType = checked ? "symbol" : "word";
		setNotationTypeState(newNotation);
		setNotationType(newNotation);
	};

	const handleSubmit = () => {
		if (!isAnswered && userAnswer.trim()) {
			checkAnswer(notationType);
		}
	};

	const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter" && !isAnswered && userAnswer.trim()) {
			event.preventDefault();
			handleSubmit();
		}
	};

	const insertSymbol = (text: string) => {
		if (inputRef.current) {
			const input = inputRef.current;
			const cursorPos = input.selectionStart || 0;
			const currentValue = userAnswer;
			const newValue =
				currentValue.slice(0, cursorPos) +
				" " +
				text +
				" " +
				currentValue.slice(cursorPos);

			setUserAnswer(newValue);

			// Move cursor after the inserted symbol
			setTimeout(() => {
				const newCursorPos = cursorPos + text.length + 2;
				input.setSelectionRange(newCursorPos, newCursorPos);
				input.focus();
			}, 0);
		}
	};

	const getPlaceholder = () => {
		if (notationType === "symbol") {
			return "Enter expression (e.g., Q = A ∨ B)";
		}
		return "Enter expression (e.g., Q = A OR B)";
	};

	return (
		<div className="flex flex-col gap-4">
			{/* Control Panel */}
			<div className="p-4 rounded-lg border-2 bg-stats-card-bg border-stats-card-border">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					{/* Difficulty Selector */}
					<div className="flex items-center gap-3">
						<label
							htmlFor={difficultySelectId}
							className="font-medium text-sm whitespace-nowrap text-stats-label"
						>
							Difficulty:
						</label>
						<select
							id={difficultySelectId}
							value={currentLevel}
							onChange={(e) =>
								setLevel(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
							}
							className="px-3 py-1.5 rounded-md border-2 bg-background border-checkbox-label-border hover:border-checkbox-label-border-hover text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:border-checkbox-label-border-hover"
						>
							{Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</select>
					</div>

					{/* Notation Toggle */}
					<div className="flex items-center gap-3">
						<span className="text-sm font-medium text-stats-label">Words</span>
						<Switch
							checked={notationType === "symbol"}
							onCheckedChange={handleNotationToggle}
							aria-label="Toggle between word and symbol notation"
							className="data-[state=checked]:bg-stats-points data-[state=unchecked]:bg-checkbox-label-border"
						/>
						<span className="text-sm font-medium text-stats-label">
							Symbols
						</span>
					</div>

					{/* Regenerate Button */}
					<Button
						variant="outline"
						size="sm"
						onClick={generateNewQuestion}
						title="Generate a new question"
						className="text-xl px-3 border-2 border-checkbox-label-border hover:bg-checkbox-label-bg-hover hover:border-checkbox-label-border-hover"
					>
						🎲
					</Button>
				</div>
			</div>

			{/* Question Title */}
			<div className="text-center">
				<h2 className="text-xl font-semibold sm:text-2xl">
					Write the expression for this circuit
				</h2>
			</div>

			{/* Circuit Display */}
			<div className="border-2 rounded-lg bg-card border-stats-card-border">
				<div className="flex items-center justify-center rounded-lg bg-stats-card-bg min-h-[150px]">
					<div
						ref={circuitRef}
						className="circuit-display"
						style={{ minHeight: "120px" }}
					/>
				</div>
			</div>

			{/* Symbol Helper Buttons - Only in Symbol Mode */}
			{notationType === "symbol" && (
				<>
					<div className="flex flex-wrap gap-2 justify-center">
						{SYMBOL_BUTTONS.filter(
							(btn) => btn.word !== "XOR" || currentLevel === 5,
						).map((btn) => (
							<Button
								key={btn.word}
								variant="outline"
								size="sm"
								onClick={() => insertSymbol(btn.symbol)}
								disabled={isAnswered}
								className="border-2 border-checkbox-label-border hover:bg-checkbox-label-bg-hover hover:border-checkbox-label-border-hover px-4"
								title={
									btn.shortcut
										? `${btn.word} (${btn.symbol}) - Press ${btn.shortcut}`
										: `${btn.word} (${btn.symbol})`
								}
							>
								<span className="font-bold text-lg">{btn.symbol}</span>
							</Button>
						))}
					</div>
					<div className="text-center text-sm text-stats-label">
						Keyboard: ^ (AND), v (OR), ! (NOT)
					</div>
				</>
			)}

			{/* Input Field */}
			<div className="max-w-2xl mx-auto w-full space-y-3">
				<Input
					ref={inputRef}
					id={expressionInputId}
					type="text"
					value={userAnswer}
					onChange={(e) => setUserAnswer(e.target.value)}
					onKeyDown={handleKeyPress}
					placeholder={getPlaceholder()}
					disabled={isAnswered}
					className="!text-xl py-6 border-2 border-checkbox-label-border hover:border-checkbox-label-border-hover focus-visible:ring-ring focus-visible:border-checkbox-label-border-hover text-center"
				/>
			</div>

			{/* Submit Button */}
			{!isAnswered && (
				<div className="max-w-md mx-auto w-full">
					<Button
						onClick={handleSubmit}
						disabled={!userAnswer.trim()}
						size="lg"
						className="w-full text-lg py-6 bg-action-button-bg hover:bg-action-button-bg-hover text-action-button-text"
					>
						Mark My Answer
					</Button>
				</div>
			)}

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
		</div>
	);
}
