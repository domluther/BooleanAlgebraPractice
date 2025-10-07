# ControlPanel Component Usage Examples

## Overview
The `ControlPanel` component provides a consistent, reusable control panel for all game modes with:
- ✅ Difficulty selector
- ✅ Notation toggle (Words/Symbols)
- ✅ Shuffle button (🎲)
- ✅ Slot for mode-specific controls

## Example 1: NameThat (Simple)

**Before:**
```tsx
{/* Control Panel */}
<div className="p-4 rounded-lg border-2 bg-stats-card-bg border-stats-card-border">
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
    {/* Difficulty Selector */}
    <div className="flex items-center gap-3">
      <label htmlFor={difficultySelectId}>Difficulty:</label>
      <select id={difficultySelectId} value={currentLevel} onChange={...}>
        <option value={1}>Easy</option>
        <option value={2}>Medium</option>
        <option value={3}>Hard</option>
      </select>
    </div>
    {/* Notation Toggle */}
    <div className="flex items-center gap-3">
      <span>Words</span>
      <Switch checked={...} onCheckedChange={...} />
      <span>Symbols</span>
    </div>
    {/* Regenerate Button */}
    <Button variant="outline" onClick={generateNewQuestion}>🎲</Button>
  </div>
</div>
```

**After:**
```tsx
import { ControlPanel } from "@/components/ControlPanel";

<ControlPanel
  difficulty={{
    value: currentLevel,
    onChange: (level) => setLevel(level as 1 | 2 | 3),
    options: [
      [1, "Easy"],
      [2, "Medium"],
      [3, "Hard"]
    ]
  }}
  notation={{
    value: notationType,
    onChange: handleNotationToggle
  }}
  onShuffle={generateNewQuestion}
/>
```

**Lines saved:** ~45 lines → ~15 lines = **30 lines saved**

---

## Example 2: DrawCircuit (With Additional Controls)

**Before:**
```tsx
{/* Control Panel */}
<div className="p-4 rounded-lg border-2 bg-stats-card-bg border-stats-card-border">
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
    {/* Difficulty Selector */}
    <div className="flex items-center gap-3">...</div>
    
    {/* Help Toggle - MODE SPECIFIC */}
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={helpEnabled} onChange={toggleHelp} />
        Show expression so far
      </label>
    </div>
    
    {/* Notation Toggle */}
    <div className="flex items-center gap-3">...</div>
    
    {/* Random Button */}
    <Button>🎲</Button>
  </div>
</div>
```

**After:**
```tsx
<ControlPanel
  difficulty={{
    value: currentLevel,
    onChange: (level) => setDifficulty(level as DrawCircuitDifficulty),
    options: Object.entries(DIFFICULTY_LABELS).map(([value, label]) => 
      [Number(value), label]
    )
  }}
  notation={{
    value: notationType,
    onChange: handleNotationToggle
  }}
  onShuffle={handleRandomQuestion}
  additionalControls={
    <div className="flex items-center gap-2">
      <label className="flex items-center gap-2 text-sm text-stats-label whitespace-nowrap cursor-pointer">
        <input
          type="checkbox"
          checked={helpEnabled}
          onChange={() => toggleHelp()}
          className="h-4 w-4 rounded border-checkbox-label-border text-stats-points focus:ring-2 focus:ring-ring cursor-pointer"
        />
        Show expression so far
      </label>
    </div>
  }
/>
```

**Benefits:**
- Consistent styling automatically applied
- Help toggle rendered in the middle (proper flow)
- Still maintains mode-specific functionality

---

## Example 3: TruthTable (Multiple Additional Controls)

**After:**
```tsx
<ControlPanel
  difficulty={{
    value: currentLevel,
    onChange: (level) => setLevel(level as TruthTableDifficulty),
    options: [
      [1, "Easy"],
      [2, "Medium"],
      [3, "Hard"],
      [4, "Expert"],
      [5, "A-Level"]
    ]
  }}
  notation={{
    value: notationType,
    onChange: handleNotationToggle
  }}
  onShuffle={generateNewQuestion}
  additionalControls={
    <>
      {/* Show Intermediate Columns Toggle */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-stats-label whitespace-nowrap cursor-pointer">
          <input
            type="checkbox"
            checked={showIntermediateColumns}
            onChange={(e) => setShowIntermediateColumns(e.target.checked)}
            className="h-4 w-4 rounded border-checkbox-label-border text-stats-points"
          />
          Show intermediate columns
        </label>
      </div>
      
      {/* Expert Mode Toggle */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-stats-label whitespace-nowrap cursor-pointer">
          <input
            type="checkbox"
            checked={expertMode}
            onChange={(e) => setExpertMode(e.target.checked)}
            className="h-4 w-4 rounded border-checkbox-label-border text-stats-points"
          />
          Expert mode (3× points)
        </label>
      </div>
    </>
  }
/>
```

**Benefits:**
- Two mode-specific toggles easily integrated
- Consistent spacing and styling
- Proper responsive layout handled automatically

---

## Example 4: ExpressionWriting (Simple, 5 Levels)

**After:**
```tsx
<ControlPanel
  difficulty={{
    value: currentLevel,
    onChange: (level) => setLevel(level),
    options: [
      [1, "Easy"],
      [2, "Medium"],
      [3, "Hard"],
      [4, "Expert"],
      [5, "A-Level"]
    ]
  }}
  notation={{
    value: notationType,
    onChange: handleNotationToggle
  }}
  onShuffle={generateNewQuestion}
/>
```

---

## Example 5: Scenario Mode (Future)

**Proposed Usage:**
```tsx
<ControlPanel
  difficulty={{
    value: currentLevel,
    onChange: (level) => setDifficulty(level as 1 | 2 | 3 | 4),
    options: [
      [1, "Easy"],
      [2, "Medium"],
      [3, "Hard"],
      [4, "A-Level"]
    ]
  }}
  notation={{
    value: notationType,
    onChange: handleNotationToggle
  }}
  onShuffle={generateQuestion}
  additionalControls={
    <div className="text-sm text-stats-label font-medium">
      Question Type: {questionType === 'expression' ? '✏️ Expression' : 
                      questionType === 'truth-table' ? '📊 Truth Table' : 
                      '⚡ Circuit'}
    </div>
  }
/>
```

---

## API Reference

### Props

#### `difficulty` (required)
```typescript
interface DifficultyConfig {
  value: number;                        // Current difficulty level
  onChange: (level: number) => void;    // Callback when changed
  options: Array<[number, string]>;     // [[1, "Easy"], [2, "Medium"], ...]
}
```

#### `notation` (optional)
```typescript
interface NotationConfig {
  value: NotationType;                  // "word" | "symbol"
  onChange: (checked: boolean) => void; // Callback when toggled
}
```

#### `showShuffleButton` (optional, default: `true`)
```typescript
boolean
```

#### `onShuffle` (optional, required if `showShuffleButton` is true)
```typescript
() => void
```

#### `additionalControls` (optional)
```typescript
ReactNode
```
Any JSX to render between difficulty selector and notation toggle. Perfect for mode-specific checkboxes, radio buttons, or status displays.

---

## Benefits

### 1. **Consistency**
- All modes have identical control panel styling
- Semantic CSS variables applied consistently
- Responsive behavior identical across modes

### 2. **Maintainability**
- Change control panel styling in ONE place
- Add new features (e.g., dark mode indicator) to all modes at once
- Bug fixes apply to all modes automatically

### 3. **Code Reduction**
- ~30-45 lines saved per component
- 4 existing modes × 35 lines = **~140 lines removed**
- 1 new component = **~130 lines added**
- **Net savings: ~10 lines** (but much better organized!)

### 4. **Type Safety**
- TypeScript interfaces ensure correct usage
- IntelliSense for all props
- Compile-time validation of difficulty options

### 5. **Flexibility**
- `additionalControls` slot allows full customization
- Can be positioned logically (between difficulty and notation)
- No restrictions on what can be added

### 6. **Future-Proofing**
- Scenario mode (coming next) can use it immediately
- Easy to add global features (e.g., "Reset all progress" button)
- Easy to add mode-specific features without breaking other modes

---

## Migration Checklist

- [ ] Create `ControlPanel.tsx` component ✅
- [ ] Export from `components/index.ts` ✅
- [ ] Refactor NameThat to use ControlPanel
- [ ] Refactor ExpressionWriting to use ControlPanel
- [ ] Refactor TruthTable to use ControlPanel
- [ ] Refactor DrawCircuit to use ControlPanel
- [ ] Test all modes still work correctly
- [ ] Update MIGRATION_GUIDE.md

---

## Testing Checklist

For each refactored component, verify:
- [ ] Difficulty selector changes level correctly
- [ ] Notation toggle switches between Words/Symbols
- [ ] Shuffle button generates new question
- [ ] Mode-specific controls (if any) still work
- [ ] Responsive layout works on mobile
- [ ] Keyboard navigation works
- [ ] Focus styles applied correctly
- [ ] Screen reader labels work
