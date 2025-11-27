import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import type { Tag } from '../../services/bookmarks.service';

/**
 * TagAutocompleteInput component props
 */
export interface TagAutocompleteInputProps {
  /**
   * Input label
   */
  label?: string;
  /**
   * Currently selected tags
   */
  value: string[];
  /**
   * Callback when selected tags change
   */
  onChange: (tags: string[]) => void;
  /**
   * All available tags with counts
   */
  availableTags: Tag[];
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Maximum number of tags allowed
   */
  maxTags?: number;
  /**
   * Minimum characters to trigger search (default: 2)
   */
  minSearchChars?: number;
  /**
   * Debounce delay in milliseconds (default: 500)
   */
  debounceMs?: number;
}

/**
 * TagAutocompleteInput Component
 *
 * Input field with autocomplete suggestions and tag chips management.
 *
 * Features:
 * - Type to search for tags
 * - Autocomplete suggestions from second character
 * - Debounced search (500ms default)
 * - Click to select from dropdown
 * - Remove tags by clicking X on chips
 * - Keyboard navigation (Enter to select, Backspace to remove last)
 * - Shows tag counts in suggestions
 * - Prevents duplicates
 *
 * @example
 * ```tsx
 * <TagAutocompleteInput
 *   label="Filter by tags"
 *   value={selectedTags}
 *   onChange={setSelectedTags}
 *   availableTags={allTags}
 *   placeholder="Type to search tags..."
 * />
 * ```
 */
export function TagAutocompleteInput({
  label,
  value = [],
  onChange,
  availableTags = [],
  placeholder = 'Type to search tags...',
  disabled = false,
  maxTags,
  minSearchChars = 2,
  debounceMs = 500,
}: TagAutocompleteInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce the search input
  const debouncedSearch = useDebounce(inputValue, debounceMs);

  // Filter tags based on search
  const filteredTags = debouncedSearch.length >= minSearchChars
    ? availableTags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
          !value.includes(tag.name)
      )
    : [];

  // Calculate if dropdown should be open
  const shouldShowDropdown = filteredTags.length > 0 && inputValue.length >= minSearchChars;

  /**
   * Add a tag to the selected list
   */
  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim().toLowerCase();

    // Validate
    if (!trimmedTag) return;
    if (value.includes(trimmedTag)) return; // Prevent duplicates
    if (maxTags && value.length >= maxTags) return;

    // Add tag and clear input
    onChange([...value, trimmedTag]);
    setInputValue('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  /**
   * Remove a tag from the selected list
   */
  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  /**
   * Handle keyboard events
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredTags.length) {
        // Select highlighted tag
        addTag(filteredTags[highlightedIndex].name);
      } else if (inputValue.trim()) {
        // Add current input as tag
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      removeTag(value[value.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (shouldShowDropdown) {
        setHighlightedIndex((prev) =>
          prev < filteredTags.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (shouldShowDropdown) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
    } else if (e.key === 'Escape') {
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    }
  };

  /**
   * Handle tag selection from dropdown
   */
  const handleSelectTag = (tagName: string) => {
    addTag(tagName);
  };

  /**
   * Reset highlighted index when input changes
   */
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [inputValue]);

  const isMaxTagsReached = maxTags ? value.length >= maxTags : false;

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Container with chips and input */}
      <div className="relative">
        <div
          className={`flex flex-wrap gap-2 items-center w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0 focus-within:border-blue-500 focus-within:ring-blue-500 ${
            disabled ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'bg-white border-gray-300'
          }`}
        >
          {/* Selected Tag Chips */}
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
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={value.length === 0 ? placeholder : ''}
              disabled={disabled}
              className="flex-1 min-w-0 px-2 py-1 border-0 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {shouldShowDropdown && !disabled && (
          <div
            ref={dropdownRef}
            className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredTags.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No tags found
              </div>
            ) : (
              filteredTags.map((tag, index) => (
                <button
                  key={tag.name}
                  onClick={() => handleSelectTag(tag.name)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full px-3 py-2 text-left transition-colors flex items-center justify-between ${
                    index === highlightedIndex
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-sm font-medium">{tag.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {tag.count}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Helper text for search */}
        {!disabled && inputValue.length > 0 && inputValue.length < minSearchChars && (
          <p className="text-xs text-gray-500 mt-1">
            Type at least {minSearchChars} characters to search...
          </p>
        )}

        {/* Max tags warning */}
        {isMaxTagsReached && (
          <p className="text-sm text-amber-600 mt-1">
            Maximum {maxTags} tags reached
          </p>
        )}
      </div>
    </div>
  );
}

export default TagAutocompleteInput;
