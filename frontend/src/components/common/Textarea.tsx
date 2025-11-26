import React, { type TextareaHTMLAttributes, forwardRef } from 'react';

/**
 * Textarea component props
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Textarea label
   */
  label?: string;
  /**
   * Error message to display below textarea
   */
  error?: string;
  /**
   * Helper text to display below textarea (when no error)
   */
  helperText?: string;
  /**
   * Additional class for the textarea container
   */
  containerClassName?: string;
}

/**
 * Reusable Textarea Component
 * Supports labels, error messages, helper text, and all standard textarea props
 *
 * @example
 * ```tsx
 * <Textarea
 *   label="Description"
 *   placeholder="Enter description"
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 *   rows={4}
 * />
 *
 * <Textarea
 *   label="Bio"
 *   error="Bio is too short"
 * />
 *
 * <Textarea
 *   label="Notes"
 *   helperText="Maximum 500 characters"
 * />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      className = '',
      containerClassName = '',
      required,
      rows = 3,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    // Base textarea styles
    const baseStyles =
      'w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed resize-y';

    // Normal and error states
    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';

    // Combine all styles
    const textareaStyles = `${baseStyles} ${stateStyles} ${className}`;

    return (
      <div className={`space-y-1 ${containerClassName}`}>
        {/* Label */}
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Textarea field */}
        <textarea
          ref={ref}
          id={textareaId}
          className={textareaStyles}
          required={required}
          rows={rows}
          {...props}
        />

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-500 flex items-start">
            <svg
              className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Helper text (only shown when no error) */}
        {!error && helperText && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
