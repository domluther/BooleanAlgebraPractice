// src/lib/useDrawCircuit.ts
// Hook for managing Draw Circuit game state and logic
// Ported from legacy/js/draw-circuit.js

import { useState, useCallback, useEffect } from 'react';
import { expressionDatabase } from './data';
import {
  generateAllAcceptedAnswers,
  shuffleExpression,
  areExpressionsLogicallyEquivalent,
} from './expressionUtils';

export type DrawCircuitDifficulty = 1 | 2 | 3 | 4 | 5;

const STORAGE_KEY = 'drawCircuitDifficulty';

// Helper to get initial difficulty from localStorage
const getInitialDifficulty = (): DrawCircuitDifficulty => {
  if (typeof window === 'undefined') return 1;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (parsed >= 1 && parsed <= 5) {
        return parsed as DrawCircuitDifficulty;
      }
    }
  } catch (e) {
    console.error('Error reading difficulty from localStorage:', e);
  }
  return 1;
};

interface UseDrawCircuitReturn {
  // State
  currentLevel: DrawCircuitDifficulty;
  currentExpression: string;
  isAnswered: boolean;
  isCorrect: boolean | null;
  feedbackMessage: string;
  helpEnabled: boolean;
  
  // Methods
  setDifficulty: (level: DrawCircuitDifficulty) => void;
  generateQuestion: () => void;
  checkAnswer: (userExpression: string) => void;
  nextQuestion: () => void;
  toggleHelp: () => void;
  
  // Internal tracking (for scoring)
  hasAttemptedCurrentQuestion: boolean;
  questionWasAnsweredCorrectly: boolean;
}

/**
 * Custom hook for managing Draw Circuit mode game state and logic
 */
export function useDrawCircuit(
  onScoreUpdate?: (isCorrect: boolean, questionType: string) => void
): UseDrawCircuitReturn {
  const [currentLevel, setCurrentLevel] = useState<DrawCircuitDifficulty>(getInitialDifficulty);
  const [currentExpression, setCurrentExpression] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [helpEnabled, setHelpEnabled] = useState(false);
  
  // Track attempt state for scoring
  const [hasAttemptedCurrentQuestion, setHasAttemptedCurrentQuestion] = useState(false);
  const [questionWasAnsweredCorrectly, setQuestionWasAnsweredCorrectly] = useState(false);

  // Save difficulty to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currentLevel.toString());
    } catch (e) {
      console.error('Error saving difficulty to localStorage:', e);
    }
  }, [currentLevel]);

  /**
   * Generates a new circuit drawing question based on the current difficulty
   */
  const generateQuestion = useCallback(() => {
    // If moving to a new question and the previous question was attempted but not answered correctly,
    // record it as an incorrect attempt (only if they never got it right)
    if (currentExpression && hasAttemptedCurrentQuestion && !questionWasAnsweredCorrectly && onScoreUpdate) {
      onScoreUpdate(false, `drawCircuit${currentLevel}`);
    }

    const levelKey = `level${currentLevel}` as keyof typeof expressionDatabase;
    const expressions = expressionDatabase[levelKey];

    let newExpression = expressions[Math.floor(Math.random() * expressions.length)];

    // Harder modes: shuffle expression to randomize input/output variables
    if (currentLevel >= 3) {
      newExpression = shuffleExpression(newExpression);
    }

    setCurrentExpression(newExpression);
    setIsAnswered(false);
    setIsCorrect(null);
    setFeedbackMessage('');
    setHasAttemptedCurrentQuestion(false);
    setQuestionWasAnsweredCorrectly(false);
  }, [currentLevel, currentExpression, hasAttemptedCurrentQuestion, questionWasAnsweredCorrectly, onScoreUpdate]);

  /**
   * Sets the difficulty level and generates a new question
   */
  const setDifficulty = useCallback((level: DrawCircuitDifficulty) => {
    // If moving away from current question and it was attempted but not answered correctly,
    // record it as an incorrect attempt
    if (currentExpression && hasAttemptedCurrentQuestion && !questionWasAnsweredCorrectly && onScoreUpdate) {
      onScoreUpdate(false, `drawCircuit${currentLevel}`);
    }

    setCurrentLevel(level);
    
    // Generate question with the NEW level immediately
    const levelKey = `level${level}` as keyof typeof expressionDatabase;
    const expressions = expressionDatabase[levelKey];

    let newExpression = expressions[Math.floor(Math.random() * expressions.length)];

    // Harder modes: shuffle expression to randomize input/output variables
    if (level >= 3) {
      newExpression = shuffleExpression(newExpression);
    }

    setCurrentExpression(newExpression);
    setIsAnswered(false);
    setIsCorrect(null);
    setFeedbackMessage('');
    setHasAttemptedCurrentQuestion(false);
    setQuestionWasAnsweredCorrectly(false);
  }, [currentLevel, currentExpression, hasAttemptedCurrentQuestion, questionWasAnsweredCorrectly, onScoreUpdate]);

  /**
   * Checks if the user's drawn circuit correctly represents the target expression
   */
  const checkAnswer = useCallback((userExpression: string) => {
    if (isAnswered) return;

    if (userExpression.includes('?')) {
      setFeedbackMessage('Your circuit is not complete yet.');
      setIsCorrect(false);
      return;
    }

    // Mark that user has attempted this question
    setHasAttemptedCurrentQuestion(true);

    const possibleAnswers = generateAllAcceptedAnswers(currentExpression);
    console.log('User expression:', userExpression);
    console.log('Target expression:', currentExpression);
    console.log('Possible answers:', possibleAnswers);

    // First try exact match with possible answers
    let correct = possibleAnswers.some(acceptedAnswer => userExpression === acceptedAnswer);

    // If no exact match, try logical equivalence using truth tables
    if (!correct) {
      correct = areExpressionsLogicallyEquivalent(userExpression, currentExpression);
      if (correct) {
        console.log('Expressions are logically equivalent via truth table comparison');
      }
    }

    if (correct) {
      // Only record result when correct - this way multiple attempts don't count against score
      if (onScoreUpdate) {
        onScoreUpdate(true, `drawCircuit${currentLevel}`);
      }
      setQuestionWasAnsweredCorrectly(true);
      setFeedbackMessage('Correct! The circuit matches the expression.');
      setIsCorrect(true);
      setIsAnswered(true);
    } else {
      setFeedbackMessage(
        `Incorrect. Your circuit diagram ${userExpression} does not match the target expression ${currentExpression}.<br/>You can continue editing your circuit and try again, or move on to the next question.`
      );
      setIsCorrect(false);
      // Don't set answered to true, allowing continued editing
      // Don't record result yet - wait until they either get it right or move on
    }
  }, [currentExpression, isAnswered, currentLevel, onScoreUpdate]);

  /**
   * Moves to the next question
   */
  const nextQuestion = useCallback(() => {
    generateQuestion();
  }, [generateQuestion]);

  /**
   * Toggles the help display (show current expression interpretation)
   */
  const toggleHelp = useCallback(() => {
    setHelpEnabled(prev => !prev);
  }, []);

  return {
    currentLevel,
    currentExpression,
    isAnswered,
    isCorrect,
    feedbackMessage,
    helpEnabled,
    setDifficulty,
    generateQuestion,
    checkAnswer,
    nextQuestion,
    toggleHelp,
    hasAttemptedCurrentQuestion,
    questionWasAnsweredCorrectly,
  };
}
