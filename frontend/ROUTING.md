# Routing Documentation

## Overview

The application uses React Router v7 with a hierarchical provider structure to manage routing, authentication, and server state.

## Provider Hierarchy

The application is wrapped in the following provider hierarchy (from outermost to innermost):

```tsx
QueryClientProvider (React Query)
  ↓
BrowserRouter (React Router)
  ↓
AuthProvider (Authentication State)
  ↓
Routes (Application Routes)
```

### 1. QueryClientProvider

- **Purpose**: Manages server state, caching, and synchronization
- **Location**: `src/lib/queryClient.ts`
- **Configuration**:
  - `staleTime`: 5 minutes
  - `gcTime`: 10 minutes
  - `retry`: 1 attempt
  - `refetchOnWindowFocus`: true
  - `refetchOnReconnect`: true

### 2. BrowserRouter

- **Purpose**: Provides routing functionality using browser history API
- **Library**: `react-router-dom@7.9.6`

### 3. AuthProvider

- **Purpose**: Provides authentication state and methods
- **Location**: `src/contexts/AuthContext.tsx`
- **Provides**:
  - `user`: Current authenticated Firebase user
  - `loading`: Authentication check state
  - `login(email, password)`: Login method
  - `register(email, password, displayName)`: Registration method
  - `logout()`: Logout method
  - `forgotPassword(email)`: Password reset method

## Route Structure

### Protected Routes

Protected routes require authentication. Unauthenticated users are redirected to `/login`.

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Home` | Main bookmarks dashboard |

**Implementation**:
```tsx
<Route
  path="/"
  element={
    <ProtectedRoute>
      <Home />
    </ProtectedRoute>
  }
/>
```

### Public Routes

Public routes are accessible without authentication. Authenticated users are redirected to `/` (home).

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | `Login` | Login page |
| `/register` | `Register` | Registration page |
| `/forgot-password` | `ForgotPassword` | Password reset page |

**Implementation**:
```tsx
<Route
  path="/login"
  element={
    <PublicRoute>
      <Login />
    </PublicRoute>
  }
/>
```

### Error Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/404` | `NotFound` | 404 error page |
| `*` | Redirect to `/404` | Catch-all for unknown routes |

## Route Components

### ProtectedRoute

**Location**: `src/components/auth/ProtectedRoute.tsx`

**Features**:
- Redirects to `/login` if user is not authenticated
- Shows loading spinner while checking authentication
- Saves attempted location for post-login redirect
- Custom redirect path via `redirectTo` prop

**Usage**:
```tsx
<ProtectedRoute redirectTo="/login">
  <PrivateComponent />
</ProtectedRoute>
```

### PublicRoute

**Location**: `src/components/auth/ProtectedRoute.tsx`

**Features**:
- Redirects to `/` if user is already authenticated
- Shows loading spinner while checking authentication
- Redirects to saved location after login (if available)
- Custom redirect path via `redirectTo` prop

**Usage**:
```tsx
<PublicRoute redirectTo="/">
  <LoginComponent />
</PublicRoute>
```

## Loading States

### Initial Auth Check

When the app first loads, `AuthProvider` shows a full-screen loading spinner while checking authentication:

```tsx
<div className="min-h-screen flex items-center justify-center bg-gray-50">
  <div className="text-center">
    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
    <p className="mt-4 text-gray-600">Loading...</p>
  </div>
</div>
```

### Route-level Loading

Protected and Public routes also show loading states while authentication is being verified.

## Navigation Flow

### Unauthenticated User

1. User visits `/` (home)
2. `ProtectedRoute` checks authentication
3. No user found → Redirect to `/login`
4. User logs in successfully
5. Redirect back to `/` (or saved location)

### Authenticated User

1. User visits `/login`
2. `PublicRoute` checks authentication
3. User found → Redirect to `/`
4. User can access protected routes freely

### Unknown Routes

1. User visits `/unknown-route`
2. Catch-all route (`*`) matches
3. Navigate to `/404`
4. `NotFound` component displays 404 page

## Query Client Configuration

**Location**: `src/lib/queryClient.ts`

### Query Options

- **staleTime**: 5 minutes - Data is considered fresh for 5 minutes
- **gcTime**: 10 minutes - Inactive queries are garbage collected after 10 minutes
- **retry**: 1 - Failed queries retry once before failing
- **retryDelay**: Exponential backoff (1s, 2s, 4s, ..., max 30s)
- **refetchOnWindowFocus**: true - Refetch when window regains focus
- **refetchOnReconnect**: true - Refetch when internet reconnects
- **refetchOnMount**: false - Don't refetch if data is still fresh

### Mutation Options

- **retry**: 0 - Mutations are not retried (user must manually retry)
- **retryDelay**: Exponential backoff (if retry > 0)

### Helper Functions

```tsx
// Clear all cached queries (e.g., on logout)
clearQueryCache();

// Invalidate specific queries (e.g., after creating bookmark)
invalidateQueries(['bookmarks']);

// Create test client (for testing)
const testClient = createTestQueryClient();
```

## Security Considerations

### Route Protection

- All routes requiring authentication are wrapped in `<ProtectedRoute>`
- Authentication state is checked on every route change
- Firebase handles session persistence and token refresh

### Redirect Security

- Redirects preserve attempted location in router state
- Only internal routes are allowed for post-login redirect
- External URLs are not supported for security

### Token Management

- Firebase automatically handles token refresh
- Tokens are stored securely in browser storage
- `AuthProvider` listens to Firebase auth state changes

## Best Practices

### Adding New Routes

1. **Protected Route**:
```tsx
<Route
  path="/new-protected"
  element={
    <ProtectedRoute>
      <NewProtectedPage />
    </ProtectedRoute>
  }
/>
```

2. **Public Route**:
```tsx
<Route
  path="/new-public"
  element={
    <PublicRoute>
      <NewPublicPage />
    </PublicRoute>
  }
/>
```

3. **Unprotected Route** (rare):
```tsx
<Route path="/public-info" element={<PublicInfoPage />} />
```

### Navigation

Use React Router's `useNavigate` hook:

```tsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/target-route');
  };

  return <button onClick={handleClick}>Navigate</button>;
}
```

### Linking

Use React Router's `Link` component:

```tsx
import { Link } from 'react-router-dom';

function MyComponent() {
  return <Link to="/target-route">Go to Target</Link>;
}
```

## Troubleshooting

### Issue: Infinite redirect loop

**Cause**: Route protection misconfigured

**Solution**: Ensure `ProtectedRoute` wraps protected pages and `PublicRoute` wraps public pages

### Issue: User redirected to login after successful login

**Cause**: Authentication state not properly propagated

**Solution**: Check Firebase configuration and `AuthProvider` implementation

### Issue: Routes not updating

**Cause**: Browser router not properly configured

**Solution**: Ensure `BrowserRouter` wraps all routes in `App.tsx`

### Issue: Query data not persisting

**Cause**: Query client configuration issues

**Solution**: Check `gcTime` and `staleTime` in `queryClient.ts`

## File Structure

```
src/
├── App.tsx                           # Main app with routing
├── lib/
│   └── queryClient.ts                 # React Query configuration
├── contexts/
│   └── AuthContext.tsx                # Authentication provider
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx         # Route protection components
├── pages/
│   ├── Home.tsx                       # Protected home page
│   ├── Login.tsx                      # Public login page
│   ├── Register.tsx                   # Public register page
│   ├── ForgotPassword.tsx             # Public password reset page
│   └── NotFound.tsx                   # 404 page
└── services/
    ├── auth.service.ts                # Authentication service
    └── bookmarks.service.ts           # Bookmarks API service
```

## Testing

Due to the complex interaction between React Router, React Query, and Firebase Authentication, integration tests for routing can be challenging.

### Recommended Testing Approach

1. **Unit Tests**: Test individual route components
2. **Component Tests**: Test `ProtectedRoute` and `PublicRoute` logic
3. **E2E Tests**: Test full navigation flows with Cypress/Playwright
4. **Manual Testing**: Verify routing behavior in browser

### Manual Test Checklist

- [ ] Unauthenticated user redirected to login from `/`
- [ ] Authenticated user can access `/`
- [ ] Authenticated user redirected to `/` from `/login`
- [ ] Post-login redirect works correctly
- [ ] 404 page displays for unknown routes
- [ ] Browser back/forward buttons work correctly
- [ ] Direct URL access works for all routes
- [ ] Query cache persists across route changes
- [ ] Authentication state persists across page refreshes

## Future Enhancements

- [ ] Add nested routes for bookmark organization
- [ ] Implement route-based code splitting
- [ ] Add route transition animations
- [ ] Implement breadcrumb navigation
- [ ] Add route-level meta tags for SEO
- [ ] Implement route-based analytics tracking
