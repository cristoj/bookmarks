/**
 * useCreateBookmark Hook
 *
 * Custom React Query hook for creating bookmarks.
 * Uses useMutation to handle the create operation and automatically
 * invalidates the bookmarks query on success.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import bookmarksService, { type BookmarkData, type Bookmark } from '@services/bookmarks.service';
import { addTagsToCache } from '@/utils/tagsCache';

/**
 * Hook for creating a new bookmark
 *
 * Uses React Query's useMutation to handle bookmark creation.
 * Automatically invalidates the 'bookmarks' query on success
 * to refresh the bookmarks list.
 *
 * @returns Object with mutation function, loading state, and error
 *
 * @example
 * ```tsx
 * function CreateBookmarkForm() {
 *   const { mutate: createBookmark, isPending, error } = useCreateBookmark();
 *
 *   const handleSubmit = (data: BookmarkData) => {
 *     createBookmark(data, {
 *       onSuccess: (bookmark) => {
 *         console.log('Created bookmark:', bookmark.id);
 *         // Navigate or show success message
 *       }
 *     });
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <div>Error: {error.message}</div>}
 *       <input name="url" />
 *       <input name="title" />
 *       <button type="submit" disabled={isPending}>
 *         {isPending ? 'Creating...' : 'Create Bookmark'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useCreateBookmark() {
  const queryClient = useQueryClient();

  return useMutation<Bookmark, Error, BookmarkData>({
    mutationFn: async (data: BookmarkData) => {
      return await bookmarksService.create(data);
    },
    onSuccess: (bookmark) => {
      // Add tags to localStorage cache
      if (bookmark.tags && bookmark.tags.length > 0) {
        addTagsToCache(bookmark.tags);
      }

      // Invalidate and refetch bookmarks, count, and tags queries
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks-count'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error: Error) => {
      // Log error for debugging
      console.error('Failed to create bookmark:', error);
    },
  });
}
