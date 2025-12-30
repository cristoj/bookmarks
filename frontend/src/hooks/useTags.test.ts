/**
 * Tests for useTags hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { useTags } from './useTags';
import bookmarksService from '@services/bookmarks.service';
import { createQueryWrapper, createTestQueryClient } from './test-utils';
import * as tagsCache from '@/utils/tagsCache';

// Mock the bookmarks service
vi.mock('@services/bookmarks.service', () => ({
  default: {
    getTags: vi.fn(),
  },
}));

// Mock the tagsCache utilities
vi.mock('@/utils/tagsCache', () => ({
  getTagsFromCache: vi.fn(),
  saveTagsToCache: vi.fn(),
  addTagToCache: vi.fn(),
  addTagsToCache: vi.fn(),
  removeTagFromCache: vi.fn(),
  clearTagsCache: vi.fn(),
  getCacheTimestamp: vi.fn(),
  isCacheStale: vi.fn(),
}));

describe('useTags', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    // Reset localStorage mock
    vi.mocked(tagsCache.getTagsFromCache).mockReturnValue(null);
  });

  it('should fetch tags successfully', async () => {
    const mockTags = [
      {
        name: 'javascript',
        count: 50,
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'react',
        count: 30,
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'typescript',
        count: 10,
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(bookmarksService.getTags).mockResolvedValue(mockTags);

    const { result } = renderHook(() => useTags(), {
      wrapper: createQueryWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTags);
    expect(bookmarksService.getTags).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no tags exist', async () => {
    const mockTags: never[] = [];

    vi.mocked(bookmarksService.getTags).mockResolvedValue(mockTags);

    const { result } = renderHook(() => useTags(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.data).toHaveLength(0);
  });

  it('should handle errors', async () => {
    const mockError = new Error('Failed to fetch tags');

    vi.mocked(bookmarksService.getTags).mockRejectedValue(mockError);

    const { result } = renderHook(() => useTags(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('should save tags to localStorage after fetching', async () => {
    const mockTags = [
      {
        name: 'javascript',
        count: 50,
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(bookmarksService.getTags).mockResolvedValue(mockTags);

    const { result } = renderHook(() => useTags(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should fetch from API
    expect(bookmarksService.getTags).toHaveBeenCalledTimes(1);

    // Should save to localStorage
    expect(tagsCache.saveTagsToCache).toHaveBeenCalledWith(mockTags);
  });

  it('should use localStorage cache as initial data', async () => {
    const cachedTags = [
      {
        name: 'cached-tag',
        count: 25,
        updatedAt: new Date().toISOString(),
      },
    ];

    const freshTags = [
      {
        name: 'fresh-tag',
        count: 30,
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(tagsCache.getTagsFromCache).mockReturnValue(cachedTags);
    vi.mocked(bookmarksService.getTags).mockResolvedValue(freshTags);

    const { result } = renderHook(() => useTags(), {
      wrapper: createQueryWrapper(queryClient),
    });

    // Should immediately have cached data
    expect(result.current.data).toEqual(cachedTags);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // After fetch, should have fresh data
    expect(result.current.data).toEqual(freshTags);

    // Should have fetched from API despite having cache
    expect(bookmarksService.getTags).toHaveBeenCalledTimes(1);
  });

  it('should return tags ordered by count', async () => {
    const mockTags = [
      {
        name: 'popular',
        count: 100,
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'medium',
        count: 50,
        updatedAt: new Date().toISOString(),
      },
      {
        name: 'rare',
        count: 5,
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(bookmarksService.getTags).mockResolvedValue(mockTags);

    const { result } = renderHook(() => useTags(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const tags = result.current.data;
    expect(tags).toHaveLength(3);

    // Verify order (should be sorted by count desc)
    expect(tags![0].count).toBeGreaterThanOrEqual(tags![1].count);
    expect(tags![1].count).toBeGreaterThanOrEqual(tags![2].count);
  });

  it('should refetch when manually invalidated', async () => {
    const mockTags = [
      {
        name: 'javascript',
        count: 50,
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(bookmarksService.getTags).mockResolvedValue(mockTags);

    const { result } = renderHook(() => useTags(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(bookmarksService.getTags).toHaveBeenCalledTimes(1);

    // Invalidate the query
    await queryClient.invalidateQueries({ queryKey: ['tags'] });

    await waitFor(() => {
      expect(bookmarksService.getTags).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle refetch manually', async () => {
    const mockTags = [
      {
        name: 'javascript',
        count: 50,
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(bookmarksService.getTags).mockResolvedValue(mockTags);

    const { result } = renderHook(() => useTags(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(bookmarksService.getTags).toHaveBeenCalledTimes(1);

    // Manually refetch
    result.current.refetch();

    await waitFor(() => {
      expect(bookmarksService.getTags).toHaveBeenCalledTimes(2);
    });
  });

  it('should have correct query key', async () => {
    const mockTags = [
      {
        name: 'javascript',
        count: 50,
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(bookmarksService.getTags).mockResolvedValue(mockTags);

    renderHook(() => useTags(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => {
      const queryState = queryClient.getQueryState(['tags']);
      expect(queryState).toBeDefined();
      expect(queryState?.status).toBe('success');
    });
  });

  it('should include all tag properties', async () => {
    const mockTags = [
      {
        name: 'javascript',
        count: 50,
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    vi.mocked(bookmarksService.getTags).mockResolvedValue(mockTags);

    const { result } = renderHook(() => useTags(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const tag = result.current.data![0];
    expect(tag).toHaveProperty('name');
    expect(tag).toHaveProperty('count');
    expect(tag).toHaveProperty('updatedAt');
    expect(typeof tag.name).toBe('string');
    expect(typeof tag.count).toBe('number');
    expect(typeof tag.updatedAt).toBe('string');
  });
});
