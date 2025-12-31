import { type HTMLAttributes, type JSX, type ReactNode } from 'react';

/**
 * Card component props
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Card content
   */
  children: ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Reusable Card Component
 * Generic card with padding and base styles
 *
 * @example
 * ```tsx
 * <Card>
 *   <h2>Title</h2>
 *   <p>Content goes here</p>
 * </Card>
 *
 * <Card className="max-w-md">
 *   Custom styled card
 * </Card>
 * ```
 */
export function Card({
  children,
  className = '',
  ...props
}: CardProps): JSX.Element {
  const baseStyles = 'bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg border border-gray-200 dark:border-gray-700 p-6';
  const cardStyles = `${baseStyles} ${className}`;

  return (
    <div className={cardStyles} {...props}>
      {children}
    </div>
  );
}

export default Card;
