/**
 * useDeleteBookmark Hook
 *
 * Custom React Query hook for deleting bookmarks.
 * Uses useMutation to handle the delete operation and automatically
 * invalidates the bookmarks query on success.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import bookmarksService, { type SuccessResponse } from '@services/bookmarks.service';

/**
 * Hook for deleting a bookmark
 *
 * Uses React Query's useMutation to handle bookmark deletion.
 * Automatically invalidates the 'bookmarks' query on success
 * to refresh the bookmarks list. Also removes the associated
 * screenshot from Storage.
 *
 * @returns Object with mutation function, loading state, and error
 *
 * @example
 * ```tsx
 * function BookmarkCard({ bookmarkId }: { bookmarkId: string }) {
 *   const { mutate: deleteBookmark, isPending } = useDeleteBookmark();
 *
 *   const handleDelete = () => {
 *     if (confirm('Are you sure you want to delete this bookmark?')) {
 *       deleteBookmark(bookmarkId, {
 *         onSuccess: () => {
 *           console.log('Bookmark deleted successfully');
 *         }
 *       });
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleDelete} disabled={isPending}>
 *         {isPending ? 'Deleting...' : 'Delete'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useDeleteBookmark() {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, Error, string>({
    mutationFn: async (bookmarkId: string) => {
      return await bookmarksService.delete(bookmarkId);
    },
    onSuccess: () => {
      // Invalidate and refetch bookmarks, count, and tags queries
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks-count'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error: Error) => {
      // Log error for debugging
      console.error('Failed to delete bookmark:', error);
    },
  });
}
