/**
 * React Query Client Configuration
 *
 * Centralized configuration for React Query with optimized defaults.
 * Used to manage server state caching, refetching, and error handling.
 */

import { QueryClient, type DefaultOptions } from '@tanstack/react-query';

/**
 * Default options for all queries and mutations
 *
 * Query Options:
 * - staleTime: Time before data is considered stale (5 minutes)
 * - cacheTime: Time before inactive queries are garbage collected (10 minutes)
 * - retry: Number of retry attempts for failed queries
 * - refetchOnWindowFocus: Refetch when window regains focus
 * - refetchOnReconnect: Refetch when internet connection is restored
 *
 * Mutation Options:
 * - retry: Number of retry attempts for failed mutations
 */
const defaultOptions: DefaultOptions = {
  queries: {
    // Time before data is considered stale and needs refetching
    // 5 minutes - good balance between freshness and performance
    staleTime: 5 * 60 * 1000,

    // Time before inactive query results are garbage collected
    // 10 minutes - keeps data in cache longer than staleTime
    gcTime: 10 * 60 * 1000,

    // Number of retries for failed queries
    // 1 retry - prevents excessive retries on network errors
    retry: 1,

    // Retry delay increases exponentially
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch when window regains focus
    // true - ensures data is fresh when user returns to app
    refetchOnWindowFocus: true,

    // Refetch when network reconnects
    // true - ensures data is fresh after network issues
    refetchOnReconnect: true,

    // Don't refetch on mount if data is still fresh
    // false - prevents unnecessary refetches
    refetchOnMount: false,
  },
  mutations: {
    // Number of retries for failed mutations
    // 0 - mutations should not be retried automatically
    // User should manually retry failed operations
    retry: 0,

    // Retry delay for mutations (if retry > 0)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
};

/**
 * Create and configure React Query client
 *
 * @returns Configured QueryClient instance
 *
 * @example
 * ```tsx
 * // In App.tsx or main.tsx
 * import { QueryClientProvider } from '@tanstack/react-query';
 * import { queryClient } from '@lib/queryClient';
 *
 * function App() {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       <YourApp />
 *     </QueryClientProvider>
 *   );
 * }
 * ```
 */
export const queryClient = new QueryClient({
  defaultOptions,
});

/**
 * Create a new QueryClient instance for testing
 * Each test gets a fresh client to prevent test pollution
 *
 * @returns New QueryClient instance with test-friendly config
 *
 * @example
 * ```tsx
 * // In test files
 * import { createTestQueryClient } from '@lib/queryClient';
 *
 * describe('MyComponent', () => {
 *   it('should fetch data', () => {
 *     const testClient = createTestQueryClient();
 *     render(
 *       <QueryClientProvider client={testClient}>
 *         <MyComponent />
 *       </QueryClientProvider>
 *     );
 *   });
 * });
 * ```
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
        gcTime: 0, // Clear cache immediately
        staleTime: 0, // Always fetch fresh data
      },
      mutations: {
        retry: false, // Don't retry in tests
      },
    },
  });
}

/**
 * Clear all queries from the cache
 * Useful for logout or manual cache invalidation
 *
 * @example
 * ```tsx
 * import { clearQueryCache } from '@lib/queryClient';
 *
 * async function handleLogout() {
 *   await authService.logout();
 *   clearQueryCache(); // Clear all cached data
 *   navigate('/login');
 * }
 * ```
 */
export function clearQueryCache(): void {
  queryClient.clear();
}

/**
 * Invalidate specific queries by key
 * Forces queries to refetch on next render
 *
 * @param queryKey - Query key or array of keys to invalidate
 *
 * @example
 * ```tsx
 * import { invalidateQueries } from '@lib/queryClient';
 *
 * // After creating a bookmark, invalidate bookmarks list
 * async function handleCreateBookmark(data: BookmarkData) {
 *   await createBookmark(data);
 *   invalidateQueries(['bookmarks']); // Refetch bookmarks
 * }
 * ```
 */
export function invalidateQueries(queryKey: unknown[]): Promise<void> {
  return queryClient.invalidateQueries({ queryKey });
}

export default queryClient;
