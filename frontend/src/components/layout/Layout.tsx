import { type JSX, type ReactNode } from 'react';
import { Header } from './Header';
import { type User as FirebaseUser } from 'firebase/auth';

/**
 * Layout component props
 */
export interface LayoutProps {
  /** Content to render in the main area */
  children: ReactNode;
  /** Currently authenticated user (optional) */
  user?: FirebaseUser | null;
  /** Logout callback function (optional) */
  onLogout?: () => void;
  /** New bookmark callback function (optional) */
  onNewBookmark?: () => void;
  /** Quick search callback function (optional) */
  onSearch?: (query: string) => void;
  /** Hide header (optional) */
  hideHeader?: boolean;
}

/**
 * Main Layout Component
 * Provides consistent layout structure with header and main content area
 *
 * Features:
 * - Fixed header with proper spacing
 * - Responsive max-width container
 * - Proper padding and spacing
 * - Optional header visibility
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Layout user={user} onLogout={handleLogout}>
 *   <YourContent />
 * </Layout>
 *
 * // With all features
 * <Layout
 *   user={user}
 *   onLogout={handleLogout}
 *   onNewBookmark={handleNewBookmark}
 *   onSearch={handleSearch}
 * >
 *   <YourContent />
 * </Layout>
 *
 * // Without header (e.g., login page)
 * <Layout hideHeader>
 *   <LoginForm />
 * </Layout>
 * ```
 */
export function Layout({
  children,
  user,
  onLogout,
  onNewBookmark,
  onSearch,
  hideHeader = false,
}: LayoutProps): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      {!hideHeader && user && onLogout && (
        <Header
          user={user}
          onLogout={onLogout}
          onNewBookmark={onNewBookmark}
          onSearch={onSearch}
        />
      )}

      {/* Main Content Area */}
      <main
        className={`w-full ${!hideHeader ? 'pt-16' : ''}`}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
