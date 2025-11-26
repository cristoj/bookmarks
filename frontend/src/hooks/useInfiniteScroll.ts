/**
 * useInfiniteScroll Hook
 *
 * Custom React hook that implements infinite scrolling using Intersection Observer API.
 * Automatically fetches the next page when the observer element becomes visible.
 */

import { useEffect, useRef } from 'react';

/**
 * Hook for implementing infinite scroll functionality
 *
 * Uses the Intersection Observer API to detect when a target element
 * becomes visible in the viewport and triggers the fetchNextPage callback.
 * Ideal for implementing "load more" functionality without pagination buttons.
 *
 * @param fetchNextPage - Callback function to fetch the next page of data
 * @param hasNextPage - Boolean indicating if there are more pages to load
 * @param threshold - Visibility threshold (0-1) at which to trigger fetch (default: 0.5)
 * @returns Ref object to attach to the observer element
 *
 * @example
 * ```tsx
 * function BookmarkList() {
 *   const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
 *     queryKey: ['bookmarks'],
 *     queryFn: fetchBookmarks,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *   });
 *
 *   const observerRef = useInfiniteScroll(fetchNextPage, hasNextPage);
 *
 *   return (
 *     <div>
 *       {data?.pages.map((page) =>
 *         page.items.map((item) => <BookmarkCard key={item.id} bookmark={item} />)
 *       )}
 *       <div ref={observerRef} />
 *       {isFetchingNextPage && <p>Loading more...</p>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom threshold
 * function InfiniteList() {
 *   const { fetchNextPage, hasNextPage } = useInfiniteQuery(...);
 *
 *   // Trigger when 75% of the element is visible
 *   const observerRef = useInfiniteScroll(fetchNextPage, hasNextPage, 0.75);
 *
 *   return (
 *     <div>
 *       {/* ... list items ... *\/}
 *       <div ref={observerRef} className="h-20" />
 *     </div>
 *   );
 * }
 * ```
 */
export function useInfiniteScroll(
  fetchNextPage: () => void,
  hasNextPage: boolean = false,
  threshold: number = 0.5
): React.RefObject<HTMLDivElement> {
  const observerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const currentElement = observerRef.current;

    // Don't set up observer if there's no element or no more pages
    if (!currentElement || !hasNextPage) {
      return;
    }

    // Create Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        // Check if the element is intersecting (visible)
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      {
        // Trigger when threshold% of the element is visible
        threshold,
        // Use the viewport as the root
        root: null,
        // No margin around the root
        rootMargin: '0px',
      }
    );

    // Start observing the element
    observer.observe(currentElement);

    // Cleanup: disconnect observer when component unmounts or dependencies change
    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, threshold]);

  return observerRef;
}

export default useInfiniteScroll;
