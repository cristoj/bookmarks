import { LoginForm } from '@components/auth/LoginForm';
import type { JSX } from 'react';

/**
 * Login Page
 * Displays the login form with a centered, responsive layout
 *
 * @example
 * ```tsx
 * // In your router
 * <Route path="/login" element={<Login />} />
 * ```
 */
export function Login(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Optional: Logo or branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="flex justify-center">
          <div className="bg-blue-500 text-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>
        </div>
        <h1 className="mt-6 text-center text-2xl font-bold text-gray-900">
          Bookmarks App
        </h1>
      </div>

      {/* Login Form */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <LoginForm />
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Organize and manage your favorite web pages
        </p>
      </div>
    </div>
  );
}

export default Login;
