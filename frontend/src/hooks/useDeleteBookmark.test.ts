/**
 * Tests for useDeleteBookmark hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { useDeleteBookmark } from './useDeleteBookmark';
import bookmarksService from '@services/bookmarks.service';
import { createQueryWrapper, createTestQueryClient } from './test-utils';

// Mock the bookmarks service
vi.mock('@services/bookmarks.service', () => ({
  default: {
    delete: vi.fn(),
  },
}));

describe('useDeleteBookmark', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('should delete bookmark successfully', async () => {
    const bookmarkId = 'bookmark-123';

    const mockResponse = {
      success: true,
      message: 'Bookmark eliminado correctamente',
    };

    vi.mocked(bookmarksService.delete).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDeleteBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    expect(result.current.isPending).toBe(false);

    result.current.mutate(bookmarkId);

    expect(result.current.isPending).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(bookmarksService.delete).toHaveBeenCalledWith(bookmarkId);
  });

  it('should invalidate bookmarks query on success', async () => {
    const bookmarkId = 'bookmark-123';

    const mockResponse = {
      success: true,
    };

    vi.mocked(bookmarksService.delete).mockResolvedValue(mockResponse);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(bookmarkId);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['bookmarks'] });
  });

  it('should handle errors', async () => {
    const bookmarkId = 'bookmark-123';

    const mockError = new Error('No tienes permiso para eliminar este bookmark');

    vi.mocked(bookmarksService.delete).mockRejectedValue(mockError);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useDeleteBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(bookmarkId);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to delete bookmark:',
      mockError
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle not found error', async () => {
    const bookmarkId = 'non-existent';

    const mockError = new Error('El bookmark no existe');

    vi.mocked(bookmarksService.delete).mockRejectedValue(mockError);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useDeleteBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(bookmarkId);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);

    consoleErrorSpy.mockRestore();
  });

  it('should call onSuccess callback when provided', async () => {
    const bookmarkId = 'bookmark-123';

    const mockResponse = {
      success: true,
    };

    vi.mocked(bookmarksService.delete).mockResolvedValue(mockResponse);

    const onSuccess = vi.fn();

    const { result } = renderHook(() => useDeleteBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(bookmarkId, { onSuccess });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledWith(mockResponse, bookmarkId, undefined);
  });

  it('should call onError callback when provided', async () => {
    const bookmarkId = 'bookmark-123';

    const mockError = new Error('Failed to delete');

    vi.mocked(bookmarksService.delete).mockRejectedValue(mockError);

    const onError = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useDeleteBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(bookmarkId, { onError });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith(mockError, bookmarkId, undefined);

    consoleErrorSpy.mockRestore();
  });

  it('should reset mutation state', async () => {
    const bookmarkId = 'bookmark-123';

    const mockResponse = {
      success: true,
    };

    vi.mocked(bookmarksService.delete).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDeleteBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    result.current.mutate(bookmarkId);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);

    // Reset the mutation
    result.current.reset();

    expect(result.current.data).toBeUndefined();
    expect(result.current.isSuccess).toBe(false);
  });

  it('should handle multiple consecutive deletions', async () => {
    const mockResponse = {
      success: true,
    };

    vi.mocked(bookmarksService.delete).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useDeleteBookmark(), {
      wrapper: createQueryWrapper(queryClient),
    });

    // First deletion
    result.current.mutate('bookmark-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(bookmarksService.delete).toHaveBeenCalledWith('bookmark-1');

    // Reset for second deletion
    result.current.reset();

    // Second deletion
    result.current.mutate('bookmark-2');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(bookmarksService.delete).toHaveBeenCalledWith('bookmark-2');
    expect(bookmarksService.delete).toHaveBeenCalledTimes(2);
  });
});
