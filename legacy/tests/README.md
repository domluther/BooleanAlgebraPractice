# Boolean Algebra Expression Tests

This directory contains comprehensive tests for the expression utilities to ensure that Boolean expression variations and normalization work correctly.

## Test Files

- **`expression-variations.test.js`** - Tests that equivalent Boolean expressions are correctly recognized as valid variations
- **`normalization.test.js`** - Tests that expression normalization works correctly
- **`run-tests.js`** - Test runner that executes all tests

## Running Tests

To run all tests:

```bash
node tests/run-tests.js
```

To run individual test files:

```bash
node tests/expression-variations.test.js
node tests/normalization.test.js
```

## Test Categories

### Expression Variations Tests

These tests verify that the `generateAllAcceptedAnswers` function generates correct variations for different types of Boolean expressions:

1. **NOT Parentheses Placement** - Ensures NOT expressions use correct parentheses format
2. **NOT Expression Commutative Equivalence** - Tests commutative properties with NOT
3. **Double Parentheses Around NOT** - Handles extra parentheses around NOT expressions
4. **Complex Nested NOT Expressions** - Tests deeply nested NOT expressions
5. **Multiple NOT Operations** - Tests expressions with multiple NOT operators
6. **Mixed AND/OR with NOT** - Tests combinations of all operators
7. **Outer Parentheses Around Entire Expression** - Tests expressions wrapped in outer parentheses
8. **Outer Parentheses Complex Expressions** - Tests complex expressions with outer parentheses

### Normalization Tests

These tests verify that the `normalizeExpression` function correctly normalizes equivalent expressions to the same canonical form:

1. **Space Normalization** - Handles various spacing patterns
2. **Parentheses Normalization** - Normalizes parentheses spacing
3. **NOT Double Parentheses** - Removes redundant parentheses around NOT
4. **NOT Expression Formats** - Handles various NOT expression formats
5. **Complex Mixed Normalization** - Tests complex expressions with multiple issues
6. **Outer Parentheses Around Entire Expression** - Tests removal of outer parentheses
7. **Outer Parentheses Complex Expressions** - Tests complex expressions with outer parentheses
8. **Outer Parentheses Single Variable** - Tests single variables with outer parentheses

## Test Issues Covered

The tests cover specific issues that were identified and fixed:

1. **Issue #1**: NOT parentheses were incorrectly placed as `(NOT expr)` instead of `NOT (expr)`
2. **Issue #2**: Expressions like `U = B OR (NOT (A AND H))` weren't recognized as equivalent to `U = (NOT (H AND A)) OR B`
3. **Issue #3**: Double parentheses around NOT expressions like `Y = F OR ((NOT D) AND G)` weren't handled properly
4. **Issue #4**: Outer parentheses around entire expressions like `Q = (NOT A)` weren't recognized as equivalent to `Q = NOT A`

## Adding New Tests

To add new test cases:

1. **For expression variations**: Add a new test using `testSuite.addTest()` in `expression-variations.test.js`
2. **For normalization**: Add tests using `testSuite.addEquivalenceTest()` or `testSuite.addTransformTest()` in `normalization.test.js`

Example:
```javascript
testSuite.addTest(
    'New Test Name',
    'Base Expression = A AND B',
    [
        'Expected Accepted Answer 1',
        'Expected Accepted Answer 2'
    ]
);
```

## Continuous Testing

These tests should be run:
- Before committing changes to expression utilities
- After fixing any new expression-related bugs
- As part of any CI/CD pipeline

This ensures that fixing new issues doesn't break previously working functionality.
