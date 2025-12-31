import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import { queryClient } from './lib/queryClient';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { NotFound } from './pages/NotFound';
import type { JSX } from 'react';

/**
 * Main Application Component
 *
 * Sets up the application with routing, authentication, and query client.
 *
 * Architecture:
 * 1. QueryClientProvider - Provides React Query functionality
 * 2. BrowserRouter - Provides routing functionality
 * 3. AuthProvider - Provides authentication state and methods
 * 4. Routes - Defines application routes
 *
 * Route Structure:
 * - "/" - Protected home page (requires authentication)
 * - "/login" - Public login page (redirects if authenticated)
 * - "/register" - Public register page (redirects if authenticated)
 * - "/forgot-password" - Public password reset page
 * - "*" - 404 Not Found page
 *
 * @example
 * ```tsx
 * // In main.tsx
 * import { App } from './App';
 *
 * ReactDOM.createRoot(document.getElementById('root')!).render(
 *   <React.StrictMode>
 *     <App />
 *   </React.StrictMode>
 * );
 * ```
 */
export function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Protected Routes - Require Authentication */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />

              {/* Public Routes - Redirect if Authenticated */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />

              {/* 404 Not Found */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
