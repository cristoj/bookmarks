/**
 * useTags Hook
 *
 * Custom React Query hook for fetching tags.
 * Uses useQuery with caching to minimize API calls.
 */

import { useQuery } from '@tanstack/react-query';
import bookmarksService, { type Tag } from '@services/bookmarks.service';

/**
 * Hook for fetching tags
 *
 * Uses React Query's useQuery to fetch tags with 5 minutes of caching.
 * Tags are ordered by popularity (count desc) and limited to 100 results.
 * The cache helps reduce API calls since tags don't change frequently.
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
      return await bookmarksService.getTags();
    },
    // Cache tags for 5 minutes (300000ms)
    // Tags don't change very frequently, so we can cache them
    staleTime: 5 * 60 * 1000,
  });
}
