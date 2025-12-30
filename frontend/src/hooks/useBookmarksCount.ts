/**
 * useBookmarksCount Hook
 *
 * Custom React Query hook for fetching the count of bookmarks with filters.
 * Uses useQuery to handle automatic caching and refetching.
 */

import { useQuery } from '@tanstack/react-query';
import bookmarksService, { type BookmarkCountFilters } from '@services/bookmarks.service';

/**
 * Hook for fetching bookmarks count with optional filters
 *
 * Uses React Query's useQuery to fetch the count of bookmarks,
 * supporting the same filters as the bookmarks list (tags, search, dates).
 *
 * @param filters - Optional filters for the count query
 * @returns Object with count data, loading state, and error state
 *
 * @example
 * ```tsx
 * function BookmarkCounter() {
 *   const { data, isLoading, error } = useBookmarksCount({
 *     tags: ['javascript'],
 *     search: 'tutorial'
 *   });
 *
 *   if (isLoading) return <div>Loading count...</div>;
 *   if (error) return <div>Error loading count</div>;
 *
 *   return <div>Total: {data?.count || 0} bookmarks</div>;
 * }
 * ```
 */
export function useBookmarksCount(filters?: BookmarkCountFilters) {
  return useQuery({
    queryKey: ['bookmarks-count', filters],
    queryFn: async () => {
      return await bookmarksService.getCount(filters);
    },
    // Mantener el count en caché por 30 segundos para reducir llamadas innecesarias
    staleTime: 30000,
    // Invalidar cuando se invaliden los bookmarks
    // (React Query automáticamente invalida queries relacionadas)
  });
}
