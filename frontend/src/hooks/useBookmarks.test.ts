/**
 * Tests for useBookmarks hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { useBookmarks } from './useBookmarks';
import bookmarksService from '@services/bookmarks.service';
import { createQueryWrapper, createTestQueryClient } from './test-utils';

// Mock the bookmarks service
vi.mock('@services/bookmarks.service', () => ({
  default: {
    getAll: vi.fn(),
  },
}));

describe('useBookmarks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('should fetch bookmarks successfully', async () => {
    const mockData = {
      data: [
        {
          id: 'bookmark-1',
          url: 'https://example1.com',
          title: 'Example 1',
          description: 'First example',
          tags: ['tag1'],
          folderId: null,
          screenshotUrl: null,
          screenshotStatus: 'pending',
          userId: 'user-123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      lastDocId: 'bookmark-1',
      hasMore: false,
    };

    vi.mocked(bookmarksService.getAll).mockResolvedValue(mockData);

    const { result } = renderHook(() => useBookmarks(), {
      wrapper: createQueryWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.data?.pages[0]).toEqual(mockData);
    expect(bookmarksService.getAll).toHaveBeenCalledWith({
      lastDocId: undefined,
    });
  });

  it('should apply filters when provided', async () => {
    const mockData = {
      data: [],
      lastDocId: null,
      hasMore: false,
    };

    const filters = {
      tags: ['javascript', 'react'],
      search: 'tutorial',
      limit: 10,
    };

    vi.mocked(bookmarksService.getAll).mockResolvedValue(mockData);

    const { result } = renderHook(() => useBookmarks(filters), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(bookmarksService.getAll).toHaveBeenCalledWith({
      ...filters,
      lastDocId: undefined,
    });
  });

  it('should handle pagination correctly', async () => {
    const firstPageData = {
      data: [
        {
          id: 'bookmark-1',
          url: 'https://example1.com',
          title: 'Example 1',
          description: '',
          tags: [],
          folderId: null,
          screenshotUrl: null,
          screenshotStatus: 'pending',
          userId: 'user-123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      lastDocId: 'bookmark-1',
      hasMore: true,
    };

    const secondPageData = {
      data: [
        {
          id: 'bookmark-2',
          url: 'https://example2.com',
          title: 'Example 2',
          description: '',
          tags: [],
          folderId: null,
          screenshotUrl: null,
          screenshotStatus: 'pending',
          userId: 'user-123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      lastDocId: 'bookmark-2',
      hasMore: false,
    };

    vi.mocked(bookmarksService.getAll)
      .mockResolvedValueOnce(firstPageData)
      .mockResolvedValueOnce(secondPageData);

    const { result } = renderHook(() => useBookmarks({ limit: 1 }), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.data?.pages).toHaveLength(1);

    // Fetch next page
    result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
    });

    expect(result.current.hasNextPage).toBe(false);
    expect(bookmarksService.getAll).toHaveBeenCalledTimes(2);
    expect(bookmarksService.getAll).toHaveBeenLastCalledWith({
      limit: 1,
      lastDocId: 'bookmark-1',
    });
  });

  it('should not have next page when hasMore is false', async () => {
    const mockData = {
      data: [],
      lastDocId: null,
      hasMore: false,
    };

    vi.mocked(bookmarksService.getAll).mockResolvedValue(mockData);

    const { result } = renderHook(() => useBookmarks(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it('should handle errors', async () => {
    const mockError = new Error('Failed to fetch bookmarks');

    vi.mocked(bookmarksService.getAll).mockRejectedValue(mockError);

    const { result } = renderHook(() => useBookmarks(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('should use different query keys for different filters', async () => {
    const mockData = {
      data: [],
      lastDocId: null,
      hasMore: false,
    };

    vi.mocked(bookmarksService.getAll).mockResolvedValue(mockData);

    const filters1 = { tags: ['tag1'] };
    const filters2 = { tags: ['tag2'] };

    const { result: result1 } = renderHook(() => useBookmarks(filters1), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    const { result: result2 } = renderHook(() => useBookmarks(filters2), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result2.current.isSuccess).toBe(true);
    });

    // Both queries should have been called
    expect(bookmarksService.getAll).toHaveBeenCalledTimes(2);
  });

  it('should flatten all pages data', async () => {
    const firstPageData = {
      data: [{ id: 'bookmark-1' }],
      lastDocId: 'bookmark-1',
      hasMore: true,
    };

    const secondPageData = {
      data: [{ id: 'bookmark-2' }],
      lastDocId: 'bookmark-2',
      hasMore: false,
    };

    vi.mocked(bookmarksService.getAll)
      .mockResolvedValueOnce(firstPageData as any)
      .mockResolvedValueOnce(secondPageData as any);

    const { result } = renderHook(() => useBookmarks(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
    });

    // All bookmarks should be accessible across pages
    const allBookmarkIds = result.current.data?.pages.flatMap((page: any) =>
      page.data.map((b: any) => b.id)
    );
    expect(allBookmarkIds).toEqual(['bookmark-1', 'bookmark-2']);
  });
});
