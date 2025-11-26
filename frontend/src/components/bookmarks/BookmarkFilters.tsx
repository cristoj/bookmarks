import React, { useState, useEffect, type JSX } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useDebounce } from '../../hooks/useDebounce';
import type { Tag } from '../../services/bookmarks.service';

/**
 * Filter values interface
 */
export interface FilterValues {
  search: string;
  tags: string[];
  dateFrom: string;
  dateTo: string;
}

/**
 * BookmarkFilters component props
 */
export interface BookmarkFiltersProps {
  /**
   * Current filter values
   */
  filters: FilterValues;
  /**
   * Callback when filters change
   */
  onFilterChange: (filters: FilterValues) => void;
  /**
   * Available tags with counts
   */
  availableTags: Tag[];
  /**
   * Enable sticky positioning when scrolling
   * @default false
   */
  sticky?: boolean;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * BookmarkFilters Component
 *
 * Advanced filtering component for bookmarks with search, tags, and date range.
 *
 * Features:
 * - Text search with 300ms debounce
 * - Multi-select tag filter with badges
 * - Date range selector (from/to)
 * - Clear all filters button
 * - Responsive layout (horizontal desktop, vertical mobile)
 * - Collapsible on mobile
 * - Optional sticky positioning
 * - Shows tag counts
 *
 * @example
 * ```tsx
 * function BookmarksPage() {
 *   const [filters, setFilters] = useState<FilterValues>({
 *     search: '',
 *     tags: [],
 *     dateFrom: '',
 *     dateTo: '',
 *   });
 *   const { data: tags } = useTags();
 *
 *   return (
 *     <BookmarkFilters
 *       filters={filters}
 *       onFilterChange={setFilters}
 *       availableTags={tags || []}
 *       sticky
 *     />
 *   );
 * }
 * ```
 */
export function BookmarkFilters({
  filters,
  onFilterChange,
  availableTags,
  sticky = false,
  className = '',
}: BookmarkFiltersProps): JSX.Element {
  // Local state for search input (before debouncing)
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounced search value (300ms)
  const debouncedSearch = useDebounce(searchInput, 300);

  // Mobile collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Tag selector dropdown state
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFilterChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch]);

  /**
   * Handle search input change
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  /**
   * Toggle tag selection
   */
  const toggleTag = (tagName: string) => {
    const newTags = filters.tags.includes(tagName)
      ? filters.tags.filter((t) => t !== tagName)
      : [...filters.tags, tagName];

    onFilterChange({ ...filters, tags: newTags });
  };

  /**
   * Remove a specific tag
   */
  const removeTag = (tagName: string) => {
    onFilterChange({
      ...filters,
      tags: filters.tags.filter((t) => t !== tagName),
    });
  };

  /**
   * Handle date from change
   */
  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, dateFrom: e.target.value });
  };

  /**
   * Handle date to change
   */
  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, dateTo: e.target.value });
  };

  /**
   * Clear date range
   */
  const clearDates = () => {
    onFilterChange({ ...filters, dateFrom: '', dateTo: '' });
  };

  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    setSearchInput('');
    onFilterChange({
      search: '',
      tags: [],
      dateFrom: '',
      dateTo: '',
    });
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters =
    filters.search ||
    filters.tags.length > 0 ||
    filters.dateFrom ||
    filters.dateTo;

  // Container classes
  const containerClasses = `
    bg-white border border-gray-200 rounded-lg shadow-sm p-4
    ${sticky ? 'sticky top-0 z-10' : ''}
    ${className}
  `.trim();

  return (
    <div className={containerClasses}>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex md:hidden w-full items-center justify-between text-gray-700 font-medium mb-3"
        aria-label={isCollapsed ? 'Show filters' : 'Hide filters'}
      >
        <span className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Filters
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
              {filters.tags.length + (filters.search ? 1 : 0) + (filters.dateFrom || filters.dateTo ? 1 : 0)}
            </span>
          )}
        </span>
        {isCollapsed ? (
          <ChevronDown className="w-5 h-5" />
        ) : (
          <ChevronUp className="w-5 h-5" />
        )}
      </button>

      {/* Filters Content */}
      <div className={`${isCollapsed ? 'hidden md:block' : 'block'}`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search Input */}
          <div className="md:col-span-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search in title or description..."
                value={searchInput}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                aria-label="Search bookmarks"
              />
            </div>
          </div>

          {/* Tag Selector */}
          <div className="md:col-span-4 relative">
            <div>
              <button
                onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center justify-between bg-white"
                aria-label="Select tags"
                aria-expanded={isTagDropdownOpen}
              >
                <span className="text-gray-700">
                  {filters.tags.length > 0
                    ? `${filters.tags.length} tag${filters.tags.length > 1 ? 's' : ''} selected`
                    : 'Select tags...'}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>

              {/* Tag Dropdown */}
              {isTagDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {availableTags.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No tags available</div>
                  ) : (
                    availableTags.map((tag) => (
                      <button
                        key={tag.name}
                        onClick={() => toggleTag(tag.name)}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                          filters.tags.includes(tag.name) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={filters.tags.includes(tag.name)}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                            aria-label={`Filter by tag ${tag.name}`}
                          />
                          <span className="text-sm text-gray-700">{tag.name}</span>
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {tag.count}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected Tags Badges */}
            {filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.tags.map((tagName) => (
                  <span
                    key={tagName}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700"
                  >
                    {tagName}
                    <button
                      type="button"
                      onClick={() => removeTag(tagName)}
                      className="ml-1.5 inline-flex items-center justify-center hover:bg-blue-200 rounded-full focus:outline-none"
                      aria-label={`Remove tag ${tagName}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Date Range */}
          <div className="md:col-span-3">
            <div className="flex flex-col gap-2">
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={handleDateFromChange}
                placeholder="From date"
                className="text-sm"
                aria-label="Filter from date"
              />
              <Input
                type="date"
                value={filters.dateTo}
                onChange={handleDateToChange}
                placeholder="To date"
                className="text-sm"
                aria-label="Filter to date"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-1 flex flex-col gap-2">
            {/* Clear Dates Button */}
            {(filters.dateFrom || filters.dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDates}
                className="whitespace-nowrap"
                title="Clear date range"
                aria-label="Clear date range"
              >
                <X className="w-4 h-4" />
              </Button>
            )}

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="secondary"
                size="sm"
                onClick={clearAllFilters}
                className="whitespace-nowrap md:whitespace-normal"
                aria-label="Clear all filters"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {isTagDropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setIsTagDropdownOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default BookmarkFilters;
