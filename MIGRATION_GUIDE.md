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
- 🔄 **Phase 1:** NameThat mode (Level 1 → 2 → 3)
- ⏳ **Phase 2:** Expression Writing mode
- ⏳ **Phase 3:** Truth Table mode
- ⏳ **Phase 4:** Draw Circuit mode
- ⏳ **Phase 5:** Scenario mode

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
- [ ] Port `CircuitGenerator` class
- [ ] Port expression utilities
- [ ] Port expression database
- [ ] Write tests for Level 1 logic
- [ ] Create `useNameThat` hook with Level 1
- [ ] Create `nameThat.tsx` component with Level 1 UI
- [ ] Test Level 1 end-to-end
- [ ] Add Level 2 (tests → hook → UI)
- [ ] Add Level 3 (tests → hook → UI)
- [ ] Add keyboard shortcuts
- [ ] Add expert mode
- [ ] Add notation toggle
- [ ] Polish styling

## 📊 Score System

**Current Implementation:** `src/lib/scoreManager.ts` (already migrated)

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
- Site configuration (`siteConfig.ts`)
- Mode menu navigation (`ModeMenu.tsx`)
- Score manager (`scoreManager.ts`)
- Basic routing structure

### 🔄 In Progress
- Migration guide (this document)
- Renaming template files

### ⏳ Next Up
- Testing infrastructure setup
- Core utility migration
- NameThat Level 1 implementation

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
- ❌ Don't implement all modes at once - finish NameThat first
- ✅ Do maintain feature parity with legacy implementation
- ✅ Do use TypeScript strictly
- ✅ Do test thoroughly before moving on

### Getting Oriented:
1. Run the legacy site: Open `/legacy/index.html` in browser
2. Play each mode to understand the user experience
3. Read the legacy JavaScript for that mode
4. Check for existing tests in `/legacy/tests/`
5. Plan your migration approach

## 🔗 Useful Links

- **Legacy Site:** Open `/legacy/index.html` in browser
- **TanStack Router Docs:** https://tanstack.com/router
- **shadcn/ui Docs:** https://ui.shadcn.com/
- **Vitest Docs:** https://vitest.dev/

---

**Last Updated:** October 7, 2025  
**By:** AI Assistant  
**Next Milestone:** Complete NameThat Level 1
