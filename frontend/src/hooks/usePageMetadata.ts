/**
 * usePageMetadata Hook
 *
 * Custom hook for fetching page metadata (title and description) from a URL.
 * Uses React Query for caching and state management.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getPageMetadata, type PageMetadata } from '../services/bookmarks.service';

/**
 * Hook for fetching page metadata from a URL
 *
 * Fetches title and description from a URL's meta tags.
 * Useful for autocompleting bookmark forms.
 *
 * Features:
 * - Automatic caching (5 minutes)
 * - Loading and error states
 * - Only fetches when URL is valid
 * - Retry on failure (2 attempts)
 *
 * @param url - The URL to fetch metadata from
 * @param options - Additional options
 * @param options.enabled - Whether to enable the query (default: true if URL is valid)
 * @returns Query result with metadata, loading state, and error
 *
 * @example
 * ```tsx
 * function BookmarkForm() {
 *   const [url, setUrl] = useState('');
 *   const { data, isLoading, error } = usePageMetadata(url);
 *
 *   useEffect(() => {
 *     if (data) {
 *       setTitle(data.title);
 *       setDescription(data.description);
 *     }
 *   }, [data]);
 *
 *   return (
 *     <form>
 *       <input value={url} onChange={(e) => setUrl(e.target.value)} />
 *       {isLoading && <p>Fetching metadata...</p>}
 *       {error && <p>Could not fetch metadata</p>}
 *     </form>
 *   );
 * }
 * ```
 */
export function usePageMetadata(
  url: string,
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<PageMetadata, Error> {
  // Validate URL format
  const isValidUrl = (urlString: string): boolean => {
    if (!urlString || typeof urlString !== 'string') return false;
    const urlPattern = /^https?:\/\/.+\..+/i;
    return urlPattern.test(urlString.trim());
  };

  const enabled = options?.enabled !== undefined
    ? options.enabled
    : isValidUrl(url);

  return useQuery<PageMetadata, Error>({
    queryKey: ['pageMetadata', url],
    queryFn: async () => {
      if (!isValidUrl(url)) {
        throw new Error('Invalid URL format');
      }
      return await getPageMetadata(url.trim());
    },
    enabled,
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Keep in cache for 10 minutes
    gcTime: 10 * 60 * 1000,
    // Retry once on failure
    retry: 1,
    // Don't refetch on window focus for this use case
    refetchOnWindowFocus: false,
  });
}

export default usePageMetadata;
