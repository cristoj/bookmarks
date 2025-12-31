import { createContext, useContext, useEffect, useState, type JSX, type ReactNode } from 'react';

/**
 * Theme types
 */
export type Theme = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

/**
 * Theme context type
 */
export interface ThemeContextType {
  /** Current theme setting (light, dark, or system) */
  theme: Theme;
  /** Resolved theme after considering system preference */
  effectiveTheme: EffectiveTheme;
  /** Set the theme */
  setTheme: (theme: Theme) => void;
}

/**
 * Theme provider props
 */
interface ThemeProviderProps {
  children: ReactNode;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// LocalStorage key
const STORAGE_KEY = 'theme-preference';

/**
 * Get system theme preference
 */
function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Get initial theme from localStorage or default to system
 */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch (error) {
    console.error('Error reading theme from localStorage:', error);
  }

  return 'system';
}

/**
 * Apply theme to document
 */
function applyTheme(effectiveTheme: EffectiveTheme): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  if (effectiveTheme === 'dark') {
    if (!root.classList.contains('dark')) {
      root.classList.add('dark');
    }
  } else {
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
    }
  }
}

/**
 * Theme Provider Component
 *
 * Provides theme context to the application.
 * Manages theme state, system preference detection, and localStorage persistence.
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() => {
    const initialTheme = getInitialTheme();
    return initialTheme === 'system' ? getSystemTheme() : initialTheme;
  });

  // Handle theme changes
  useEffect(() => {
    // Determine effective theme
    const newEffectiveTheme = theme === 'system' ? getSystemTheme() : theme;

    setEffectiveTheme(newEffectiveTheme);

    // Apply theme to document
    applyTheme(newEffectiveTheme);

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  }, [theme]);

  // Listen for system theme changes (only when theme is 'system')
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newEffectiveTheme = e.matches ? 'dark' : 'light';
      setEffectiveTheme(newEffectiveTheme);
      applyTheme(newEffectiveTheme);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    effectiveTheme,
    setTheme: setThemeState,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 *
 * @throws Error if used outside ThemeProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, effectiveTheme, setTheme } = useTheme();
 *
 *   return (
 *     <button onClick={() => setTheme('dark')}>
 *       Current theme: {effectiveTheme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
