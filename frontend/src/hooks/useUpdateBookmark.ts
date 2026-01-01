/**
 * useUpdateBookmark Hook
 *
 * Custom React Query hook for updating bookmarks.
 * Uses useMutation to handle the update operation and automatically
 * invalidates the bookmarks query on success.
 * Supports optional screenshot file upload.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import bookmarksService, { type BookmarkData, type SuccessResponse } from '@services/bookmarks.service';
import storageService from '@services/storage.service';
import { addTagsToCache } from '@/utils/tagsCache';

/**
 * Parameters for updating a bookmark
 */
export interface UpdateBookmarkParams {
  bookmarkId: string;
  data: Partial<Omit<BookmarkData, 'url'>>;
  screenshotFile?: File | null;
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
    mutationFn: async ({ bookmarkId, data, screenshotFile }: UpdateBookmarkParams) => {
      let updatedData = { ...data };

      // If a screenshot file is provided, upload it first
      if (screenshotFile) {
        try {
          const screenshotUrl = await storageService.uploadScreenshot(
            screenshotFile,
            bookmarkId
          );
          updatedData.screenshotUrl = screenshotUrl;
        } catch (error) {
          console.error('Failed to upload screenshot:', error);
          throw new Error('No se pudo subir la imagen. Por favor, intenta de nuevo.');
        }
      }

      return await bookmarksService.update(bookmarkId, updatedData);
    },
    onSuccess: async (_data, variables) => {
      // Add tags to localStorage cache if they were updated
      if (variables.data.tags && variables.data.tags.length > 0) {
        addTagsToCache(variables.data.tags);
      }

      // Invalidate and refetch bookmarks, count, and tags queries
      await queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      await queryClient.invalidateQueries({ queryKey: ['bookmarks-count'] });
      await queryClient.invalidateQueries({ queryKey: ['tags'] });
      // Force refetch immediately for tags and bookmarks
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['bookmarks'] }),
        queryClient.refetchQueries({ queryKey: ['tags'] }),
      ]);
    },
    onError: (error: Error) => {
      // Log error for debugging
      console.error('Failed to update bookmark:', error);
    },
  });
}
