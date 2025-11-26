# Testing Guide - Bookmarks App Frontend

## 📋 Overview

This project uses **Vitest** and **React Testing Library** for testing. All tests are located alongside the files they test with a `.test.tsx` or `.test.ts` extension.

## 🚀 Running Tests

### Install Dependencies

```bash
cd frontend
npm install
```

### Test Commands

```bash
# Run tests in watch mode (recommended for development)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI (visual interface)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## 📊 Test Coverage

### Current Test Suite

#### ✅ **Common Components**
- **Button.test.tsx** (130 lines)
  - All variants (primary, secondary, danger, ghost)
  - All sizes (sm, md, lg)
  - Loading state
  - Disabled state
  - Click interactions
  - Full width
  - Custom props

- **Input.test.tsx** (160 lines)
  - Label rendering
  - Required indicator
  - Error messages
  - Helper text
  - Validation states
  - Input types (text, email, password)
  - Change events
  - Accessibility

#### ✅ **Authentication Service**
- **auth.service.test.ts** (180 lines)
  - User registration
  - User login
  - Logout
  - Password reset
  - Auth state changes
  - ID token retrieval
  - Error message mapping
  - Firestore document creation

#### ✅ **Authentication Forms**
- **LoginForm.test.tsx** (210 lines)
  - Form rendering
  - Email/password validation
  - Form submission
  - Error handling
  - Loading states
  - Navigation after login
  - Accessibility

### Test Statistics

```
Total Tests: 60+
Total Lines: ~680
Coverage Target: 80%+
```

## 🧪 Test Structure

### Typical Test File Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders component correctly', () => {
      // Test rendering
    });
  });

  describe('Interactions', () => {
    it('handles user interactions', async () => {
      // Test interactions
    });
  });

  describe('Edge Cases', () => {
    it('handles edge cases', () => {
      // Test edge cases
    });
  });
});
```

## 🔧 Mocks and Setup

### Firebase Mocks

All Firebase modules are automatically mocked in `src/test/setup.ts`:

```typescript
- firebase/app
- firebase/auth
- firebase/firestore
- firebase/storage
- firebase/functions
```

### Router Mocks

React Router is mocked to avoid navigation issues in tests:

```typescript
- useNavigate
- useLocation
- Link
- Navigate
```

### Custom Mocks

To mock a module in a specific test:

```typescript
vi.mock('@services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    // ... other methods
  },
}));
```

## 📝 Writing Tests

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders and interacts correctly', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(button).toHaveTextContent('Clicked');
  });
});
```

### Service Tests

```typescript
import { vi } from 'vitest';
import { myService } from './myService';

describe('myService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('performs operation successfully', async () => {
    const result = await myService.doSomething();
    expect(result).toBeDefined();
  });
});
```

### Testing Async Operations

```typescript
import { waitFor } from '@testing-library/react';

it('handles async operations', async () => {
  render(<AsyncComponent />);

  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

## 🎯 Best Practices

### 1. **Test User Behavior, Not Implementation**

```typescript
// ✅ Good - tests behavior
expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();

// ❌ Bad - tests implementation
expect(component.find('.submit-button')).toHaveLength(1);
```

### 2. **Use Proper Queries**

Priority order:
1. `getByRole` (most accessible)
2. `getByLabelText`
3. `getByPlaceholderText`
4. `getByText`
5. `getByTestId` (last resort)

```typescript
// ✅ Preferred
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);

// ❌ Avoid
screen.getByTestId('submit-button');
```

### 3. **Clean Up Between Tests**

```typescript
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

### 4. **Test Accessibility**

```typescript
it('has proper accessibility attributes', () => {
  render(<Input label="Email" required />);

  const input = screen.getByLabelText(/email/i);
  expect(input).toBeRequired();
  expect(input).toHaveAttribute('aria-required', 'true');
});
```

### 5. **Mock External Dependencies**

Always mock:
- API calls
- Firebase operations
- Router navigation
- Third-party libraries

## 🐛 Debugging Tests

### View Test UI

```bash
npm run test:ui
```

Opens a browser UI showing:
- All tests and their status
- Test output and console logs
- Coverage reports
- File dependencies

### Debug with Console Logs

```typescript
import { screen, debug } from '@testing-library/react';

it('debugs component', () => {
  render(<MyComponent />);

  // Print the entire DOM
  screen.debug();

  // Print specific element
  screen.debug(screen.getByRole('button'));
});
```

### Run Single Test File

```bash
# Run only LoginForm tests
npm test LoginForm

# Run with pattern
npm test -- auth
```

### Run Single Test

```typescript
// Use .only to run single test
it.only('runs only this test', () => {
  // ...
});

// Use .skip to skip a test
it.skip('skips this test', () => {
  // ...
});
```

## 📈 Coverage Reports

### Generate Coverage

```bash
npm run test:coverage
```

### View Coverage Report

Open `coverage/index.html` in your browser for detailed coverage information.

### Coverage Thresholds

Current targets:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## 🚨 Common Issues

### Issue: Tests timeout

**Solution:** Increase timeout in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds
  },
});
```

### Issue: Firebase mock not working

**Solution:** Check that mocks are defined in `src/test/setup.ts`

### Issue: Component not rendering

**Solution:** Wrap with necessary providers:

```typescript
import { AuthProvider } from '@contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

render(
  <BrowserRouter>
    <AuthProvider>
      <MyComponent />
    </AuthProvider>
  </BrowserRouter>
);
```

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## ✅ Pre-commit Checklist

Before committing:
- [ ] All tests pass: `npm run test:run`
- [ ] No console errors
- [ ] Coverage meets thresholds
- [ ] New features have tests
- [ ] Tests follow naming conventions

## 🎯 Next Steps

### Tests to Add

1. **RegisterForm.test.tsx**
   - Password matching validation
   - Display name validation
   - Form submission

2. **ForgotPasswordForm.test.tsx**
   - Email validation
   - Success message display
   - Navigation

3. **AuthContext.test.tsx**
   - Provider rendering
   - State management
   - Auth state changes

4. **ProtectedRoute.test.tsx**
   - Redirects when not authenticated
   - Renders children when authenticated
   - Loading states

5. **Integration Tests**
   - Complete login flow
   - Complete registration flow
   - Password reset flow

---

**Happy Testing! 🎉**
