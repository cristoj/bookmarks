import React, { useState, type KeyboardEvent, forwardRef, useImperativeHandle } from 'react';
import { X } from 'lucide-react';

/**
 * TagInput component props
 */
export interface TagInputProps {
  /**
   * Input label
   */
  label?: string;
  /**
   * Current tags array
   */
  value: string[];
  /**
   * Callback when tags change
   */
  onChange: (tags: string[]) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Error message to display below input
   */
  error?: string;
  /**
   * Helper text to display below input (when no error)
   */
  helperText?: string;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Maximum number of tags allowed
   */
  maxTags?: number;
  /**
   * Required field
   */
  required?: boolean;
}

/**
 * TagInput Component
 *
 * Input field with tag chips management.
 * Features:
 * - Add tags by pressing Enter or comma
 * - Remove tags by clicking X
 * - Visual feedback for errors
 * - Maximum tags limit
 * - Duplicate prevention
 * - Tag trimming and validation
 *
 * @example
 * ```tsx
 * <TagInput
 *   label="Tags"
 *   value={tags}
 *   onChange={setTags}
 *   placeholder="Add tags..."
 *   helperText="Press Enter or comma to add a tag"
 *   maxTags={10}
 * />
 * ```
 */
export const TagInput = forwardRef<HTMLInputElement, TagInputProps>(
  (
    {
      label,
      value = [],
      onChange,
      placeholder = 'Add tags...',
      error,
      helperText,
      disabled = false,
      maxTags,
      required = false,
    },
    ref
  ) => {
    const [inputValue, setInputValue] = useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);
    const generatedId = React.useId();
    const inputId = `tag-input-${generatedId}`;

    // Expose the input ref to parent components
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    /**
     * Add a tag to the list
     */
    const addTag = (tag: string) => {
      const trimmedTag = tag.trim().toLowerCase();

      // Validate tag
      if (!trimmedTag) return;
      if (value.includes(trimmedTag)) return; // Prevent duplicates
      if (maxTags && value.length >= maxTags) return;

      // Add tag and clear input
      onChange([...value, trimmedTag]);
      setInputValue('');
    };

    /**
     * Remove a tag from the list
     */
    const removeTag = (tagToRemove: string) => {
      onChange(value.filter((tag) => tag !== tagToRemove));
    };

    /**
     * Handle keyboard events
     */
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
        // Remove last tag if input is empty and backspace is pressed
        removeTag(value[value.length - 1]);
      }
    };

    /**
     * Handle blur event
     */
    const handleBlur = () => {
      // Add current input value as tag on blur
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    };

    // Base input styles
    const baseStyles =
      'flex-1 min-w-0 px-2 py-1 border-0 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    // Container styles
    const containerStyles = error
      ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500'
      : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-500';

    const isMaxTagsReached = maxTags ? value.length >= maxTags : false;

    return (
      <div className="space-y-1">
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Tags and Input Container */}
        <div
          className={`flex flex-wrap gap-2 items-center w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0 ${containerStyles} ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          }`}
        >
          {/* Tag Chips */}
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1.5 inline-flex items-center justify-center hover:bg-blue-200 rounded-full focus:outline-none"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>
          ))}

          {/* Input Field */}
          {!isMaxTagsReached && (
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={value.length === 0 ? placeholder : ''}
              disabled={disabled}
              className={baseStyles}
            />
          )}
        </div>

        {/* Max tags warning */}
        {isMaxTagsReached && (
          <p className="text-sm text-amber-600">
            Maximum {maxTags} tags reached
          </p>
        )}

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

TagInput.displayName = 'TagInput';

export default TagInput;
