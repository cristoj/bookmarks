import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookmarkFilters, type FilterValues } from './BookmarkFilters';
import type { Tag } from '../../services/bookmarks.service';

// Mock tags data
const mockTags: Tag[] = [
  { name: 'javascript', count: 15, updatedAt: '2024-01-01' },
  { name: 'react', count: 10, updatedAt: '2024-01-02' },
  { name: 'typescript', count: 8, updatedAt: '2024-01-03' },
  { name: 'css', count: 5, updatedAt: '2024-01-04' },
];

// Initial filter state
const initialFilters: FilterValues = {
  search: '',
  tags: [],
  dateFrom: '',
  dateTo: '',
};

describe('BookmarkFilters Component', () => {
  let onFilterChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onFilterChange = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with all filter elements', () => {
      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      // Check for search input
      expect(screen.getByPlaceholderText(/search in title or description/i)).toBeInTheDocument();

      // Check for tag selector
      expect(screen.getByText(/select tags/i)).toBeInTheDocument();

      // Check for date inputs (by aria-label)
      expect(screen.getByLabelText(/filter from date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter to date/i)).toBeInTheDocument();
    });

    it('renders with sticky positioning when sticky prop is true', () => {
      const { container } = render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
          sticky
        />
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('sticky');
    });

    it('applies custom className', () => {
      const { container } = render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
          className="custom-class"
        />
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('custom-class');
    });
  });

  describe('Search Functionality', () => {
    it('updates search input value immediately', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search in title or description/i) as HTMLInputElement;

      await user.type(searchInput, 'test');

      expect(searchInput.value).toBe('test');
    });

    it('debounces search with 300ms delay', async () => {
      const user = userEvent.setup();

      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search in title or description/i);

      await user.type(searchInput, 'test');

      // Should not call onFilterChange immediately
      expect(onFilterChange).not.toHaveBeenCalled();

      // Wait for debounce (300ms)
      await waitFor(
        () => {
          expect(onFilterChange).toHaveBeenCalledWith({
            ...initialFilters,
            search: 'test',
          });
        },
        { timeout: 1000 }
      );
    });

    it('cancels previous debounce on rapid typing', async () => {
      const user = userEvent.setup();

      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search in title or description/i);

      await user.type(searchInput, 'test');

      // Wait for debounce to complete
      await waitFor(
        () => {
          // Should only be called once with the final value
          expect(onFilterChange).toHaveBeenCalledTimes(1);
          expect(onFilterChange).toHaveBeenCalledWith({
            ...initialFilters,
            search: 'test',
          });
        },
        { timeout: 1000 }
      );
    });

    it('displays search icon', () => {
      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      // Search icon should be present (lucide-react renders as svg)
      const searchInput = screen.getByPlaceholderText(/search in title or description/i);
      const container = searchInput.parentElement;
      expect(container?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Tag Selection', () => {
    it('opens tag dropdown when selector is clicked', async () => {
      const user = userEvent.setup();

      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      const tagSelector = screen.getByText(/select tags/i);
      await user.click(tagSelector);

      // All tags should be visible
      mockTags.forEach((tag) => {
        expect(screen.getByText(tag.name)).toBeInTheDocument();
        expect(screen.getByText(tag.count.toString())).toBeInTheDocument();
      });
    });

    it('closes tag dropdown when clicked outside', async () => {
      const user = userEvent.setup();

      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      // Open dropdown
      const tagSelector = screen.getByText(/select tags/i);
      await user.click(tagSelector);

      expect(screen.getByText('javascript')).toBeInTheDocument();

      // Click outside (on the overlay)
      const overlay = document.querySelector('.fixed.inset-0');
      if (overlay) {
        await user.click(overlay as HTMLElement);
      }

      // Dropdown should be closed
      await waitFor(() => {
        expect(screen.queryByText('javascript')).not.toBeInTheDocument();
      });
    });

    it('adds tag when selected from dropdown', async () => {
      const user = userEvent.setup();

      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      // Open dropdown
      await user.click(screen.getByText(/select tags/i));

      // Click on a tag
      await user.click(screen.getByText('javascript'));

      expect(onFilterChange).toHaveBeenCalledWith({
        ...initialFilters,
        tags: ['javascript'],
      });
    });

    it('removes tag when deselected from dropdown', async () => {
      const user = userEvent.setup();

      const filtersWithTag: FilterValues = {
        ...initialFilters,
        tags: ['javascript'],
      };

      render(
        <BookmarkFilters
          filters={filtersWithTag}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      // Open dropdown
      await user.click(screen.getByText(/1 tag selected/i));

      // Click on the checkbox in the dropdown to deselect
      const checkbox = screen.getByLabelText('Filter by tag javascript');
      await user.click(checkbox);

      expect(onFilterChange).toHaveBeenCalledWith({
        ...initialFilters,
        tags: [],
      });
    });

    it('displays selected tags as badges', () => {
      const filtersWithTags: FilterValues = {
        ...initialFilters,
        tags: ['javascript', 'react'],
      };

      render(
        <BookmarkFilters
          filters={filtersWithTags}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      // Check for badges
      const badges = screen.getAllByRole('button', { name: /remove tag/i });
      expect(badges).toHaveLength(2);
    });

    it('removes tag when badge X button is clicked', async () => {
      const user = userEvent.setup();

      const filtersWithTags: FilterValues = {
        ...initialFilters,
        tags: ['javascript', 'react'],
      };

      render(
        <BookmarkFilters
          filters={filtersWithTags}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      // Click remove button on first tag
      const removeButton = screen.getByRole('button', { name: /remove tag javascript/i });
      await user.click(removeButton);

      expect(onFilterChange).toHaveBeenCalledWith({
        ...initialFilters,
        tags: ['react'],
      });
    });

    it('updates selector text based on selected tags count', () => {
      const { rerender } = render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      expect(screen.getByText(/select tags/i)).toBeInTheDocument();

      // Update with one tag
      rerender(
        <BookmarkFilters
          filters={{ ...initialFilters, tags: ['javascript'] }}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      expect(screen.getByText(/1 tag selected/i)).toBeInTheDocument();

      // Update with multiple tags
      rerender(
        <BookmarkFilters
          filters={{ ...initialFilters, tags: ['javascript', 'react'] }}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      expect(screen.getByText(/2 tags selected/i)).toBeInTheDocument();
    });

    it('shows "No tags available" when availableTags is empty', async () => {
      const user = userEvent.setup();

      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={[]}
        />
      );

      // Open dropdown
      await user.click(screen.getByText(/select tags/i));

      expect(screen.getByText(/no tags available/i)).toBeInTheDocument();
    });
  });

  describe('Date Range Selection', () => {
    it('updates dateFrom when date is selected', async () => {
      const user = userEvent.setup();

      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      const dateFromInput = screen.getByLabelText(/filter from date/i);
      await user.type(dateFromInput, '2024-01-01');

      expect(onFilterChange).toHaveBeenCalledWith({
        ...initialFilters,
        dateFrom: '2024-01-01',
      });
    });

    it('updates dateTo when date is selected', async () => {
      const user = userEvent.setup();

      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      const dateToInput = screen.getByLabelText(/filter to date/i);
      await user.type(dateToInput, '2024-12-31');

      expect(onFilterChange).toHaveBeenCalledWith({
        ...initialFilters,
        dateTo: '2024-12-31',
      });
    });

    it('shows clear dates button when dates are set', () => {
      const filtersWithDates: FilterValues = {
        ...initialFilters,
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      };

      render(
        <BookmarkFilters
          filters={filtersWithDates}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      expect(screen.getByLabelText(/clear date range/i)).toBeInTheDocument();
    });

    it('clears both dates when clear dates button is clicked', async () => {
      const user = userEvent.setup();

      const filtersWithDates: FilterValues = {
        ...initialFilters,
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      };

      render(
        <BookmarkFilters
          filters={filtersWithDates}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      const clearDatesButton = screen.getByLabelText(/clear date range/i);
      await user.click(clearDatesButton);

      expect(onFilterChange).toHaveBeenCalledWith({
        ...initialFilters,
        dateFrom: '',
        dateTo: '',
      });
    });
  });

  describe('Clear All Filters', () => {
    it('shows clear all button when any filter is active', () => {
      const filtersWithSearch: FilterValues = {
        ...initialFilters,
        search: 'test',
      };

      render(
        <BookmarkFilters
          filters={filtersWithSearch}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
    });

    it('does not show clear all button when no filters are active', () => {
      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      expect(screen.queryByRole('button', { name: /clear all filters/i })).not.toBeInTheDocument();
    });

    it('clears all filters when clear all button is clicked', async () => {
      const user = userEvent.setup();

      const activeFilters: FilterValues = {
        search: 'test',
        tags: ['javascript', 'react'],
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      };

      render(
        <BookmarkFilters
          filters={activeFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      const clearAllButton = screen.getByRole('button', { name: /clear all filters/i });
      await user.click(clearAllButton);

      expect(onFilterChange).toHaveBeenCalledWith(initialFilters);
    });
  });

  describe('Mobile Collapse', () => {
    it('renders mobile toggle button', () => {
      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      // Mobile toggle button should be present (initially showing "Hide filters" since it's expanded)
      const toggleButton = screen.getByLabelText(/hide filters/i);
      expect(toggleButton).toBeInTheDocument();
    });

    it('toggles filters visibility on mobile', async () => {
      const user = userEvent.setup();

      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      // Initially showing "Hide filters" since it's not collapsed
      const toggleButton = screen.getByLabelText(/hide filters/i);

      // Initially visible (not collapsed)
      const searchInput = screen.getByPlaceholderText(/search in title or description/i);
      expect(searchInput).toBeVisible();

      // Click to collapse
      await user.click(toggleButton);

      // After collapsing, button aria-label should change to "Show filters"
      expect(screen.getByLabelText(/show filters/i)).toBeInTheDocument();
    });

    it('shows active filter count badge on mobile when filters are active', () => {
      const activeFilters: FilterValues = {
        search: 'test',
        tags: ['javascript', 'react'],
        dateFrom: '2024-01-01',
        dateTo: '',
      };

      render(
        <BookmarkFilters
          filters={activeFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      // Badge should show count of active filter types (search + 2 tags + dateFrom = 4)
      const badge = screen.getByText('4');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-primary-500');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-labels for all interactive elements', () => {
      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      expect(screen.getByLabelText(/search bookmarks/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select tags/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter from date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter to date/i)).toBeInTheDocument();
    });

    it('has proper aria-expanded attribute for tag dropdown', async () => {
      const user = userEvent.setup();

      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      const tagSelector = screen.getByLabelText(/select tags/i);

      expect(tagSelector).toHaveAttribute('aria-expanded', 'false');

      await user.click(tagSelector);

      expect(tagSelector).toHaveAttribute('aria-expanded', 'true');
    });

    it('checkbox inputs have proper labels in tag dropdown', async () => {
      const user = userEvent.setup();

      render(
        <BookmarkFilters
          filters={initialFilters}
          onFilterChange={onFilterChange}
          availableTags={mockTags}
        />
      );

      await user.click(screen.getByLabelText(/select tags/i));

      mockTags.forEach((tag) => {
        expect(screen.getByLabelText(`Filter by tag ${tag.name}`)).toBeInTheDocument();
      });
    });
  });
});
