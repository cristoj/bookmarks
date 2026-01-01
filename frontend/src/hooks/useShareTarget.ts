import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Shared data interface from PWA Share Target API
 */
export interface SharedData {
  url: string;
  title: string;
  text?: string;
}

/**
 * Hook to handle PWA Share Target API
 *
 * Detects when the app is opened via Share Target (from mobile share menu)
 * and extracts the shared URL, title, and text from URL params.
 *
 * The service worker redirects to /?share=true&url=...&title=...&text=...
 * This hook detects those params, extracts the data, and clears the URL.
 *
 * @returns Object with shared data and loading state
 *
 * @example
 * ```tsx
 * function Home() {
 *   const { sharedData, isSharing } = useShareTarget();
 *
 *   useEffect(() => {
 *     if (sharedData) {
 *       // Open modal with pre-filled data
 *       openCreateModal(sharedData);
 *     }
 *   }, [sharedData]);
 * }
 * ```
 */
export function useShareTarget() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    // Check if this is a share target invocation
    const isShare = searchParams.get('share') === 'true';

    if (isShare) {
      setIsSharing(true);

      // Extract shared data from URL params
      const url = searchParams.get('url') || '';
      const title = searchParams.get('title') || '';
      const text = searchParams.get('text') || '';

      // Only set shared data if we have at least a URL
      if (url) {
        const data = {
          url,
          title: title || url, // Fallback to URL if no title
          text: text || undefined,
        };

        setSharedData(data);

        // Clean up URL params to avoid re-triggering on refresh
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('share');
        newParams.delete('url');
        newParams.delete('title');
        newParams.delete('text');

        // Update URL without the share params
        setSearchParams(newParams, { replace: true });
      } else {
        console.warn('[useShareTarget] No URL found in share params');
      }

      setIsSharing(false);
    }
  }, [searchParams, setSearchParams]);

  /**
   * Clear shared data (call after handling it)
   */
  const clearSharedData = () => {
    setSharedData(null);
  };

  return {
    sharedData,
    isSharing,
    clearSharedData,
  };
}
