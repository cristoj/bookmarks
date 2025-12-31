import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import type { JSX } from 'react';

/**
 * Theme Toggle Button Component
 *
 * Displays a button with sun/moon icon that toggles between light and dark themes.
 * The icon changes based on the current effective theme.
 *
 * Features:
 * - Sun icon shown in light mode
 * - Moon icon shown in dark mode
 * - Accessible with proper ARIA labels
 * - Smooth transitions
 * - Consistent styling with app design
 *
 * @example
 * ```tsx
 * // In header or any component
 * <ThemeToggle />
 * ```
 */
export function ThemeToggle(): JSX.Element {
  const { effectiveTheme, setTheme } = useTheme();

  /**
   * Toggle between light and dark themes
   * When toggling, we explicitly set 'light' or 'dark' (not 'system')
   */
  const toggleTheme = () => {
    const newTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Select icon based on current effective theme
  const Icon = effectiveTheme === 'dark' ? Moon : Sun;
  const themeLabel = effectiveTheme === 'dark' ? 'dark' : 'light';

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      aria-label={`Current theme: ${themeLabel}. Click to toggle theme.`}
      title={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
      type="button"
    >
      <Icon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
    </button>
  );
}
