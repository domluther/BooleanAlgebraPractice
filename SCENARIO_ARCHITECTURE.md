# Scenario Mode Architecture Analysis

## Overview
Scenario mode is unique because it **reuses existing mode logic** for three different question types while adding a real-world narrative layer.

## Legacy Architecture (What Works Well)

### 1. **Shared Utilities (Already Ported ✅)**
The legacy code imports and reuses utilities:

```javascript
// From expression-utils.js
import { generateAllAcceptedAnswers, normalizeExpression, areExpressionsLogicallyEquivalent }

// From draw-circuit-utils.js
import { CircuitDrawer }

// From truth-table-utils.js
import * as ttUtils

// From config.js
import { convertToCurrentNotation, convertToWordNotation }
```

**In our React codebase, these already exist:**
- ✅ `src/lib/expressionUtils.ts` - All expression validation logic
- ✅ `src/lib/CircuitDrawer.ts` - Canvas-based circuit drawing
- ✅ `src/lib/truthTableUtils.ts` - Truth table generation and validation
- ✅ `src/lib/config.ts` - Notation conversion

### 2. **Scenario-Specific Data**
The scenario database is **pure data** - no logic, just content:

```typescript
interface ScenarioData {
  title: string;           // e.g., "Door Access"
  scenario: string;        // The story/description
  inputs: {                // Variable meanings
    A: "Person has valid ID badge",
    B: "Person knows correct passcode"
  };
  expression: string;      // e.g., "Q = A AND B"
}
```

This should live in **`src/lib/scenarioData.ts`** (new file).

### 3. **Question Type Selection**
Scenario mode randomly picks one of three types:
- **'expression'** → Write the Boolean expression (reuse Expression Writing validation)
- **'truth-table'** → Fill in truth table (reuse Truth Table validation)
- **'draw-circuit'** → Draw the circuit (reuse Circuit Drawer validation)

## Proposed React Architecture

### New Files to Create

#### 1. `src/lib/scenarioData.ts`
```typescript
export interface ScenarioQuestion {
  title: string;
  scenario: string;
  inputs: Record<string, string>;
  expression: string;
}

export const scenarioDatabase: Record<number, ScenarioQuestion[]> = {
  1: [ /* Level 1 scenarios */ ],
  2: [ /* Level 2 scenarios */ ],
  3: [ /* Level 3 scenarios */ ],
  4: [ /* Level 4 scenarios */ ]
};
```

#### 2. `src/lib/useScenario.ts`
The hook that manages scenario game state:

```typescript
interface UseScenarioReturn {
  // Scenario state
  currentLevel: 1 | 2 | 3 | 4;
  currentScenario: ScenarioQuestion | null;
  questionType: 'expression' | 'truth-table' | 'draw-circuit';
  
  // Delegated state from sub-modes
  // (Will use existing hooks internally)
  
  // Methods
  setDifficulty: (level: 1 | 2 | 3 | 4) => void;
  generateQuestion: () => void;
  checkAnswer: () => void; // Routes to appropriate validator
  nextQuestion: () => void;
}
```

**Key Implementation Details:**
- Internally creates instances of:
  - Expression validation logic (from `expressionUtils.ts`)
  - Truth table logic (from `truthTableUtils.ts`)
  - Circuit drawer logic (from `CircuitDrawer.ts`)
- The `checkAnswer()` method routes to the correct validator based on `questionType`

#### 3. `src/components/Scenario.tsx`
The component that renders the scenario:

```tsx
export function Scenario({ onScoreUpdate }: ScenarioProps) {
  const {
    currentLevel,
    currentScenario,
    questionType,
    // ... other state
    checkAnswer,
    generateQuestion
  } = useScenario({ onScoreUpdate });
  
  return (
    <div>
      {/* Control Panel (difficulty, notation, regenerate) */}
      
      {/* Scenario Display */}
      <ScenarioCard 
        title={currentScenario.title}
        description={currentScenario.scenario}
        inputs={currentScenario.inputs}
      />
      
      {/* Question Type - Conditionally Render */}
      {questionType === 'expression' && (
        <ExpressionInput onSubmit={checkAnswer} />
      )}
      
      {questionType === 'truth-table' && (
        <TruthTableGrid onSubmit={checkAnswer} />
      )}
      
      {questionType === 'draw-circuit' && (
        <CircuitCanvas onSubmit={checkAnswer} />
      )}
      
      {/* Feedback & Actions */}
    </div>
  );
}
```

## Reuse Strategy

### Expression Writing Logic
**Reuse:** `generateAllAcceptedAnswers()` and `areExpressionsLogicallyEquivalent()`

```typescript
// In useScenario.ts
import { generateAllAcceptedAnswers, areExpressionsLogicallyEquivalent } from './expressionUtils';

const checkExpressionAnswer = (userAnswer: string) => {
  const acceptedAnswers = generateAllAcceptedAnswers(currentExpression);
  const isCorrect = acceptedAnswers.includes(userAnswer) || 
                    areExpressionsLogicallyEquivalent(userAnswer, currentExpression);
  // ... handle result
};
```

### Truth Table Logic
**Reuse:** `calculateTruthTableData()` and validation logic

```typescript
// In useScenario.ts
import { calculateTruthTableData, parseExpressionForTable } from './truthTableUtils';

const generateTruthTable = () => {
  const parsed = parseExpressionForTable(currentExpression);
  const data = calculateTruthTableData(
    currentExpression,
    parsed.inputs,
    parsed.intermediateExpressions,
    showIntermediateColumns
  );
  // ... use data for rendering
};
```

### Circuit Drawing Logic
**Reuse:** `CircuitDrawer` class instance

```typescript
// In useScenario.ts or component
import { CircuitDrawer } from './CircuitDrawer';

const circuitDrawerRef = useRef<CircuitDrawer | null>(null);

useEffect(() => {
  if (questionType === 'draw-circuit' && canvasRef.current) {
    circuitDrawerRef.current = new CircuitDrawer(
      canvasId,
      () => isAnswered,
      notationType,
      (expr) => setInterpretedExpression(expr),
      (enabled) => setRemoveButtonEnabled(enabled)
    );
    
    circuitDrawerRef.current.start(
      currentExpression,
      interpretedExprRef.current,
      currentLevel
    );
  }
}, [questionType, currentExpression]);
```

## Component Reuse

### Should We Reuse Existing Components?

**Option A: Reuse Entire Components** ❌
```tsx
// DON'T DO THIS - components are too coupled to their routes
{questionType === 'expression' && <ExpressionWriting />}
```
- Problem: These components include their own control panels, difficulty selectors, etc.
- Scenario mode needs ONE control panel, not three different ones

**Option B: Extract Shared Sub-Components** ✅
```tsx
// DO THIS - extract just the interactive parts
{questionType === 'expression' && (
  <ExpressionInputField 
    value={userAnswer}
    onChange={setUserAnswer}
    onSubmit={checkAnswer}
  />
)}
```

### Components to Extract (if needed)

#### From ExpressionWriting
- **Input field with symbol buttons** - Could extract to `<BooleanExpressionInput />`
- **Notation validation** - Already in `expressionUtils.ts` ✅

#### From TruthTable
- **Table grid rendering** - Could extract to `<TruthTableGrid />`
- **Cell dropdown selects** - Could extract to `<TruthTableCell />`
- **Validation display** - Could extract to `<CellValidationFeedback />`

#### From DrawCircuit
- **Canvas element** - Just use `<canvas>` directly
- **Toolbox with gates** - Could extract to `<GateToolbox />`
- **CircuitDrawer logic** - Already in `CircuitDrawer.ts` ✅

**However**, given the complexity and time constraints, it may be **simpler to duplicate the JSX** for these sub-sections rather than over-engineer component extraction. The logic is what matters most, and that's already reusable.

## Implementation Plan

### Phase 1: Data Layer
1. Create `src/lib/scenarioData.ts`
2. Port all 4 difficulty levels of scenario data from legacy
3. Type the interface strictly

### Phase 2: Hook Logic
1. Create `src/lib/useScenario.ts`
2. Implement question generation (random scenario + random question type)
3. Implement routing logic for the three validators
4. Add localStorage for difficulty persistence
5. Integrate scoring (4, 6, 10, 15 points for levels 1-4)

### Phase 3: Component UI
1. Create `src/components/Scenario.tsx`
2. Implement scenario card display (title, description, input table)
3. Implement conditional rendering for three question types
4. Copy/adapt JSX from existing components (don't over-extract)
5. Add control panel (difficulty, notation, regenerate)
6. Style with semantic CSS variables

### Phase 4: Route & Testing
1. Create `src/routes/scenario.tsx`
2. Test all three question types at each difficulty level
3. Verify scoring integration
4. Polish UI and interactions

## Key Insights

✅ **Reuse utilities, not components** - The logic is portable, the UI less so

✅ **Scenario is a coordinator** - It doesn't implement validation, it routes to existing validators

✅ **Data is king** - The scenario database is the only truly new code needed

✅ **Three modes in one** - Expression, Truth Table, and Circuit all work within Scenario

✅ **Scoring is unified** - One mode, one level, three possible question types

## Estimated Effort

- **Data Layer:** 30 minutes (straightforward port)
- **Hook Logic:** 1-2 hours (routing logic, state management)
- **Component UI:** 1-2 hours (layout, conditional rendering, styling)
- **Testing:** 30 minutes (verify all types at all levels)

**Total: 3-4 hours** for complete implementation

---

This architecture follows the legacy pattern while leveraging our modern React codebase. The key is recognizing that Scenario mode is a **content wrapper** around existing validation logic, not a new game mechanic.
