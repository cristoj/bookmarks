/**
 * Tests for useUpdateBookmark hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { useUpdateBookmark } from './useUpdateBookmark';
import bookmarksService from '@services/bookmarks.service';
import { createQueryWrapper, createTestQueryClient } from './test-utils';
import * as tagsCache from '@/utils/tagsCache';

// Mock the bookmarks service
vi.mock('@services/bookmarks.service', () => ({
  default: {
    update: vi.fn(),
  },
}));

// Mock the storage service
vi.mock('@services/storage.service');

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

describe('useUpdateBookmark', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('should update bookmark successfully', async () => {
    const updateParams = {
      bookmarkId: 'bookmark-123',
      data: {
        title: 'Updated Title',
        tags: ['updated', 'tags'],
      },
    };

    const mockResponse = {
      success: true,
      message: 'Bookmark actualizado correctamente',
    };

    vi.mocked(bookmarksService.update).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    expect(result.current.isPending).toBe(false);

    result.current.mutate(updateParams);

    expect(result.current.isPending).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(bookmarksService.update).toHaveBeenCalledWith(
      updateParams.bookmarkId,
      updateParams.data
    );
  });

  it('should invalidate bookmarks queries but not refetch tags when tags are unchanged', async () => {
    const updateParams = {
      bookmarkId: 'bookmark-123',
      data: {
        title: 'Updated Title',
      },
    };

    const mockResponse = {
      success: true,
    };

    vi.mocked(bookmarksService.update).mockResolvedValue(mockResponse);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(updateParams);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['bookmarks'] });
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['tags'] });
  });

  it('should apply the tag diff locally without refetching tags', async () => {
    queryClient.setQueryData(['tags'], [
      { name: 'react', count: 2, updatedAt: 'x' },
      { name: 'old', count: 1, updatedAt: 'x' },
    ]);
    queryClient.setQueryData(['bookmarks', undefined], {
      pages: [{ data: [{ id: 'bookmark-123', tags: ['react', 'old'] }], lastDocId: null, hasMore: false }],
      pageParams: [undefined],
    });
    vi.mocked(bookmarksService.update).mockResolvedValue({ success: true });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate({ bookmarkId: 'bookmark-123', data: { tags: ['react', 'vite'] } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const tags = queryClient.getQueryData<Array<{ name: string; count: number }>>(['tags']);
    expect(tags?.find((t) => t.name === 'react')?.count).toBe(2);
    expect(tags?.find((t) => t.name === 'vite')?.count).toBe(1);
    expect(tags?.find((t) => t.name === 'old')).toBeUndefined();
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['tags'] });
  });

  it('should refetch tags once when the previous tags are unknown', async () => {
    vi.mocked(bookmarksService.update).mockResolvedValue({ success: true });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate({ bookmarkId: 'not-cached', data: { tags: ['react'] } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tags'] });
  });

  it('should not add tags to cache when updating without tags', async () => {
    const updateParams = {
      bookmarkId: 'bookmark-123',
      data: {
        title: 'Updated Title',
        description: 'Updated description',
      },
    };

    const mockResponse = {
      success: true,
    };

    vi.mocked(bookmarksService.update).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(updateParams);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should NOT add tags to cache
    expect(tagsCache.addTagsToCache).not.toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    const updateParams = {
      bookmarkId: 'bookmark-123',
      data: {
        title: 'Updated Title',
      },
    };

    const mockError = new Error('No tienes permiso para modificar este bookmark');

    vi.mocked(bookmarksService.update).mockRejectedValue(mockError);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useUpdateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(updateParams);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to update bookmark:',
      mockError
    );

    consoleErrorSpy.mockRestore();
  });

  it('should update only specified fields', async () => {
    const updateParams = {
      bookmarkId: 'bookmark-123',
      data: {
        description: 'Only description updated',
      },
    };

    const mockResponse = {
      success: true,
    };

    vi.mocked(bookmarksService.update).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(updateParams);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(bookmarksService.update).toHaveBeenCalledWith('bookmark-123', {
      description: 'Only description updated',
    });
  });

  it('should call onSuccess callback when provided', async () => {
    const updateParams = {
      bookmarkId: 'bookmark-123',
      data: {
        title: 'Updated',
      },
    };

    const mockResponse = {
      success: true,
    };

    vi.mocked(bookmarksService.update).mockResolvedValue(mockResponse);

    const onSuccess = vi.fn();

    const { result } = renderHook(() => useUpdateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(updateParams, { onSuccess });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledWith(mockResponse, updateParams, undefined);
  });

  it('should call onError callback when provided', async () => {
    const updateParams = {
      bookmarkId: 'bookmark-123',
      data: {
        title: 'Updated',
      },
    };

    const mockError = new Error('Failed to update');

    vi.mocked(bookmarksService.update).mockRejectedValue(mockError);

    const onError = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useUpdateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(updateParams, { onError });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith(mockError, updateParams, undefined);

    consoleErrorSpy.mockRestore();
  });

  it('should reset mutation state', async () => {
    const updateParams = {
      bookmarkId: 'bookmark-123',
      data: {
        title: 'Updated',
      },
    };

    const mockResponse = {
      success: true,
    };

    vi.mocked(bookmarksService.update).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(updateParams);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);

    // Reset the mutation
    result.current.reset();

    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
  });
});
