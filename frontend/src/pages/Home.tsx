import { useState, useMemo, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout/Header';
import { BookmarkFilters, type FilterValues } from '../components/bookmarks/BookmarkFilters';
import { BookmarkGrid } from '../components/bookmarks/BookmarkGrid';
import { BookmarkForm } from '../components/bookmarks/BookmarkForm';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { useBookmarks } from '../hooks/useBookmarks';
import { useTags } from '../hooks/useTags';
import { useCreateBookmark } from '../hooks/useCreateBookmark';
import { useUpdateBookmark } from '../hooks/useUpdateBookmark';
import { useDeleteBookmark } from '../hooks/useDeleteBookmark';
import type { Bookmark, BookmarkData } from '../services/bookmarks.service';

/**
 * Modal mode type
 */
type ModalMode = 'create' | 'edit' | 'delete' | null;

/**
 * Modal state interface
 */
interface ModalState {
  mode: ModalMode;
  bookmark?: Bookmark;
}

/**
 * Home Page Component
 *
 * Main page of the bookmarks application.
 * Displays a list of bookmarks with filtering, search, and CRUD operations.
 *
 * Features:
 * - Advanced filtering (search, tags, date range)
 * - Infinite scroll pagination
 * - Create/Edit/Delete bookmarks
 * - Tag-based navigation
 * - Loading states and error handling
 * - Empty states
 * - Responsive design
 * - Toast notifications (via mutation callbacks)
 *
 * @example
 * ```tsx
 * import { Home } from './pages/Home';
 *
 * function App() {
 *   return <Home />;
 * }
 * ```
 */
export function Home(): JSX.Element {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Filter state
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    tags: [],
    dateFrom: '',
    dateTo: '',
  });

  // Modal state
  const [modalState, setModalState] = useState<ModalState>({
    mode: null,
    bookmark: undefined,
  });

  // Fetch data using hooks
  const {
    data: bookmarksData,
    isLoading: isLoadingBookmarks,
    error: bookmarksError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBookmarks({
    search: filters.search || undefined,
    tags: filters.tags.length > 0 ? filters.tags : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    limit: 12,
  });

  const { data: tags = [], isLoading: _isLoadingTags } = useTags();

  // Mutations
  const createBookmarkMutation = useCreateBookmark();
  const updateBookmarkMutation = useUpdateBookmark();
  const deleteBookmarkMutation = useDeleteBookmark();

  // Flatten bookmarks from pages
  const bookmarks = useMemo(() => {
    if (!bookmarksData?.pages) return [];
    return (bookmarksData.pages as Array<{ data: Bookmark[] }>).flatMap((page) => page.data);
  }, [bookmarksData]);

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  /**
   * Open create modal
   */
  const handleOpenCreateModal = () => {
    setModalState({ mode: 'create', bookmark: undefined });
  };

  /**
   * Open edit modal
   */
  const handleOpenEditModal = (bookmark: Bookmark) => {
    setModalState({ mode: 'edit', bookmark });
  };

  /**
   * Open delete confirmation modal
   */
  const handleOpenDeleteModal = (bookmarkId: string) => {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (bookmark) {
      setModalState({ mode: 'delete', bookmark });
    }
  };

  /**
   * Close modal
   */
  const handleCloseModal = () => {
    setModalState({ mode: null, bookmark: undefined });
  };

  /**
   * Handle bookmark form submission (create or edit)
   */
  const handleSaveBookmark = (data: BookmarkData) => {
    if (modalState.mode === 'create') {
      createBookmarkMutation.mutate(data, {
        onSuccess: () => {
          handleCloseModal();
        },
        onError: (error) => {
          console.error('Error creating bookmark:', error);
        },
      });
    } else if (modalState.mode === 'edit' && modalState.bookmark) {
      updateBookmarkMutation.mutate(
        {
          bookmarkId: modalState.bookmark.id,
          data,
        },
        {
          onSuccess: () => {
            handleCloseModal();
          },
          onError: (error) => {
            console.error('Error updating bookmark:', error);
          },
        }
      );
    }
  };

  /**
   * Handle delete confirmation
   */
  const handleConfirmDelete = () => {
    if (modalState.bookmark) {
      deleteBookmarkMutation.mutate(modalState.bookmark.id, {
        onSuccess: () => {
          handleCloseModal();
        },
        onError: (error) => {
          console.error('Error deleting bookmark:', error);
        },
      });
    }
  };

  /**
   * Handle tag click - add to filters
   */
  const handleTagClick = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      setFilters({
        ...filters,
        tags: [...filters.tags, tag],
      });
    }
  };

  // Calculate loading states
  const isInitialLoading = isLoadingBookmarks && !bookmarksData;
  const isSaving =
    createBookmarkMutation.isPending || updateBookmarkMutation.isPending;
  const isDeleting = deleteBookmarkMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with logout */}
      <Header
        user={user}
        onLogout={handleLogout}
        onNewBookmark={handleOpenCreateModal}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-20">
        {/* Filters */}
        <div className="mb-6">
          <BookmarkFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            availableTags={tags}
            sticky={false}
          />
        </div>

        {/* Error State */}
        {bookmarksError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Failed to load bookmarks
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {bookmarksError.message || 'An unexpected error occurred'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bookmarks Grid */}
        <BookmarkGrid
          bookmarks={bookmarks}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          onTagClick={handleTagClick}
          isLoading={isInitialLoading}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      </main>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={handleOpenCreateModal}
        className="md:hidden fixed bottom-6 right-6 bg-blue-500 text-white rounded-full p-4 shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-30"
        aria-label="Create new bookmark"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalState.mode === 'create' || modalState.mode === 'edit'}
        onClose={handleCloseModal}
        title={modalState.mode === 'create' ? 'Create Bookmark' : 'Edit Bookmark'}
        size="lg"
      >
        <BookmarkForm
          bookmark={modalState.bookmark}
          onSave={handleSaveBookmark}
          onCancel={handleCloseModal}
          isLoading={isSaving}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={modalState.mode === 'delete'}
        onClose={handleCloseModal}
        title="Delete Bookmark"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this bookmark?
          </p>
          {modalState.bookmark && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="font-medium text-gray-900 truncate">
                {modalState.bookmark.title}
              </p>
              <p className="text-sm text-gray-600 truncate mt-1">
                {modalState.bookmark.url}
              </p>
            </div>
          )}
          <p className="text-sm text-gray-600">
            This action cannot be undone.
          </p>

          {/* Delete Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isDeleting}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmDelete}
              loading={isDeleting}
              disabled={isDeleting}
              fullWidth
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Home;
