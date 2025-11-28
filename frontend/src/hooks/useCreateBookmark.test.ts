/**
 * Tests for useCreateBookmark hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { useCreateBookmark } from './useCreateBookmark';
import bookmarksService from '@services/bookmarks.service';
import { createQueryWrapper, createTestQueryClient } from './test-utils';

// Mock the bookmarks service
vi.mock('@services/bookmarks.service', () => ({
  default: {
    create: vi.fn(),
  },
}));

describe('useCreateBookmark', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('should create bookmark successfully', async () => {
    const mockBookmarkData = {
      url: 'https://example.com',
      title: 'Example Site',
      description: 'A great example',
      tags: ['example', 'web'],
    };

    const mockCreatedBookmark = {
      id: 'bookmark-123',
      userId: 'user-123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      screenshotUrl: null,
      screenshotStatus: 'pending',
      folderId: null,
      ...mockBookmarkData,
    };

    vi.mocked(bookmarksService.create).mockResolvedValue(mockCreatedBookmark);

    const { result } = renderHook(() => useCreateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    expect(result.current.isPending).toBe(false);

    result.current.mutate(mockBookmarkData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCreatedBookmark);
    expect(bookmarksService.create).toHaveBeenCalledWith(mockBookmarkData);
  });

  it('should invalidate bookmarks query on success', async () => {
    const mockBookmarkData = {
      url: 'https://example.com',
      title: 'Example Site',
    };

    const mockCreatedBookmark = {
      id: 'bookmark-123',
      userId: 'user-123',
      description: '',
      tags: [],
      folderId: null,
      screenshotUrl: null,
      screenshotStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...mockBookmarkData,
    };

    vi.mocked(bookmarksService.create).mockResolvedValue(mockCreatedBookmark);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(mockBookmarkData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['bookmarks'] });
  });

  it('should handle errors', async () => {
    const mockBookmarkData = {
      url: 'https://example.com',
      title: 'Example Site',
    };

    const mockError = new Error('Failed to create bookmark');

    vi.mocked(bookmarksService.create).mockRejectedValue(mockError);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useCreateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(mockBookmarkData);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to create bookmark:',
      mockError
    );

    consoleErrorSpy.mockRestore();
  });

  it('should call onSuccess callback when provided', async () => {
    const mockBookmarkData = {
      url: 'https://example.com',
      title: 'Example Site',
    };

    const mockCreatedBookmark = {
      id: 'bookmark-123',
      userId: 'user-123',
      description: '',
      tags: [],
      folderId: null,
      screenshotUrl: null,
      screenshotStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...mockBookmarkData,
    };

    vi.mocked(bookmarksService.create).mockResolvedValue(mockCreatedBookmark);

    const onSuccess = vi.fn();

    const { result } = renderHook(() => useCreateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(mockBookmarkData, { onSuccess });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledWith(
      mockCreatedBookmark,
      mockBookmarkData,
      undefined,
      expect.objectContaining({ client: queryClient })
    );
  });

  it('should call onError callback when provided', async () => {
    const mockBookmarkData = {
      url: 'https://example.com',
      title: 'Example Site',
    };

    const mockError = new Error('Failed to create bookmark');

    vi.mocked(bookmarksService.create).mockRejectedValue(mockError);

    const onError = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useCreateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(mockBookmarkData, { onError });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith(
      mockError,
      mockBookmarkData,
      undefined,
      expect.objectContaining({ client: queryClient })
    );

    consoleErrorSpy.mockRestore();
  });

  it('should reset mutation state', async () => {
    const mockBookmarkData = {
      url: 'https://example.com',
      title: 'Example Site',
    };

    const mockCreatedBookmark = {
      id: 'bookmark-123',
      userId: 'user-123',
      description: '',
      tags: [],
      folderId: null,
      screenshotUrl: null,
      screenshotStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...mockBookmarkData,
    };

    vi.mocked(bookmarksService.create).mockResolvedValue(mockCreatedBookmark);

    const { result } = renderHook(() => useCreateBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(mockBookmarkData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCreatedBookmark);

    // Reset the mutation
    result.current.reset();

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });

    expect(result.current.isSuccess).toBe(false);
  });
});
