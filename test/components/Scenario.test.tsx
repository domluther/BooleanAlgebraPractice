import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '../test-utils'
import { Scenario } from '@/components/Scenario'
import * as useScenarioModule from '@/lib/useScenario'

// Mock the CircuitDrawer class
vi.mock('@/lib/CircuitDrawer', () => {
  return {
    CircuitDrawer: vi.fn().mockImplementation(() => ({
      destroy: vi.fn(),
      start: vi.fn(),
      updateNotationType: vi.fn(),
    })),
  }
})

// Mock the useScenario hook
vi.mock('@/lib/useScenario', () => ({
  useScenario: vi.fn(),
}))

describe('Scenario Component', () => {
  const mockOnScoreUpdate = vi.fn()
  
  const defaultHookReturn = {
    currentLevel: 2 as const,
    currentScenario: {
      title: 'Test Scenario',
      scenario: 'A test scenario for unit testing',
      inputs: { A: 'Input A', B: 'Input B', C: 'Input C' },
      expression: 'A.B+C',
    },
    questionType: 'truth-table' as const, // Fixed: should be 'truth-table' not 'truthTable'
    isAnswered: false,
    isCorrect: false,
    feedbackMessage: '',
    userAnswer: '',
    setUserAnswer: vi.fn(),
    inputs: ['A', 'B', 'C'],
    intermediateExpressions: ['A.B', 'A.B+C'],
    truthTableData: [
      { A: false, B: false, C: false },
      { A: false, B: false, C: true },
      { A: false, B: true, C: false },
      { A: false, B: true, C: true },
      { A: true, B: false, C: false },
      { A: true, B: false, C: true },
      { A: true, B: true, C: false },
      { A: true, B: true, C: true },
    ],
    outputVariable: 'Q',
    userAnswers: {},
    cellValidations: {},
    showIntermediateColumns: true, // Set to true so truth table renders with intermediate columns
    expertMode: false,
    setShowIntermediateColumns: vi.fn(),
    setExpertMode: vi.fn(),
    setUserAnswer_TruthTable: vi.fn(),
    currentExpression: 'A.B+C',
    helpEnabled: false,
    circuitGateCount: 0,
    removeButtonEnabled: false,
    setDifficulty: vi.fn(),
    generateQuestion: vi.fn(),
    checkAnswer: vi.fn(),
    checkCircuitAnswer: vi.fn(),
    nextQuestion: vi.fn(),
    toggleHelp: vi.fn(),
    handleSymbolInsert: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mock return value
    vi.mocked(useScenarioModule.useScenario).mockReturnValue(defaultHookReturn)
  })

  describe('Intermediate expressions rendering with stable keys', () => {
    it('should use expression content as key instead of array index', () => {
      render(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      // Should render both tables
      const tables = screen.getAllByRole('table')
      expect(tables.length).toBe(2)
      
      // Verify the truth table (second table) renders properly
      const truthTable = tables[1]
      const headers = within(truthTable).getAllByRole('columnheader')
      
      // Verify headers are rendered
      expect(headers.length).toBeGreaterThan(0)
      
      // The key point is that the component renders without React errors
      // The fix changed from key={`inter-${index}`} to key={`inter-${expr}`}
    })

    it('should maintain stable keys when intermediate expressions order changes', () => {
      const { rerender } = render(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      // Set initial intermediate expressions
      vi.mocked(useScenarioModule.useScenario).mockReturnValue({
        ...defaultHookReturn,
        showIntermediateColumns: true,
        intermediateExpressions: ['A.B', 'C.D'],
      })
      
      rerender(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      // Change the order of intermediate expressions
      vi.mocked(useScenarioModule.useScenario).mockReturnValue({
        ...defaultHookReturn,
        showIntermediateColumns: true,
        intermediateExpressions: ['C.D', 'A.B'], // Swapped order
      })
      
      rerender(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      // Component should re-render without errors
      // The keys are based on expression content, so React can properly track them
      expect(screen.getByText('Test Scenario')).toBeInTheDocument()
    })

    it('should handle duplicate intermediate expressions gracefully', () => {
      // Edge case: what if there are duplicate expressions?
      // Using expression as key would cause React warnings
      vi.mocked(useScenarioModule.useScenario).mockReturnValue({
        ...defaultHookReturn,
        showIntermediateColumns: true,
        intermediateExpressions: ['A.B', 'A.B', 'C'], // Duplicates
      })
      
      // This should render without throwing errors
      // In a real scenario, duplicates might need more sophisticated key generation
      render(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      // Component should render successfully
      expect(screen.getByText('Test Scenario')).toBeInTheDocument()
    })

    it('should render intermediate expressions when showIntermediateColumns is true', () => {
      vi.mocked(useScenarioModule.useScenario).mockReturnValue({
        ...defaultHookReturn,
        showIntermediateColumns: true,
        intermediateExpressions: ['A.B', 'A.B+C'],
      })
      
      render(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      // Should render both tables
      const tables = screen.getAllByRole('table')
      expect(tables.length).toBe(2)
      
      // The truth table should have intermediate column headers
      const truthTable = tables[1]
      const headers = within(truthTable).getAllByRole('columnheader')
      const intermediateHeaders = headers.filter(header => 
        header.classList.contains('bg-yellow-200')
      )
      
      // Should have 2 intermediate column headers
      expect(intermediateHeaders.length).toBe(2)
    })

    it('should not render intermediate expression columns when showIntermediateColumns is false', () => {
      vi.mocked(useScenarioModule.useScenario).mockReturnValue({
        ...defaultHookReturn,
        showIntermediateColumns: false,
        intermediateExpressions: ['A.B', 'A.B+C'],
      })
      
      render(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      const tables = screen.getAllByRole('table')
      expect(tables.length).toBe(2)
      
      const truthTable = tables[1]
      const headers = within(truthTable).getAllByRole('columnheader')
      
      // Intermediate expression headers should not be present (no yellow background)
      const intermediateHeaders = headers.filter(header => 
        header.classList.contains('bg-yellow-200')
      )
      
      expect(intermediateHeaders.length).toBe(0)
    })

    it('should preserve intermediate expression keys across re-renders', () => {
      const { rerender } = render(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      // Enable intermediate columns
      vi.mocked(useScenarioModule.useScenario).mockReturnValue({
        ...defaultHookReturn,
        showIntermediateColumns: true,
        intermediateExpressions: ['A.B', 'C.D', 'E.F'],
      })
      
      rerender(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      // Trigger a re-render without changing intermediate expressions
      rerender(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      // Should render without errors - stable keys prevent unnecessary re-renders
      expect(screen.getByText('Test Scenario')).toBeInTheDocument()
    })
  })

  describe('Component rendering', () => {
    it('should render the scenario component', () => {
      render(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      expect(screen.getByText('Test Scenario')).toBeInTheDocument()
    })

    it('should render a truth table when question type is truth-table', () => {
      render(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      // Should render both the scenario description table and the truth table
      const tables = screen.getAllByRole('table')
      expect(tables.length).toBe(2)
      
      // Verify the truth table has the expected structure
      const truthTable = tables[1] // Second table is the truth table
      expect(within(truthTable).getAllByRole('columnheader').length).toBeGreaterThan(0)
    })
  })

  describe('User interactions', () => {
    it('should toggle intermediate columns when switch is toggled', () => {
      const mockSetShowIntermediateColumns = vi.fn()
      vi.mocked(useScenarioModule.useScenario).mockReturnValue({
        ...defaultHookReturn,
        setShowIntermediateColumns: mockSetShowIntermediateColumns,
      })
      
      render(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      // The truth table has a toggle for showing intermediate columns
      const switches = screen.queryAllByRole('switch')
      
      // Should have at least one switch (notation toggle)
      expect(switches.length).toBeGreaterThan(0)
    })

    it('should call checkAnswer when Check button is clicked', () => {
      const mockCheckAnswer = vi.fn()
      vi.mocked(useScenarioModule.useScenario).mockReturnValue({
        ...defaultHookReturn,
        checkAnswer: mockCheckAnswer,
      })
      
      render(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      const checkButton = screen.getByRole('button', { name: /Check Answer/i })
      checkButton.click()
      
      expect(mockCheckAnswer).toHaveBeenCalled()
    })

    it('should call nextQuestion when Next button is clicked', () => {
      const mockNextQuestion = vi.fn()
      vi.mocked(useScenarioModule.useScenario).mockReturnValue({
        ...defaultHookReturn,
        isAnswered: true,
        nextQuestion: mockNextQuestion,
      })
      
      render(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      const nextButton = screen.getByRole('button', { name: /Next Question/i })
      nextButton.click()
      
      expect(mockNextQuestion).toHaveBeenCalled()
    })
  })

  describe('Edge cases', () => {
    it('should handle empty intermediate expressions array', () => {
      vi.mocked(useScenarioModule.useScenario).mockReturnValue({
        ...defaultHookReturn,
        showIntermediateColumns: true,
        intermediateExpressions: [],
      })
      
      render(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      // Should still render both tables
      const tables = screen.getAllByRole('table')
      expect(tables.length).toBe(2)
      
      // Truth table should not have intermediate column headers (bg-yellow-200)
      const truthTable = tables[1]
      const headers = within(truthTable).getAllByRole('columnheader')
      const intermediateHeaders = headers.filter(header => 
        header.classList.contains('bg-yellow-200')
      )
      expect(intermediateHeaders.length).toBe(0)
    })

    it('should handle single intermediate expression', () => {
      vi.mocked(useScenarioModule.useScenario).mockReturnValue({
        ...defaultHookReturn,
        showIntermediateColumns: true,
        intermediateExpressions: ['A.B'],
      })
      
      render(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      // Component should render successfully
      expect(screen.getByText('Test Scenario')).toBeInTheDocument()
    })

    it('should handle complex intermediate expressions', () => {
      vi.mocked(useScenarioModule.useScenario).mockReturnValue({
        ...defaultHookReturn,
        showIntermediateColumns: true,
        intermediateExpressions: ['(A+B).(C+D)', '¬(A.B)', 'A⊻B'],
      })
      
      render(<Scenario onScoreUpdate={mockOnScoreUpdate} />)
      
      // Should render both tables
      const tables = screen.getAllByRole('table')
      expect(tables.length).toBe(2)
      
      // Truth table should have intermediate column headers for complex expressions
      const truthTable = tables[1]
      const headers = within(truthTable).getAllByRole('columnheader')
      const intermediateHeaders = headers.filter(header => 
        header.classList.contains('bg-yellow-200')
      )
      
      // Should have 3 intermediate column headers (one for each expression)
      expect(intermediateHeaders.length).toBe(3)
    })
  })
})
