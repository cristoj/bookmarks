/**
 * useBookmarks Hook
 *
 * Custom React Query hook for fetching bookmarks with infinite scrolling support.
 * Uses useInfiniteQuery to handle pagination automatically.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import bookmarksService, { type BookmarkFilters, type Bookmark } from '@services/bookmarks.service';

/**
 * Hook for fetching bookmarks with infinite scrolling
 *
 * Uses React Query's useInfiniteQuery to fetch bookmarks in pages,
 * supporting filters, search, and automatic pagination.
 *
 * @param filters - Optional filters for the bookmarks query
 * @returns Object with paginated data, loading state, and pagination functions
 *
 * @example
 * ```tsx
 * function BookmarksList() {
 *   const { data, fetchNextPage, hasNextPage, isLoading } = useBookmarks({
 *     tags: ['javascript'],
 *     limit: 20
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {data?.pages.map((page) =>
 *         page.data.map((bookmark) => (
 *           <BookmarkCard key={bookmark.id} bookmark={bookmark} />
 *         ))
 *       )}
 *       {hasNextPage && (
 *         <button onClick={() => fetchNextPage()}>Load More</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBookmarks(filters?: BookmarkFilters) {
  return useInfiniteQuery({
    queryKey: ['bookmarks', filters],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      return await bookmarksService.getAll({
        ...filters,
        lastDocId: pageParam,
      });
    },
    getNextPageParam: (lastPage) => {
      // Return the lastDocId if there are more pages, otherwise undefined
      return lastPage.hasMore ? lastPage.lastDocId : undefined;
    },
    initialPageParam: undefined,
  });
}

/**
 * Type helper for the data returned by useBookmarks
 * Provides type safety when accessing bookmark data
 */
export type UseBookmarksData = {
  pages: Array<{
    data: Bookmark[];
    lastDocId: string | null;
    hasMore: boolean;
  }>;
  pageParams: Array<string | undefined>;
};
