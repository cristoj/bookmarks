/**
 * useTags Hook
 *
 * Custom React Query hook for fetching tags with localStorage caching.
 * Uses a hybrid approach: loads from localStorage instantly, then refreshes from API.
 */

import { useQuery } from '@tanstack/react-query';
import bookmarksService, { type Tag } from '@services/bookmarks.service';
import { getTagsFromCache, saveTagsToCache } from '@/utils/tagsCache';

/**
 * Hook for fetching tags with localStorage cache
 *
 * Strategy:
 * 1. Immediately returns tags from localStorage (instant load)
 * 2. Fetches fresh tags from API in the background
 * 3. Updates localStorage with fresh data
 *
 * This provides instant autocomplete suggestions while keeping data fresh.
 *
 * @returns Object with tags data, loading state, and error
 *
 * @example
 * ```tsx
 * function TagCloud() {
 *   const { data: tags, isLoading, error } = useTags();
 *
 *   if (isLoading) return <div>Loading tags...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       {tags?.map((tag) => (
 *         <span key={tag.name}>
 *           {tag.name} ({tag.count})
 *         </span>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using tags for filtering
 * function TagFilter() {
 *   const { data: tags } = useTags();
 *   const [selectedTags, setSelectedTags] = useState<string[]>([]);
 *
 *   return (
 *     <div>
 *       <h3>Filter by tags:</h3>
 *       {tags?.map((tag) => (
 *         <button
 *           key={tag.name}
 *           onClick={() => {
 *             setSelectedTags((prev) =>
 *               prev.includes(tag.name)
 *                 ? prev.filter((t) => t !== tag.name)
 *                 : [...prev, tag.name]
 *             );
 *           }}
 *         >
 *           {tag.name} ({tag.count})
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTags() {
  return useQuery<Tag[], Error>({
    queryKey: ['tags'],
    queryFn: async () => {
      // Fetch fresh tags from API
      const tags = await bookmarksService.getTags();

      // Update localStorage cache
      saveTagsToCache(tags);

      return tags;
    },
    // Use cache-first strategy
    // If we have cached data, show it immediately while fetching fresh data
    initialData: () => {
      const cached = getTagsFromCache();
      return cached || undefined;
    },
    // Always fetch fresh data on mount, but show cached data first
    staleTime: 0,
    // Keep cache for 5 minutes
    gcTime: 5 * 60 * 1000,
  });
}
