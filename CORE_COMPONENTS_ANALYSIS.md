# Should We Create "Core" Components for Scenario Reuse?

## Analysis Date: 7 October 2025

## The Question
Should we extract `TruthTableCore`, `ExpressionWritingCore`, `DrawCircuitCore` etc. to reuse in Scenario mode?

## TL;DR Answer: **NO - Not Helpful**

## Why "Core" Components Won't Help

### 1. **The Logic is Already Reusable (in hooks and utilities)**

Looking at the current architecture:

```
TruthTable Component
├── useTruthTable hook ← Contains all game logic
├── truthTableUtils.ts ← Contains validation logic
└── JSX rendering ← UI-specific to TruthTable mode
```

**What Scenario needs:** The hook + utilities  
**What it doesn't need:** The TruthTable component's UI

### 2. **Scenario Has Fundamentally Different UI**

#### TruthTable mode shows:
```tsx
<ControlPanel />
<CircuitDisplay />           ← Shows circuit diagram
<ExpressionLabel />          ← Shows Q = A AND B
<TruthTableGrid />           ← User fills this in
<CheckAnswerButton />
<Feedback />
<NextButton />
```

#### Scenario mode shows:
```tsx
<ControlPanel />
<ScenarioCard>               ← NEW: Story context
  <Title />                  ← "Bank Vault Access"
  <Description />            ← Narrative paragraph
  <InputMeanings />          ← What A, B, C represent
</ScenarioCard>
<QuestionTypeSelector />     ← NEW: Which question type this is

{/* THEN conditionally ONE of these three: */}
{questionType === 'truth-table' && <TruthTableGrid />}
{questionType === 'expression' && <ExpressionInput />}
{questionType === 'draw-circuit' && <CircuitCanvas />}

<CheckAnswerButton />
<Feedback />
<NextButton />
```

**Key Insight:** Only the `<TruthTableGrid />` part is reusable. Not the whole component.

### 3. **What IS Actually Reusable?**

Let's map what Scenario can reuse from each mode:

#### From TruthTable:
✅ **Hook:** `useTruthTable()` (almost all the logic)  
✅ **Utility:** `truthTableUtils.ts` (calculation & validation)  
❌ **Component:** TruthTable.tsx (too much mode-specific UI)  
✅ **Sub-component:** The table rendering JSX (lines 210-340 of TruthTable.tsx)

#### From ExpressionWriting:
✅ **Utility:** `expressionUtils.ts` (validation logic)  
✅ **Utility:** `generateAllAcceptedAnswers()`, `areExpressionsLogicallyEquivalent()`  
❌ **Component:** ExpressionWriting.tsx (shows circuit, we need scenario card)  
✅ **Sub-component:** The input field + symbol buttons (lines 225-280)

#### From DrawCircuit:
✅ **Class:** `CircuitDrawer` (entire canvas interaction logic)  
❌ **Component:** DrawCircuit.tsx (shows target expression, we need scenario)  
✅ **Sub-component:** The canvas + toolbox (lines 245-340)

### 4. **The Real Architecture Pattern**

What we actually have:

```
Mode Component (e.g., TruthTable.tsx)
│
├── ControlPanel (SHARED - already extracted ✅)
├── Mode-specific context/setup (NOT reusable)
├── Reusable UI fragment (e.g., table grid)
└── Standard actions (check/next buttons)

Hook (e.g., useTruthTable.ts)
│
├── State management (REUSABLE ✅)
├── Question generation (REUSABLE ✅)
└── Answer validation (REUSABLE ✅)

Utilities (e.g., truthTableUtils.ts)
│
└── Pure functions (ALREADY SHARED ✅)
```

## What Scenario Mode Actually Needs

### Option A: Reuse Hooks Directly (RECOMMENDED)

```typescript
// src/lib/useScenario.ts
import { useTruthTable } from './useTruthTable';
import { generateAllAcceptedAnswers } from './expressionUtils';
import { CircuitDrawer } from './CircuitDrawer';

export function useScenario({ onScoreUpdate }) {
  const [questionType, setQuestionType] = useState<QuestionType>('expression');
  const [currentScenario, setCurrentScenario] = useState<ScenarioQuestion | null>(null);
  
  // Conditionally use the appropriate hook based on question type
  const truthTableHook = useTruthTable({ 
    onScoreUpdate,
    expression: currentScenario?.expression  // Pass scenario expression
  });
  
  const checkAnswer = () => {
    switch (questionType) {
      case 'expression':
        return checkExpressionAnswer(); // Use expressionUtils directly
      case 'truth-table':
        return truthTableHook.checkAnswer(); // Delegate to hook
      case 'draw-circuit':
        return checkCircuitAnswer(); // Use CircuitDrawer directly
    }
  };
  
  // ...
}
```

**Pros:**
- ✅ Reuses ALL business logic
- ✅ No new abstractions needed
- ✅ Utilities already pure and reusable

**Cons:**
- 😐 Some conditional logic in useScenario
- 😐 Three different validation paths

### Option B: Extract UI Fragments (COULD DO, BUT NOT "CORE")

Instead of "TruthTableCore", extract specific reusable JSX:

```tsx
// src/components/TruthTableGrid.tsx (NEW)
export function TruthTableGrid({
  inputs,
  truthTableData,
  intermediateExpressions,
  userAnswers,
  cellValidations,
  isAnswered,
  expertMode,
  showIntermediateColumns,
  onCellChange
}: TruthTableGridProps) {
  // Just the table rendering JSX
  return (
    <div className="overflow-x-auto">
      <table>...</table>
    </div>
  );
}

// src/components/TruthTable.tsx (MODIFIED)
export function TruthTable({ onScoreUpdate }) {
  const hookData = useTruthTable({ onScoreUpdate });
  
  return (
    <div>
      <ControlPanel {...controlPanelProps} />
      <CircuitDisplay />
      <TruthTableGrid {...hookData} /> {/* Extract this! */}
      <CheckAnswerButton />
    </div>
  );
}

// src/components/Scenario.tsx
export function Scenario({ onScoreUpdate }) {
  const { questionType, currentScenario } = useScenario({ onScoreUpdate });
  
  return (
    <div>
      <ControlPanel />
      <ScenarioCard {...currentScenario} />
      
      {questionType === 'truth-table' && (
        <TruthTableGrid {...scenarioHookData} /> {/* Reuse! */}
      )}
    </div>
  );
}
```

**Pros:**
- ✅ Reuses exact same rendering logic
- ✅ DRY for the table/input/canvas JSX
- ✅ Clear separation of concerns

**Cons:**
- 😐 Adds 3 new files (TruthTableGrid, ExpressionInput, CircuitCanvas)
- 😐 More components to maintain
- 🤔 Medium benefit - these JSX blocks aren't that complex

## Recommendation

### ✅ DO THIS:
1. **Reuse hooks and utilities directly** - They already contain all the logic
2. **Extract ControlPanel** - Already done! ✅
3. **Consider extracting UI fragments** - Only if they're complex enough to justify

### ❌ DON'T DO THIS:
1. **Don't create "Core" components** - They won't align with Scenario's UI needs
2. **Don't try to make existing components "fit"** - Scenario has different context requirements
3. **Don't over-abstract** - Three small JSX blocks might not need extraction

## Specific Plan for Scenario Mode

### Phase 1: Data & Hook (Most Important)
```
src/lib/scenarioData.ts         ← NEW: Scenario database
src/lib/useScenario.ts          ← NEW: Orchestrates existing hooks/utils
```

### Phase 2: Component (Straightforward)
```
src/components/Scenario.tsx     ← NEW: Uses ControlPanel + conditional rendering
src/routes/scenario.tsx         ← NEW: Route setup
```

### Phase 3: Optional UI Extraction (If worthwhile)
```
src/components/TruthTableGrid.tsx      ← MAYBE: Extract from TruthTable.tsx
src/components/ExpressionInputField.tsx ← MAYBE: Extract from ExpressionWriting.tsx
src/components/CircuitDrawCanvas.tsx    ← MAYBE: Extract from DrawCircuit.tsx
```

Then refactor both the original mode AND Scenario to use them.

## Example: Truth Table in Scenario

```tsx
// src/components/Scenario.tsx
export function Scenario({ onScoreUpdate }: ScenarioProps) {
  const {
    currentScenario,
    questionType,
    currentLevel,
    
    // Truth table state (when questionType === 'truth-table')
    truthTableData,
    inputs,
    intermediateExpressions,
    userAnswers,
    cellValidations,
    expertMode,
    showIntermediateColumns,
    isAnswered,
    
    // Methods
    checkAnswer,
    generateQuestion,
    setDifficulty,
    handleTruthTableCellChange,
    
  } = useScenario({ onScoreUpdate });
  
  return (
    <div className="flex flex-col gap-4">
      <ControlPanel
        difficulty={{...}}
        notation={{...}}
        onShuffle={generateQuestion}
        additionalControls={
          <div>Question Type: {questionType === 'expression' ? '✏️' : 
                              questionType === 'truth-table' ? '📊' : '⚡'}</div>
        }
      />
      
      {/* Scenario Context Card */}
      <div className="bg-stats-card-bg border-2 border-stats-card-border rounded-lg p-6">
        <h3 className="text-xl font-bold mb-3">{currentScenario.title}</h3>
        <p className="mb-4">{currentScenario.scenario}</p>
        
        <div className="space-y-1">
          <p className="font-semibold">Variables:</p>
          {Object.entries(currentScenario.inputs).map(([variable, meaning]) => (
            <p key={variable}>
              <span className="font-mono">{variable}</span>: {meaning}
            </p>
          ))}
        </div>
      </div>
      
      {/* Conditional Question Type Rendering */}
      {questionType === 'truth-table' && (
        <>
          <div className="text-center">
            <h2>Complete the truth table:</h2>
          </div>
          
          {/* Option A: Inline JSX (simple, straightforward) */}
          <div className="overflow-x-auto">
            <table>
              {/* Copy table structure from TruthTable.tsx */}
              {/* Use truthTableData, handleTruthTableCellChange from hook */}
            </table>
          </div>
          
          {/* Option B: Extracted component (cleaner, more abstraction) */}
          {/* <TruthTableGrid 
               data={truthTableData}
               inputs={inputs}
               onChange={handleTruthTableCellChange}
               {...otherProps}
             /> */}
        </>
      )}
      
      {questionType === 'expression' && (
        {/* Expression input field */}
      )}
      
      {questionType === 'draw-circuit' && (
        {/* Circuit canvas */}
      )}
      
      <Button onClick={checkAnswer}>Check Answer</Button>
    </div>
  );
}
```

## Final Answer

**No, creating "TruthTableCore" etc. does NOT make things easier.**

Instead:
1. ✅ Reuse the **hooks** (`useTruthTable`, etc.) - they contain the logic
2. ✅ Reuse the **utilities** (`truthTableUtils`, `expressionUtils`) - already pure
3. ✅ Reuse the **ControlPanel** - already extracted
4. 🤔 **Maybe** extract small UI fragments like `<TruthTableGrid />` if you want DRY
5. ❌ Don't create "Core" wrapper components - Scenario's UI context is too different

The current architecture with **hooks + utilities** is already perfectly set up for Scenario mode reuse!
