/**
 * useUpdateBookmark Hook
 *
 * Custom React Query hook for updating bookmarks.
 * Uses useMutation to handle the update operation and automatically
 * invalidates the bookmarks query on success.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import bookmarksService, { type BookmarkData, type SuccessResponse } from '@services/bookmarks.service';

/**
 * Parameters for updating a bookmark
 */
export interface UpdateBookmarkParams {
  bookmarkId: string;
  data: Partial<Omit<BookmarkData, 'url'>>;
}

/**
 * Hook for updating an existing bookmark
 *
 * Uses React Query's useMutation to handle bookmark updates.
 * Automatically invalidates the 'bookmarks' query on success
 * to refresh the bookmarks list.
 *
 * @returns Object with mutation function, loading state, and error
 *
 * @example
 * ```tsx
 * function EditBookmarkForm({ bookmarkId }: { bookmarkId: string }) {
 *   const { mutate: updateBookmark, isPending, error } = useUpdateBookmark();
 *
 *   const handleSubmit = (data: Partial<BookmarkData>) => {
 *     updateBookmark(
 *       { bookmarkId, data },
 *       {
 *         onSuccess: () => {
 *           console.log('Bookmark updated successfully');
 *           // Navigate or show success message
 *         }
 *       }
 *     );
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <div>Error: {error.message}</div>}
 *       <input name="title" />
 *       <input name="description" />
 *       <button type="submit" disabled={isPending}>
 *         {isPending ? 'Updating...' : 'Update Bookmark'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useUpdateBookmark() {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, Error, UpdateBookmarkParams>({
    mutationFn: async ({ bookmarkId, data }: UpdateBookmarkParams) => {
      return await bookmarksService.update(bookmarkId, data);
    },
    onSuccess: () => {
      // Invalidate and refetch bookmarks query
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
    onError: (error: Error) => {
      // Log error for debugging
      console.error('Failed to update bookmark:', error);
    },
  });
}
