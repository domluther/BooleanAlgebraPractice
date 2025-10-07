import { useState, useCallback } from 'react'

/**
 * useNameThat - React hook for NameThat game mode
 * 
 * Manages game state for identifying logic gates and circuits.
 * 
 * Levels:
 * - Level 1: Single GCSE logic gates (AND, OR, NOT) or invalid gates (NONE)
 * - Level 2: Two-gate combinations from level2NoOverlap dataset (future)
 * - Level 3: Truth table identification (future)
 */

type GateType = 'AND' | 'OR' | 'NOT' | 'NONE'

interface InvalidGate {
	svg: string
	reason: string
}

interface Question {
	expression: string
	correctAnswer: string
	options: string[]
	invalidGateSVG?: string
	reason?: string
}

interface UseNameThatReturn {
	currentLevel: number
	currentQuestion: Question
	isAnswered: boolean
	isCorrect: boolean | null
	feedbackMessage: string
	questionTitle: string
	checkAnswer: (answer: string) => void
	generateNewQuestion: () => void
	reset: () => void
	setLevel: (level: number) => void
}

interface UseNameThatOptions {
	/**
	 * Optional callback to record score externally (e.g., with ScoreManager)
	 * Called with (isCorrect, questionType) when an answer is checked
	 */
	onScoreUpdate?: (isCorrect: boolean, questionType: string) => void
}

/**
 * Invalid gate configurations for Level 1 NONE option
 * These are non-GCSE gates that students should identify as invalid
 */
const INVALID_GATES: InvalidGate[] = [
	{
		svg: `<circle cx="65" cy="60" r="5" fill="none" stroke="#333" stroke-width="2"/>
		<path d="M 71 30 L 71 90 L 120 60 Z" fill="none" stroke="#333" stroke-width="2"/>
		<line x1="30" y1="60" x2="60" y2="60" stroke="#333" stroke-width="2"/>
		<line x1="120" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
		<text x="5" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text>
		<text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`,
		reason: 'The bubble is on the wrong side of this NOT gate. It should be at the output.'
	},
	{
		svg: `<path d="M 86 35 A 25 25 0 0 0 86 85 L 113 85 L 113 35 Z" fill="none" stroke="#333" stroke-width="2"/>
		<line x1="30" y1="50" x2="63" y2="50" stroke="#333" stroke-width="2"/>
		<line x1="30" y1="70" x2="63" y2="70" stroke="#333" stroke-width="2"/>
		<line x1="113" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
		<text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text>
		<text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">B</text>
		<text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`,
		reason: 'It is a backwards AND gate. The curved side should be on the right.'
	},
	{
		svg: `<path d="M 60 35 L 60 85 L 90 85 A 25 25 0 0 0 90 35 Z" fill="none" stroke="#333" stroke-width="2"/>
		<circle cx="120" cy="60" r="5" fill="none" stroke="#333" stroke-width="2"/>
		<line x1="30" y1="50" x2="60" y2="50" stroke="#333" stroke-width="2"/>
		<line x1="30" y1="70" x2="60" y2="70" stroke="#333" stroke-width="2"/>
		<line x1="125" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
		<text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text>
		<text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">B</text>
		<text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`,
		reason: 'The bubble makes it a NAND gate - an AND followed by a NOT.'
	},
	{
		svg: `<path d="M 55 35 Q 70 60 55 85" fill="none" stroke="#333" stroke-width="2"/>
		<path d="M 60 35 Q 85 35 115 60 Q 85 85 60 85 Q 75 60 60 35" fill="none" stroke="#333" stroke-width="2"/>
		<line x1="30" y1="50" x2="65" y2="50" stroke="#333" stroke-width="2"/>
		<line x1="30" y1="70" x2="65" y2="70" stroke="#333" stroke-width="2"/>
		<line x1="115" y1="60" x2="150" y2="60" stroke="#333" stroke-width="2"/>
		<text x="5" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="#333">A</text>
		<text x="5" y="75" font-family="Arial" font-size="16" font-weight="bold" fill="#333">B</text>
		<text x="165" y="65" font-family="Arial" font-size="16" font-weight="bold" fill="#333">Q</text>`,
		reason: 'The extra curved line makes it an XOR gate, used at A-Level.'
	}
]

/**
 * Get expression string for a given gate type
 */
function getGateExpression(gate: GateType): string {
	switch (gate) {
		case 'AND':
			return 'Q = A AND B'
		case 'OR':
			return 'Q = A OR B'
		case 'NOT':
			return 'Q = NOT A'
		case 'NONE':
			return 'INVALID_GATE'
	}
}

/**
 * Select a random invalid gate configuration
 */
function getRandomInvalidGate(): InvalidGate {
	return INVALID_GATES[Math.floor(Math.random() * INVALID_GATES.length)]
}

/**
 * Generate a random Level 1 gate type
 * Distribution: AND, OR, NOT appear once each, NONE appears twice for balance
 */
function generateRandomGateType(): GateType {
	const gates: GateType[] = ['AND', 'OR', 'NOT', 'NONE', 'NONE']
	return gates[Math.floor(Math.random() * gates.length)]
}

/**
 * Generate a Level 1 question
 */
function generateLevel1Question(): Question {
	const gateType = generateRandomGateType()
	const options = ['AND', 'OR', 'NOT', 'NONE']

	if (gateType === 'NONE') {
		const invalidGate = getRandomInvalidGate()
		return {
			expression: getGateExpression(gateType),
			correctAnswer: gateType,
			options,
			invalidGateSVG: `<svg width="200" height="120" viewBox="0 0 200 120">${invalidGate.svg}</svg>`,
			reason: invalidGate.reason
		}
	}

	return {
		expression: getGateExpression(gateType),
		correctAnswer: gateType,
		options
	}
}

/**
 * Get question title for current level
 */
function getQuestionTitle(level: number): string {
	switch (level) {
		case 1:
			return 'Name that GCSE logic gate'
		case 2:
			return 'Name that logic diagram'
		case 3:
			return 'Name that truth table'
		default:
			return 'Name that GCSE logic gate'
	}
}

/**
 * Custom hook for NameThat game logic
 */
export function useNameThat(options?: UseNameThatOptions): UseNameThatReturn {
	const [currentLevel, setCurrentLevel] = useState(1)
	const [currentQuestion, setCurrentQuestion] = useState<Question>(() => generateLevel1Question())
	const [isAnswered, setIsAnswered] = useState(false)
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
	const [feedbackMessage, setFeedbackMessage] = useState('')

	const questionTitle = getQuestionTitle(currentLevel)

	/**
	 * Get the question type for score tracking
	 * Using "Name That" to match legacy format (not level-specific)
	 */
	const getQuestionType = useCallback(() => {
		return 'Name That'
	}, [])

	/**
	 * Check if the user's answer is correct
	 */
	const checkAnswer = useCallback(
		(answer: string) => {
			// Prevent answering twice
			if (isAnswered) return

			setIsAnswered(true)
			const correct = answer === currentQuestion.correctAnswer
			setIsCorrect(correct)

			// Call external score recording callback if provided
			if (options?.onScoreUpdate) {
				options.onScoreUpdate(correct, getQuestionType())
			}

			// Generate feedback message
			let message: string
			if (correct) {
				if (currentLevel === 1 && currentQuestion.correctAnswer === 'NONE') {
					message = `Correct! This is not a GCSE logic gate. ${currentQuestion.reason}`
				} else {
					message = 'Correct! Well done!'
				}
			} else {
				if (currentLevel === 1 && currentQuestion.correctAnswer === 'NONE') {
					message = `Incorrect! This is not a GCSE logic gate. ${currentQuestion.reason}`
				} else {
					message = `Incorrect! The correct answer is ${currentQuestion.correctAnswer}!`
				}
			}

			setFeedbackMessage(message)
		},
		[isAnswered, currentQuestion, currentLevel, options, getQuestionType]
	)

	/**
	 * Generate a new question based on current level
	 */
	const generateNewQuestion = useCallback(() => {
		setIsAnswered(false)
		setIsCorrect(null)
		setFeedbackMessage('')

		if (currentLevel === 1) {
			setCurrentQuestion(generateLevel1Question())
		}
		// Level 2 and 3 will be implemented later
	}, [currentLevel])

	/**
	 * Reset the game state
	 */
	const reset = useCallback(() => {
		setIsAnswered(false)
		setIsCorrect(null)
		setFeedbackMessage('')
		setCurrentQuestion(generateLevel1Question())
	}, [])

	/**
	 * Change the difficulty level
	 */
	const setLevel = useCallback((level: number) => {
		setCurrentLevel(level)
		setIsAnswered(false)
		setIsCorrect(null)
		setFeedbackMessage('')

		if (level === 1) {
			setCurrentQuestion(generateLevel1Question())
		}
		// Level 2 and 3 will be implemented later
	}, [])

	return {
		currentLevel,
		currentQuestion,
		isAnswered,
		isCorrect,
		feedbackMessage,
		questionTitle,
		checkAnswer,
		generateNewQuestion,
		reset,
		setLevel
	}
}
