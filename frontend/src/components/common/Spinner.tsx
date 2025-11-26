import { type JSX } from 'react';

/**
 * Spinner size types
 */
export type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * Spinner component props
 */
export interface SpinnerProps {
  /**
   * Spinner size
   * @default 'md'
   */
  size?: SpinnerSize;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Color class for the spinner
   * @default 'text-primary-500'
   */
  color?: string;
}

/**
 * Reusable Spinner Component
 * Simple loading spinner with size variants
 *
 * @example
 * ```tsx
 * <Spinner />
 *
 * <Spinner size="sm" />
 *
 * <Spinner size="lg" color="text-blue-500" />
 * ```
 */
export function Spinner({
  size = 'md',
  className = '',
  color = 'text-blue-500',
}: SpinnerProps): JSX.Element {
  // Size styles
  const sizeStyles: Record<SpinnerSize, string> = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const spinnerStyles = `animate-spin ${sizeStyles[size]} ${color} ${className}`;

  return (
    <svg
      className={spinnerStyles}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default Spinner;
