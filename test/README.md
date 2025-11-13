# Test Suite

This directory contains the testing infrastructure and utilities for the Boolean Algebra Practice project.

## Test Setup

- **Framework:** Vitest (Jest-compatible API)
- **Component Testing:** React Testing Library
- **User Interaction:** @testing-library/user-event
- **Assertions:** Jest DOM matchers

## Files

- `setup.ts` - Global test configuration, mocks, and cleanup
- `test-utils.tsx` - Custom render function with providers (ThemeProvider, etc.)

## Running Tests

```bash
# Run all tests once
pnpm test:run

# Watch mode (runs tests on file changes)
pnpm test

# Run tests with UI
pnpm test:ui

# Type check
pnpm type-check
```

## Writing Tests

### Unit Tests (Pure Functions)

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '../myModule'

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })
})
```

### Component Tests

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, userEvent } from '@/test/test-utils'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Clicked')).toBeInTheDocument()
  })
})
```

### Hook Tests

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMyHook } from '../useMyHook'

describe('useMyHook', () => {
  it('should manage state correctly', () => {
    const { result } = renderHook(() => useMyHook())
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.count).toBe(1)
  })
})
```

## Best Practices

1. **Use descriptive test names** - What is being tested and what should happen
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **Test behavior, not implementation** - Test what the user sees/does
4. **Use semantic queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
5. **Clean up after tests** - Tests should not affect each other (handled automatically)

## Mocks Available

- `window.matchMedia` - For responsive design tests
- `localStorage` - Isolated per test, auto-cleared
- Custom render with `ThemeProvider` - Use imported `render` from test-utils

## Coverage

Coverage reports are generated in `coverage/` directory when running tests with coverage.

```bash
# Generate coverage report
pnpm test:run --coverage
```

Coverage excludes:
- `node_modules/`
- Test files themselves
- Type declaration files (`.d.ts`)
- Config files
- Mock data
- Auto-generated files (`routeTree.gen.ts`)
- Old template files (`old_*.tsx`)
