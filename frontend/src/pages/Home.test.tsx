import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './Home';
import * as useBookmarksHook from '../hooks/useBookmarks';
import * as useTagsHook from '../hooks/useTags';
import * as useCreateBookmarkHook from '../hooks/useCreateBookmark';
import * as useUpdateBookmarkHook from '../hooks/useUpdateBookmark';
import * as useDeleteBookmarkHook from '../hooks/useDeleteBookmark';
import type { Bookmark, Tag } from '../services/bookmarks.service';
import { renderWithProviders } from '../test/test-utils';

// Mock data
const mockBookmarks: Bookmark[] = [
  {
    id: '1',
    url: 'https://example.com',
    title: 'Example Bookmark',
    description: 'This is an example',
    tags: ['javascript', 'react'],
    folderId: null,
    screenshotUrl: 'https://example.com/screenshot.jpg',
    screenshotStatus: 'completed',
    userId: 'user1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    url: 'https://example2.com',
    title: 'Second Bookmark',
    description: 'Another bookmark',
    tags: ['typescript'],
    folderId: null,
    screenshotUrl: null,
    screenshotStatus: 'pending',
    userId: 'user1',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

const mockTags: Tag[] = [
  { name: 'javascript', count: 15, updatedAt: '2024-01-01' },
  { name: 'react', count: 10, updatedAt: '2024-01-02' },
  { name: 'typescript', count: 8, updatedAt: '2024-01-03' },
];

// Helper function to render component with QueryClient and Router
function renderWithQueryClient(component: React.ReactElement) {
  return renderWithProviders(component);
}

describe('Home Component', () => {
  let mockUseBookmarks: ReturnType<typeof vi.fn>;
  let mockUseTags: ReturnType<typeof vi.fn>;
  let mockCreateMutate: ReturnType<typeof vi.fn>;
  let mockUpdateMutate: ReturnType<typeof vi.fn>;
  let mockDeleteMutate: ReturnType<typeof vi.fn>;
  let mockFetchNextPage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetchNextPage = vi.fn();
    mockCreateMutate = vi.fn();
    mockUpdateMutate = vi.fn();
    mockDeleteMutate = vi.fn();

    // Default mock implementations
    mockUseBookmarks = vi.fn(() => ({
      data: {
        pages: [
          {
            data: mockBookmarks,
            lastDocId: null,
            hasMore: false,
          },
        ],
        pageParams: [undefined],
      },
      isLoading: false,
      error: null,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
    }));

    mockUseTags = vi.fn(() => ({
      data: mockTags,
      isLoading: false,
      error: null,
    }));

    // Mock hooks
    vi.spyOn(useBookmarksHook, 'useBookmarks').mockImplementation(mockUseBookmarks);
    vi.spyOn(useTagsHook, 'useTags').mockImplementation(mockUseTags);
    vi.spyOn(useCreateBookmarkHook, 'useCreateBookmark').mockReturnValue({
      mutate: mockCreateMutate,
      isPending: false,
      error: null,
    } as any);
    vi.spyOn(useUpdateBookmarkHook, 'useUpdateBookmark').mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
      error: null,
    } as any);
    vi.spyOn(useDeleteBookmarkHook, 'useDeleteBookmark').mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the Home page with header', () => {
      renderWithQueryClient(<Home />);

      expect(screen.getByRole('heading', { name: /bookmarks/i })).toBeInTheDocument();
      expect(screen.getByText(/2 bookmarks/i)).toBeInTheDocument();
    });

    it('renders BookmarkFilters component', () => {
      renderWithQueryClient(<Home />);

      expect(screen.getByPlaceholderText(/search in title or description/i)).toBeInTheDocument();
      expect(screen.getByText(/select tags/i)).toBeInTheDocument();
    });

    it('renders BookmarkGrid with bookmarks', () => {
      renderWithQueryClient(<Home />);

      expect(screen.getByText('Example Bookmark')).toBeInTheDocument();
      expect(screen.getByText('Second Bookmark')).toBeInTheDocument();
    });

    it('renders new bookmark buttons for both desktop and mobile', () => {
      renderWithQueryClient(<Home />);

      const buttons = screen.getAllByRole('button');
      const newBookmarkButtons = buttons.filter(
        (btn) =>
          btn.textContent?.includes('New Bookmark') ||
          btn.getAttribute('aria-label') === 'Create new bookmark'
      );
      expect(newBookmarkButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Loading States', () => {
    it('shows loading state when bookmarks are loading', () => {
      mockUseBookmarks.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      renderWithQueryClient(<Home />);

      // BookmarkGrid should show skeleton loaders
      expect(screen.queryByText('Example Bookmark')).not.toBeInTheDocument();
    });

    it('shows manage your saved links when no bookmarks loaded yet', () => {
      mockUseBookmarks.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      renderWithQueryClient(<Home />);

      expect(screen.getByText(/manage your saved links/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when bookmarks fail to load', () => {
      const errorMessage = 'Failed to fetch bookmarks';
      mockUseBookmarks.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error(errorMessage),
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      renderWithQueryClient(<Home />);

      expect(screen.getByText(/failed to load bookmarks/i)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('updates filters when search input changes', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithQueryClient(<Home />);

      const searchInput = screen.getByPlaceholderText(/search in title or description/i);
      await user.type(searchInput, 'test');

      expect(searchInput).toHaveValue('test');

      // Wait for debounce and check if useBookmarks was called with search filter
      await waitFor(
        () => {
          const lastCall = mockUseBookmarks.mock.calls[mockUseBookmarks.mock.calls.length - 1];
          expect(lastCall[0]).toMatchObject({ search: 'test' });
        },
        { timeout: 500 }
      );
    });

    it('updates filters when tags are selected', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithQueryClient(<Home />);

      // Open tag dropdown
      const tagButton = screen.getByText(/select tags/i);
      await user.click(tagButton);

      // Select a tag
      const jsTag = screen.getByRole('button', { name: /filter by tag javascript/i });
      await user.click(jsTag);

      await waitFor(() => {
        const lastCall = mockUseBookmarks.mock.calls[mockUseBookmarks.mock.calls.length - 1];
        expect(lastCall[0]).toMatchObject({ tags: ['javascript'] });
      });
    });

    it('adds tag to filters when tag is clicked in bookmark', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithQueryClient(<Home />);

      // Find and click a tag in the bookmark card
      const tagButtons = screen.getAllByText('javascript');
      const bookmarkTag = tagButtons.find(
        (el) => el.classList.contains('cursor-pointer') || el.tagName.toLowerCase() === 'button'
      );

      if (bookmarkTag) {
        await user.click(bookmarkTag);

        await waitFor(() => {
          const lastCall = mockUseBookmarks.mock.calls[mockUseBookmarks.mock.calls.length - 1];
          expect(lastCall[0]).toMatchObject({ tags: ['javascript'] });
        });
      }
    });
  });

  describe('Create Bookmark', () => {
    it('opens create modal when new bookmark button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithQueryClient(<Home />);

      const buttons = screen.getAllByRole('button');
      const newButton = buttons.find((btn) => btn.textContent?.includes('New Bookmark'));

      if (newButton) {
        await user.click(newButton);
      }

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Create Bookmark' })).toBeInTheDocument();
    });

    it('calls create mutation when form is submitted', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithQueryClient(<Home />);

      // Open create modal
      const buttons = screen.getAllByRole('button');
      const newButton = buttons.find((btn) => btn.textContent?.includes('New Bookmark'));

      if (newButton) {
        await user.click(newButton);
      }

      // Fill form
      const modal = screen.getByRole('dialog');
      const urlInput = within(modal).getByLabelText(/url/i);
      const titleInput = within(modal).getByLabelText(/title/i);

      await user.type(urlInput, 'https://newsite.com');
      await user.type(titleInput, 'New Site');

      // Submit form
      const submitButton = within(modal).getByRole('button', { name: /create bookmark/i });
      await user.click(submitButton);

      expect(mockCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://newsite.com',
          title: 'New Site',
        }),
        expect.any(Object)
      );
    });

    it('closes modal after successful creation', async () => {
      const user = userEvent.setup({ delay: null });

      // Mock successful creation
      mockCreateMutate.mockImplementation((_data, options) => {
        options.onSuccess?.();
      });

      renderWithQueryClient(<Home />);

      // Open and submit form
      const buttons = screen.getAllByRole('button');
      const newButton = buttons.find((btn) => btn.textContent?.includes('New Bookmark'));

      if (newButton) {
        await user.click(newButton);
      }

      const modal = screen.getByRole('dialog');
      const urlInput = within(modal).getByLabelText(/url/i);
      const titleInput = within(modal).getByLabelText(/title/i);

      await user.type(urlInput, 'https://newsite.com');
      await user.type(titleInput, 'New Site');

      const submitButton = within(modal).getByRole('button', { name: /create bookmark/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Bookmark', () => {
    it('opens edit modal when edit button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithQueryClient(<Home />);

      // Find all Edit buttons and click the first one
      const editButtons = screen.getAllByRole('button', { name: /editar bookmark/i });
      await user.click(editButtons[0]);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Edit Bookmark' })).toBeInTheDocument();
    });

    it('calls update mutation when edit form is submitted', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithQueryClient(<Home />);

      // Click edit on first bookmark
      const editButtons = screen.getAllByRole('button', { name: /editar bookmark/i });
      await user.click(editButtons[0]);

      // Update title
      const modal = screen.getByRole('dialog');
      const titleInput = within(modal).getByLabelText(/title/i);

      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      // Submit form
      const submitButton = within(modal).getByRole('button', { name: /update bookmark/i });
      await user.click(submitButton);

      expect(mockUpdateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          bookmarkId: '1',
          data: expect.objectContaining({
            title: 'Updated Title',
          }),
        }),
        expect.any(Object)
      );
    });

    it('closes modal after successful update', async () => {
      const user = userEvent.setup({ delay: null });

      // Mock successful update
      mockUpdateMutate.mockImplementation((_data, options) => {
        options.onSuccess?.();
      });

      renderWithQueryClient(<Home />);

      // Open and submit edit form
      const editButtons = screen.getAllByRole('button', { name: /editar bookmark/i });
      await user.click(editButtons[0]);

      const modal = screen.getByRole('dialog');
      const submitButton = within(modal).getByRole('button', { name: /update bookmark/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Bookmark', () => {
    it('opens delete confirmation modal when delete button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithQueryClient(<Home />);

      // Find all Delete buttons and click the first one
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar bookmark/i });
      await user.click(deleteButtons[0]);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Delete Bookmark' })).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete this bookmark/i)).toBeInTheDocument();
    });

    it('shows bookmark details in delete confirmation', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithQueryClient(<Home />);

      const deleteButtons = screen.getAllByRole('button', { name: /eliminar bookmark/i });
      await user.click(deleteButtons[0]);

      const modal = screen.getByRole('dialog');
      expect(within(modal).getByText('Example Bookmark')).toBeInTheDocument();
      expect(within(modal).getByText('https://example.com')).toBeInTheDocument();
    });

    it('calls delete mutation when confirmed', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithQueryClient(<Home />);

      // Open delete modal
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar bookmark/i });
      await user.click(deleteButtons[0]);

      // Confirm delete
      const modal = screen.getByRole('dialog');
      const confirmButton = within(modal).getAllByRole('button', { name: /delete/i })[0];
      await user.click(confirmButton);

      expect(mockDeleteMutate).toHaveBeenCalledWith('1', expect.any(Object));
    });

    it('closes modal when cancel is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithQueryClient(<Home />);

      // Open delete modal
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar bookmark/i });
      await user.click(deleteButtons[0]);

      // Click cancel
      const modal = screen.getByRole('dialog');
      const cancelButton = within(modal).getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('closes modal after successful deletion', async () => {
      const user = userEvent.setup({ delay: null });

      // Mock successful deletion
      mockDeleteMutate.mockImplementation((_id, options) => {
        options.onSuccess?.();
      });

      renderWithQueryClient(<Home />);

      // Open and confirm delete
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar bookmark/i });
      await user.click(deleteButtons[0]);

      const modal = screen.getByRole('dialog');
      const confirmButton = within(modal).getAllByRole('button', { name: /delete/i })[0];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Infinite Scroll', () => {
    it('passes fetchNextPage to BookmarkGrid', () => {
      mockUseBookmarks.mockReturnValue({
        data: {
          pages: [{ data: mockBookmarks, lastDocId: 'doc1', hasMore: true }],
          pageParams: [undefined],
        },
        isLoading: false,
        error: null,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: false,
      });

      renderWithQueryClient(<Home />);

      // BookmarkGrid should have received fetchNextPage
      expect(mockFetchNextPage).toBeDefined();
    });

    it('shows loading indicator when fetching next page', () => {
      mockUseBookmarks.mockReturnValue({
        data: {
          pages: [{ data: mockBookmarks, lastDocId: 'doc1', hasMore: true }],
          pageParams: [undefined],
        },
        isLoading: false,
        error: null,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: true,
      });

      renderWithQueryClient(<Home />);

      expect(screen.getByText(/loading more/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no bookmarks exist', () => {
      mockUseBookmarks.mockReturnValue({
        data: {
          pages: [{ data: [], lastDocId: null, hasMore: false }],
          pageParams: [undefined],
        },
        isLoading: false,
        error: null,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      renderWithQueryClient(<Home />);

      expect(screen.getByText(/no bookmarks yet/i)).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('closes modal when pressing ESC key', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithQueryClient(<Home />);

      // Open modal
      const buttons = screen.getAllByRole('button');
      const newButton = buttons.find((btn) => btn.textContent?.includes('New Bookmark'));

      if (newButton) {
        await user.click(newButton);
      }

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Press ESC
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('closes modal when clicking close button in header', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithQueryClient(<Home />);

      // Open modal
      const buttons = screen.getAllByRole('button');
      const newButton = buttons.find((btn) => btn.textContent?.includes('New Bookmark'));

      if (newButton) {
        await user.click(newButton);
      }

      // Click close button
      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });
});
