import { type JSX } from 'react';
import { BookmarkCard } from './BookmarkCard';
import { type Bookmark } from '../../services/bookmarks.service';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

/**
 * BookmarkGrid component props
 */
export interface BookmarkGridProps {
  /**
   * Array of bookmarks to display
   */
  bookmarks: Bookmark[];
  /**
   * Callback when edit button is clicked
   */
  onEdit: (bookmark: Bookmark) => void;
  /**
   * Callback when delete button is clicked
   */
  onDelete: (bookmarkId: string) => void;
  /**
   * Loading state - shows skeleton loaders
   */
  isLoading?: boolean;
  /**
   * Optional callback when a tag is clicked
   */
  onTagClick?: (tag: string) => void;
  /**
   * Number of skeleton loaders to show when loading
   * @default 6
   */
  skeletonCount?: number;
  /**
   * Callback to fetch next page (for infinite scroll)
   */
  fetchNextPage?: () => void;
  /**
   * Whether there are more pages to load
   */
  hasNextPage?: boolean;
  /**
   * Whether currently fetching next page
   */
  isFetchingNextPage?: boolean;
}

/**
 * Skeleton loader for BookmarkCard
 */
function BookmarkSkeleton(): JSX.Element {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden w-full max-w-[320px] mx-auto animate-pulse">
      {/* Screenshot Skeleton */}
      <div className="aspect-video bg-gray-200" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>

        {/* Tags Skeleton */}
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>

        {/* Buttons Skeleton */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
          <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState(): JSX.Element {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center space-y-3">
        <svg
          className="mx-auto h-24 w-24 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900">
          No bookmarks yet
        </h3>
        <p className="text-sm text-gray-500">
          Start saving your favorite links and they'll appear here
        </p>
      </div>
    </div>
  );
}

/**
 * BookmarkGrid Component
 *
 * Responsive grid layout for displaying bookmarks.
 *
 * Features:
 * - Responsive grid (1/2/3 columns based on screen size)
 * - Loading state with skeleton loaders
 * - Empty state when no bookmarks
 * - Infinite scroll support
 * - Consistent spacing and alignment
 *
 * Breakpoints:
 * - Mobile: 1 column
 * - Tablet (768px+): 2 columns
 * - Desktop (1024px+): 3 columns
 *
 * @example
 * ```tsx
 * // Basic usage
 * <BookmarkGrid
 *   bookmarks={bookmarks}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   isLoading={isLoading}
 *   onTagClick={handleTagClick}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With infinite scroll
 * <BookmarkGrid
 *   bookmarks={bookmarks}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   isLoading={isLoading}
 *   fetchNextPage={fetchNextPage}
 *   hasNextPage={hasNextPage}
 *   isFetchingNextPage={isFetchingNextPage}
 * />
 * ```
 */
export function BookmarkGrid({
  bookmarks,
  onEdit,
  onDelete,
  isLoading = false,
  onTagClick,
  skeletonCount = 6,
  fetchNextPage,
  hasNextPage = false,
  isFetchingNextPage = false,
}: BookmarkGridProps): JSX.Element {
  // Set up infinite scroll observer
  const observerRef = useInfiniteScroll(
    fetchNextPage || (() => {}),
    hasNextPage && !!fetchNextPage
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {/* Loading State */}
        {isLoading &&
          Array.from({ length: skeletonCount }).map((_, index) => (
            <BookmarkSkeleton key={`skeleton-${index}`} />
          ))}

        {/* Empty State */}
        {!isLoading && bookmarks.length === 0 && <EmptyState />}

        {/* Bookmark Cards */}
        {!isLoading &&
          bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onEdit={onEdit}
              onDelete={onDelete}
              onTagClick={onTagClick}
            />
          ))}
      </div>

      {/* Infinite Scroll Observer Element */}
      {!isLoading && fetchNextPage && (
        <div ref={observerRef} className="flex justify-center py-8">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg
                className="animate-spin h-5 w-5"
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
              <span className="text-sm font-medium">Loading more...</span>
            </div>
          )}

          {!isFetchingNextPage && !hasNextPage && bookmarks.length > 0 && (
            <div className="text-center text-gray-500">
              <p className="text-sm font-medium">No more bookmarks</p>
              <p className="text-xs mt-1">You've reached the end of the list</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BookmarkGrid;
