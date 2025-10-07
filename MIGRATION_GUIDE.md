# Boolean Algebra Practice - Migration Guide

**Migration Date:** October 2025  
**Status:** 🚧 In Progress  
**Current Branch:** `refactor`

## 📋 Overview

This document tracks the migration of Boolean Algebra Practice from a vanilla JavaScript implementation (`/legacy`) to a modern React + TypeScript stack using Tailwind CSS, shadcn/ui, and pnpm.

**Primary Goal:** Port the working game logic without rewriting it - focus on adding type safety and React patterns while maintaining feature parity.

## 🎯 Migration Strategy

### Test-Driven Development (TDD) Approach
1. **Port utilities first** - Core logic without UI dependencies
2. **Write tests** - Before implementing React components
3. **Create hooks** - Separate game logic from UI
4. **Build components** - Use hooks to render UI
5. **Manual testing** - Verify everything works
6. **Iterate** - Fix bugs and repeat for next mode

### Implementation Order
- ✅ **Phase 0:** Site config and navigation setup (DONE)
- ✅ **Phase 1:** NameThat mode (DONE - All 3 levels)
- ✅ **Phase 2:** Expression Writing mode (DONE - All 5 levels)
- ✅ **Phase 3:** Truth Table mode (DONE - All 5 levels + Expert mode)
- ⏳ **Phase 4:** Draw Circuit mode (NOT STARTED)
- ⏳ **Phase 5:** Scenario mode (NOT STARTED)

## 📁 File Organization

### Legacy Code Structure (Reference Only)
```
/legacy/js/
├── app.js                    # Entry point
├── game-manager.js           # Central game coordinator
├── ui-manager.js             # DOM manipulation
├── score-manager.js          # Score tracking & localStorage
├── navigation.js             # Site navigation
├── config.js                 # Game mode configuration
├── data.js                   # Expression database
├── expression-utils.js       # Boolean expression parsing & evaluation
├── circuit-generator.js      # SVG circuit rendering
├── truth-table-utils.js      # Truth table generation
├── name-that.js              # Name That mode logic
├── expression-writing.js     # Expression Writing mode logic
├── truth-table.js            # Truth Table mode logic
├── draw-circuit.js           # Draw Circuit mode logic
└── scenario.js               # Scenario mode logic
```

### New React Structure
```
/src/
├── routes/                   # TanStack Router pages
│   ├── __root.tsx           # Root layout
│   ├── index.tsx            # Home page
│   ├── nameThat.tsx         # Name That mode (IN PROGRESS)
│   ├── old_*.tsx            # Template files for reference (DELETE LATER)
│   └── [other modes]        # To be created
├── components/              # Reusable UI components
│   ├── ui/                  # shadcn components
│   ├── Header.tsx           # Site header
│   ├── Footer.tsx           # Site footer
│   ├── ModeMenu.tsx         # Game mode selector
│   ├── ScoreButton.tsx      # Score display button
│   └── StatsModal.tsx       # Score statistics modal
├── lib/                     # Business logic & utilities
│   ├── __tests__/           # Vitest test files
│   ├── siteConfig.ts        # Site configuration
│   ├── scoreManager.ts      # Score tracking (migrated)
│   ├── data.ts              # Expression database (to migrate)
│   ├── config.ts            # Notation & game settings (to migrate)
│   ├── expressionUtils.ts   # Boolean expression utilities (to migrate)
│   ├── circuitGenerator.ts  # SVG circuit generator (to migrate)
│   ├── truthTableUtils.ts   # Truth table utilities (to migrate)
│   ├── useNameThat.ts       # NameThat game hook (to create)
│   └── [other hooks]        # To be created
└── contexts/                # React contexts
    └── theme-provider.tsx   # Theme context (exists)
```

## 🔑 Key Architecture Decisions

### 1. Separation of Concerns
- **Business Logic → Custom Hooks:** Game state and logic live in hooks (e.g., `useNameThat`)
- **UI → Components:** React components consume hooks and render UI
- **Utilities → Pure Functions:** Expression parsing, circuit generation, etc. remain pure

### 2. TypeScript Migration
- Add interfaces for all data structures (Expression, GateType, Difficulty, etc.)
- Keep function logic identical to legacy code
- Use strict TypeScript configuration

### 3. Styling Approach
- **Use semantic CSS variables** from `src/index.css` (e.g., `bg-primary`, `text-foreground`)
- **Never hardcode colors** like `bg-blue-600` - always use theme variables
- Reference `legacy/css/styles.css` for original design
- Use Tailwind utility classes for layout and spacing

### 4. State Management
- **Local state** for component-specific UI (useState)
- **Custom hooks** for game logic (useState + useReducer)
- **Context** for global state (notation preference, theme)
- **localStorage** for persistence (scores, preferences)

### 5. Testing Strategy
- **Unit tests** for utilities (expression parsing, circuit generation)
- **Integration tests** for game hooks (question generation, answer checking)
- **Manual E2E testing** for full user flows
- Reference `legacy/tests/` for existing test cases

## 🎮 NameThat Mode Migration Plan

### Mode Overview
**File:** `legacy/js/name-that.js`  
**Purpose:** Identify logic gates, diagrams, and truth tables  
**Levels:**
1. **Easy:** Identify single GCSE logic gates (AND/OR/NOT/NONE)
2. **Medium:** Identify logic diagrams from expressions
3. **Hard:** Identify expressions from truth tables

### Dependencies
```typescript
// Core dependencies to port first:
import { CircuitGenerator } from './circuitGenerator'     // SVG rendering
import { expressionDatabase } from './data'               // Question bank
import { evaluateExpression, getInputVariables } from './expressionUtils'
import { convertToCurrentNotation } from './config'       // Notation switching
```

### NameThat Hook Interface (Target)
```typescript
interface UseNameThatReturn {
  // State
  currentDifficulty: 1 | 2 | 3
  currentQuestion: Question | null
  options: string[]
  answered: boolean
  isCorrect: boolean | null
  feedbackMessage: string
  
  // Methods
  setDifficulty: (level: 1 | 2 | 3) => void
  generateQuestion: () => void
  checkAnswer: (answer: string) => void
  nextQuestion: () => void
  
  // Rendering data
  questionTitle: string
  displayContent: QuestionDisplay
}

type QuestionDisplay = 
  | { type: 'circuit', svgContent: string }
  | { type: 'truthTable', tableHTML: string }
```

### Implementation Checklist
- [x] Port `CircuitGenerator` class
- [x] Port expression utilities
- [x] Port expression database
- [x] Write tests for Level 1 logic
- [x] Create `useNameThat` hook with Level 1
- [x] Create `NameThat.tsx` component with Level 1 UI
- [x] Test Level 1 end-to-end
- [x] Add Level 2 (tests → hook → UI)
- [x] Add Level 3 (truth table identification with multiple choice)
- [x] Add keyboard shortcuts (1-4 for answers, Enter for next)
- [x] Add notation toggle (Word/Symbol mode)
- [x] Polish styling with semantic CSS variables
- [x] Integrate proper scoring (1, 2, 4 points for levels 1-3)

## 🎮 Expression Writing Mode Migration Plan

### Mode Overview
**File:** `legacy/js/expression-writing.js`  
**Purpose:** Write Boolean expressions for displayed circuits  
**Levels:**
1. **Easy:** Simple single-gate expressions
2. **Medium:** Two-gate combinations
3. **Hard:** Complex expressions with shuffled order
4. **Expert:** Advanced multi-gate circuits with shuffling
5. **A-Level:** Most complex with XOR gates and shuffling

### Implementation Checklist
- [x] Create `useExpressionWriting` hook with all 5 difficulty levels
- [x] Implement answer validation (exact match + logical equivalence)
- [x] Implement notation consistency checking
- [x] Create `ExpressionWriting.tsx` component with:
  - [x] Control panel (difficulty dropdown, notation toggle, regenerate)
  - [x] Circuit display
  - [x] Text input with larger font
  - [x] Symbol helper buttons (conditional XOR on A-Level)
  - [x] Mark My Answer button
  - [x] Feedback display
  - [x] Next Question button
- [x] Create `/writeexpression` route with SharedLayout
- [x] Add keyboard shortcuts (Enter to submit/continue)
- [x] Polish styling with semantic CSS variables
- [x] Integrate proper scoring (3, 5, 7, 10, 15 points for levels 1-5)
- [x] Integrate score tracking via ScoreManager

### Key Features Implemented
- **Answer Validation:** 
  - Exact match checking with `generateAllAcceptedAnswers()`
  - Logical equivalence checking with `areExpressionsLogicallyEquivalent()`
  - Notation consistency validation
- **Symbol Buttons:** Only visible in symbol mode, XOR button only on A-Level
- **Keyboard Support:** Enter key for submit/next with anti-double-trigger logic
- **Responsive Design:** Narrower, centered input and buttons on larger screens

## 🎮 Truth Table Mode Migration Plan

### Mode Overview
**File:** `legacy/js/truth-table.js`  
**Purpose:** Fill in truth tables for Boolean expressions  
**Levels:**
1. **Easy:** 2-input expressions (4 rows)
2. **Medium:** 2-input with intermediate columns
3. **Hard:** 3-input expressions (8 rows)
4. **Expert:** 3-input with intermediate columns
5. **A-Level:** Complex 3-input with XOR gates

### Implementation Checklist
- [x] Port truth table utilities (`truthTableUtils.ts`)
- [x] Create `useTruthTable` hook with all 5 difficulty levels
- [x] Implement normal mode (output column only)
- [x] Implement expert mode (all cells, order-independent validation)
- [x] Add intermediate columns toggle
- [x] Create `TruthTable.tsx` component with:
  - [x] Control panel (difficulty, notation, intermediate toggle, expert toggle)
  - [x] Circuit display above expression
  - [x] Interactive HTML table with dropdown selects
  - [x] Cell validation with color coding
  - [x] Submit and Next Question buttons
- [x] Create `/truthtable` route with SharedLayout
- [x] Add proper scoring (4, 8, 12, 20, 25 points for levels 1-5)
- [x] Add expert mode multiplier (3x points)
- [x] Polish styling with semantic CSS variables

### Key Features Implemented
- **Two Game Modes:**
  - **Normal Mode:** Fill in output column only, can retry incorrect cells
  - **Expert Mode:** Fill in ALL cells (inputs + intermediates + output), order-independent row matching, 3x points
- **Interactive Table:** Dropdown selects for each cell with 0/1 options
- **Smart Validation:** 
  - Normal mode validates output column cell-by-cell
  - Expert mode uses order-independent row matching (handles shuffled input order)
- **Intermediate Columns Toggle:** Show/hide intermediate sub-expressions
- **Circuit Display:** Shows circuit diagram above expression label

## 📊 Score System

**Current Implementation:** `src/lib/scoreManager.ts` (✅ COMPLETE)

### Points by Mode & Difficulty
```typescript
const SCORE_TABLE = {
  nameThat: { 1: 1, 2: 2, 3: 4 },
  writeExpression: { 1: 3, 2: 5, 3: 7, 4: 10, 5: 15 },
  truthTable: { 1: 4, 2: 8, 3: 12, 4: 20, 5: 25 },
  drawCircuit: { 1: 3, 2: 6, 3: 10, 4: 15, 5: 20 },
  scenario: { 1: 4, 2: 6, 3: 10, 4: 15 }
}
```

**Expert Mode:** Points × 3

### Implementation Details
- ✅ Proper point calculation based on mode and difficulty level
- ✅ Expert mode 3x multiplier for Truth Table mode
- ✅ All game modes grouped correctly in stats (Name That, Expression Writing, Truth Table)
- ✅ Removed old placeholder modes from initial scoreData
- ✅ Point totals calculated from byType data (not just counting correct answers)

````

## 🎨 Styling Reference

### Semantic CSS Variables (Use These!)
```css
/* From src/index.css */
--color-background        /* Main background */
--color-foreground        /* Main text */
--color-primary          /* Primary accent */
--color-secondary        /* Secondary accent */
--color-muted            /* Muted backgrounds */
--color-accent           /* Accent highlights */
--color-destructive      /* Error states */
--color-border           /* Borders */

/* Custom variables */
--color-button-primary   /* Primary button background */
--color-button-primary-hover
--color-button-primary-text
--color-link
--color-link-hover
```

### Component Patterns (From Templates)
Reference `src/components/old_CapacityCalculator.tsx` and `src/components/old_MultipleChoice.tsx` for:
- Card layouts with shadcn `<Card>` component
- Button styling with semantic variables
- Input field patterns
- Responsive grid layouts
- Feedback message styling

## 🧪 Testing Setup

### Tools
- **Vitest:** Test runner (Jest-compatible)
- **React Testing Library:** Component testing
- **@testing-library/user-event:** User interaction simulation

### Test File Naming
- Unit tests: `src/lib/__tests__/[module].test.ts`
- Hook tests: `src/lib/__tests__/[hookName].test.tsx`
- Component tests: `src/components/__tests__/[Component].test.tsx`

### Running Tests
```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report
```

## 🗺️ Notation System

### Word Notation (Default)
- `AND` → AND
- `OR` → OR
- `NOT` → NOT
- `XOR` → XOR

### Symbol Notation
- `AND` → ∧
- `OR` → ∨
- `NOT` → ¬
- `XOR` → ⊻

**Implementation:** Global context/hook with localStorage persistence

## ⌨️ Keyboard Shortcuts

### Global
- `1-4` → Select answer option (in Name That mode)
- `n` → Next question
- `Enter` → Submit answer

### Mode-Specific
Document as they're implemented...

## 🚧 Current Status

### ✅ Completed
- **Phase 0: Site Setup**
  - Site configuration (`siteConfig.ts`)
  - Mode menu navigation (`ModeMenu.tsx`)
  - Score manager (`scoreManager.ts`) with proper point calculation
  - Basic routing structure with TanStack Router
  - Theme provider with light/dark mode
  - Semantic CSS variables in `index.css`

- **Phase 1: NameThat Mode (COMPLETE)**
  - Level 1: Single GCSE logic gates (AND/OR/NOT/NONE) ✅
  - Level 2: Two-gate combinations ✅
  - Level 3: Truth table identification ✅
  - Circuit generator with SVG rendering
  - Keyboard shortcuts (1-4, Enter)
  - Notation toggle (Word/Symbol)
  - Score tracking integration (1, 2, 4 points by level)
  - Semantic color theming

- **Phase 2: Expression Writing Mode (COMPLETE)**
  - All 5 difficulty levels (Easy → A-Level) ✅
  - Answer validation (exact match + logical equivalence) ✅
  - Notation consistency checking ✅
  - Text input with symbol helper buttons ✅
  - Conditional XOR button (A-Level only) ✅
  - Keyboard shortcuts (Enter to submit/continue) ✅
  - Score tracking integration (3, 5, 7, 10, 15 points by level) ✅
  - Semantic color theming ✅

- **Phase 3: Truth Table Mode (COMPLETE)**
  - All 5 difficulty levels (Easy → A-Level) ✅
  - Normal mode (output column only, can retry) ✅
  - Expert mode (all cells, order-independent validation, 3x points) ✅
  - Intermediate columns toggle ✅
  - Interactive HTML table with dropdown selects ✅
  - Cell validation with color coding ✅
  - Circuit display above expression ✅
  - Keyboard shortcuts ✅
  - Score tracking integration (4, 8, 12, 20, 25 points by level) ✅
  - Expert mode multiplier (3x points) ✅
  - Semantic color theming ✅

### 🔄 In Progress
- N/A - Ready for Phase 4

### ⏳ Next Up
- **Phase 4: Draw Circuit Mode** (NOT STARTED)
  - Port draw circuit utilities
  - Create `useDrawCircuit` hook
  - Build interactive circuit builder
  - Implement drag and drop gates
  - Wire connection system
  - Circuit validation
  - 5 difficulty levels
  - Score tracking (3, 6, 10, 15, 20 points by level)
  
- **Phase 5: Scenario Mode** (NOT STARTED)
  - Port scenario utilities
  - Create `useScenario` hook
  - Build Scenario component
  - Real-world logic problems
  - Multi-step challenges
  - 4 difficulty levels
  - Score tracking (4, 6, 10, 15 points by level)

## 📝 Notes for Future AI Agents

### When Working on This Project:

1. **Read this file first** to understand the migration strategy
2. **Check the todo list** (managed via `manage_todo_list` tool) for current task
3. **Reference legacy code** in `/legacy` but don't modify it
4. **Use semantic CSS variables** - never hardcode colors
5. **Write tests first** when implementing new features
6. **Keep logic identical** to legacy - don't "improve" working algorithms
7. **Files prefixed with `old_`** are templates from another site - for reference only

### Common Pitfalls:
- ❌ Don't rewrite working game logic - port it with types
- ❌ Don't use hardcoded Tailwind colors like `bg-blue-600`
- ❌ Don't skip writing tests
- ✅ Do maintain feature parity with legacy implementation
- ✅ Do use TypeScript strictly
- ✅ Do test thoroughly before moving on
- ✅ Do pass mode, level, and isExpert parameters to onScoreUpdate callbacks

### Getting Oriented:
1. Run the legacy site: Open `/legacy/index.html` in browser
2. Play each mode to understand the user experience
3. Read the legacy JavaScript for that mode
4. Check for existing tests in `/legacy/tests/`
5. Understand the scoring system - different modes and levels award different points

### Score Integration Checklist:
When implementing a new mode, ensure:
1. ✅ Hook accepts `onScoreUpdate` callback with signature: `(isCorrect, questionType, mode, level, isExpert)`
2. ✅ Call `onScoreUpdate` with consistent questionType (e.g., "Name That", "Truth Table")
3. ✅ Pass mode key matching SCORE_TABLE (e.g., "nameThat", "truthTable")
4. ✅ Pass current difficulty level (1-5)
5. ✅ Pass isExpert flag if mode has expert mode
6. ✅ Initialize mode in blankScoreData.byType in scoreManager.ts
5. Plan your migration approach

## 🔗 Useful Links

- **Legacy Site:** Open `/legacy/index.html` in browser
- **TanStack Router Docs:** https://tanstack.com/router
- **shadcn/ui Docs:** https://ui.shadcn.com/
- **Vitest Docs:** https://vitest.dev/

---

**Last Updated:** October 7, 2025  
**By:** AI Assistant  
**Next Milestone:** Draw Circuit Mode

**Completion Status:** 3 of 5 game modes complete (60%)
- ✅ Name That (3 levels)
- ✅ Expression Writing (5 levels)
- ✅ Truth Table (5 levels + expert mode)
- ⏳ Draw Circuit (not started)
- ⏳ Scenario (not started)
