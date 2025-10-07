# Old Template Files

These files are from the **Data Units** site template and are kept for **reference only** during the migration process.

## Template Files (Marked with `old_` prefix)

### Components
- `src/components/old_CapacityCalculator.tsx`
- `src/components/old_FileSizeCalculator.tsx`
- `src/components/old_UnitConverter.tsx`
- `src/components/old_MultipleChoice.tsx`

### Routes
- `src/routes/old_capacitycalculator.tsx`
- `src/routes/old_filesize.tsx`
- `src/routes/old_unitconverter.tsx`
- `src/routes/old_multiplechoice.tsx`

## What to Use Them For

These files demonstrate:
- ✅ **Styling patterns** - How to use semantic CSS variables
- ✅ **Component structure** - Card layouts, form inputs, button styling
- ✅ **Tailwind patterns** - Responsive design, grid layouts
- ✅ **shadcn/ui usage** - Card, Input, Button components
- ✅ **Score integration** - How to use ScoreButton and StatsModal

## What NOT to Do

- ❌ Don't import these components into new code
- ❌ Don't try to run these routes (they won't work)
- ❌ Don't copy the quiz logic (Boolean Algebra is different)

## When to Delete

Delete these files when:
1. NameThat mode is fully implemented and styled
2. You've confirmed the styling approach works
3. All new Boolean Algebra modes are complete

---

**For AI Agents:** Look at these for styling reference, but implement Boolean Algebra game logic from `/legacy` folder.
