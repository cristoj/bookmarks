/**
 * useCreateBookmark Hook
 *
 * Custom React Query hook for creating bookmarks.
 * Uses useMutation to handle the create operation and automatically
 * invalidates the bookmarks query on success.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import bookmarksService, { type BookmarkData, type Bookmark, type Tag } from '@services/bookmarks.service';
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
      // Update tags cache optimistically
      if (bookmark.tags && bookmark.tags.length > 0) {
        // Add tags to localStorage cache
        addTagsToCache(bookmark.tags);

        // Update React Query cache optimistically for immediate UI update
        queryClient.setQueryData<Tag[]>(['tags'], (oldTags) => {
          if (!oldTags) return oldTags;

          // Create a copy of the tags array
          const updatedTags = [...oldTags];

          // Process each tag from the new bookmark
          bookmark.tags?.forEach((tagName) => {
            const existingIndex = updatedTags.findIndex(t => t.name === tagName);

            if (existingIndex >= 0) {
              // Tag exists, increment count
              updatedTags[existingIndex] = {
                ...updatedTags[existingIndex],
                count: updatedTags[existingIndex].count + 1,
                updatedAt: new Date().toISOString(),
              };
            } else {
              // New tag, add it
              updatedTags.push({
                name: tagName,
                count: 1,
                updatedAt: new Date().toISOString(),
              });
            }
          });

          // Sort by count descending (same as backend)
          return updatedTags.sort((a, b) => b.count - a.count);
        });
      }

      // Invalidate and refetch bookmarks, count, and tags queries
      // This will eventually sync with server data
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
