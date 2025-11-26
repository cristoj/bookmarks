import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authService } from '@services/auth.service';
import type { AuthContextType } from '@types';

/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * Wraps the application and provides authentication state
 *
 * @example
 * ```tsx
 * // In App.tsx or main.tsx
 * import { AuthProvider } from '@contexts/AuthContext';
 *
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <YourApp />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Subscribe to authentication state changes
     * This runs once when the component mounts and sets up a listener
     */
    const unsubscribe = authService.onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Login user with email and password
   *
   * @param email - User email
   * @param password - User password
   * @throws {Error} If login fails
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      await authService.login(email, password);
      // User state will be updated automatically by onAuthStateChanged
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  /**
   * Register new user with email, password, and display name
   *
   * @param email - User email
   * @param password - User password
   * @param displayName - User display name
   * @throws {Error} If registration fails
   */
  const register = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<void> => {
    try {
      setLoading(true);
      await authService.register(email, password, displayName);
      // User state will be updated automatically by onAuthStateChanged
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  /**
   * Logout current user
   *
   * @throws {Error} If logout fails
   */
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await authService.logout();
      // User state will be updated automatically by onAuthStateChanged
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  /**
   * Send password reset email
   *
   * @param email - User email
   * @throws {Error} If sending email fails
   */
  const forgotPassword = async (email: string): Promise<void> => {
    await authService.forgotPassword(email);
  };

  /**
   * Context value provided to consumers
   */
  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    forgotPassword,
  };

  // Don't render children until we've checked authentication status
  // This prevents flashing of login screen when user is already authenticated
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use authentication context
 *
 * @returns Authentication context value
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, login, logout } = useAuth();
 *
 *   if (user) {
 *     return (
 *       <div>
 *         <p>Welcome, {user.displayName}!</p>
 *         <button onClick={logout}>Logout</button>
 *       </div>
 *     );
 *   }
 *
 *   return <LoginForm onLogin={login} />;
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
