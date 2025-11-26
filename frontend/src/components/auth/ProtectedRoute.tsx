import { type JSX, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

/**
 * Props for ProtectedRoute component
 */
interface ProtectedRouteProps {
  /**
   * Children components to render if user is authenticated
   */
  children: ReactNode;
  /**
   * Optional redirect path when user is not authenticated
   * @default '/login'
   */
  redirectTo?: string;
}

/**
 * Protected Route Component
 * Redirects to login page if user is not authenticated
 * Shows loading spinner while checking authentication state
 *
 * @example
 * ```tsx
 * // In your router configuration
 * import { ProtectedRoute } from '@components/auth/ProtectedRoute';
 *
 * <Routes>
 *   <Route
 *     path="/"
 *     element={
 *       <ProtectedRoute>
 *         <HomePage />
 *       </ProtectedRoute>
 *     }
 *   />
 *   <Route path="/login" element={<LoginPage />} />
 * </Routes>
 * ```
 *
 * @example
 * ```tsx
 * // With custom redirect path
 * <ProtectedRoute redirectTo="/signin">
 *   <DashboardPage />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps): JSX.Element {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  // Save the attempted location so we can redirect back after login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
}

/**
 * Public Route Component (opposite of ProtectedRoute)
 * Redirects to home page if user is already authenticated
 * Useful for login/register pages
 *
 * @example
 * ```tsx
 * // In your router configuration
 * import { PublicRoute } from '@components/auth/ProtectedRoute';
 *
 * <Routes>
 *   <Route
 *     path="/login"
 *     element={
 *       <PublicRoute>
 *         <LoginPage />
 *       </PublicRoute>
 *     }
 *   />
 *   <Route
 *     path="/register"
 *     element={
 *       <PublicRoute>
 *         <RegisterPage />
 *       </PublicRoute>
 *     }
 *   />
 * </Routes>
 * ```
 */
export function PublicRoute({
  children,
  redirectTo = '/',
}: ProtectedRouteProps): JSX.Element {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if user is already authenticated
  // Try to redirect to the page they were trying to access before login
  if (user) {
    const from = (location.state as any)?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  // User is not authenticated, render children (login/register form)
  return <>{children}</>;
}

export default ProtectedRoute;
