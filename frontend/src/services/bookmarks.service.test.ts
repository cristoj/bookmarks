/**
 * Tests for bookmarks.service.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import bookmarksService, {
  create,
  getAll,
  update,
  deleteBookmark,
  getTags,
  BookmarkServiceError,
  type BookmarkData,
  type BookmarkFilters,
} from './bookmarks.service';
import { httpsCallable } from 'firebase/functions';

// Mock Firebase modules
vi.mock('firebase/functions');
vi.mock('./firebase', () => ({
  functions: {},
}));

describe('BookmarksService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a bookmark successfully', async () => {
      const mockBookmarkData: BookmarkData = {
        url: 'https://example.com',
        title: 'Example Site',
        description: 'A great example',
        tags: ['example', 'web'],
      };

      const mockResponse = {
        id: 'bookmark-123',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...mockBookmarkData,
      };

      const mockCallable = vi.fn().mockResolvedValue({ data: mockResponse });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await create(mockBookmarkData);

      expect(httpsCallable).toHaveBeenCalledWith({}, 'createBookmark');
      expect(mockCallable).toHaveBeenCalledWith(mockBookmarkData);
      expect(result).toEqual(mockResponse);
    });

    it('should throw BookmarkServiceError on failure', async () => {
      const mockBookmarkData: BookmarkData = {
        url: 'https://example.com',
        title: 'Example Site',
      };

      const mockError = {
        message: 'Invalid URL',
        code: 'invalid-argument',
      };

      const mockCallable = vi.fn().mockRejectedValue(mockError);
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      await expect(create(mockBookmarkData)).rejects.toThrow(
        BookmarkServiceError
      );
      await expect(create(mockBookmarkData)).rejects.toThrow('Invalid URL');
    });

    it('should handle missing optional fields', async () => {
      const mockBookmarkData: BookmarkData = {
        url: 'https://example.com',
        title: 'Example Site',
      };

      const mockResponse = {
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

      const mockCallable = vi.fn().mockResolvedValue({ data: mockResponse });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await create(mockBookmarkData);

      expect(result.tags).toEqual([]);
      expect(result.description).toBe('');
    });
  });

  describe('getAll', () => {
    it('should get bookmarks without filters', async () => {
      const mockResponse = {
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

      const mockCallable = vi.fn().mockResolvedValue({ data: mockResponse });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await getAll();

      expect(httpsCallable).toHaveBeenCalledWith({}, 'getBookmarks');
      expect(mockCallable).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(1);
    });

    it('should get bookmarks with filters', async () => {
      const filters: BookmarkFilters = {
        limit: 20,
        tags: ['javascript', 'react'],
        search: 'tutorial',
      };

      const mockResponse = {
        data: [],
        lastDocId: null,
        hasMore: false,
      };

      const mockCallable = vi.fn().mockResolvedValue({ data: mockResponse });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await getAll(filters);

      expect(mockCallable).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockResponse);
    });

    it('should handle pagination', async () => {
      const filters: BookmarkFilters = {
        limit: 10,
        lastDocId: 'bookmark-10',
      };

      const mockResponse = {
        data: [
          {
            id: 'bookmark-11',
            url: 'https://example11.com',
            title: 'Example 11',
            description: '',
            tags: [],
            folderId: null,
            screenshotUrl: null,
            screenshotStatus: 'completed',
            userId: 'user-123',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        lastDocId: 'bookmark-11',
        hasMore: true,
      };

      const mockCallable = vi.fn().mockResolvedValue({ data: mockResponse });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await getAll(filters);

      expect(result.hasMore).toBe(true);
      expect(result.lastDocId).toBe('bookmark-11');
    });

    it('should throw BookmarkServiceError on failure', async () => {
      const mockError = {
        message: 'Unauthenticated',
        code: 'unauthenticated',
      };

      const mockCallable = vi.fn().mockRejectedValue(mockError);
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      await expect(getAll()).rejects.toThrow(BookmarkServiceError);
      await expect(getAll()).rejects.toThrow('Unauthenticated');
    });
  });

  describe('update', () => {
    it('should update bookmark successfully', async () => {
      const bookmarkId = 'bookmark-123';
      const updateData = {
        title: 'Updated Title',
        tags: ['updated', 'tags'],
      };

      const mockResponse = {
        success: true,
        message: 'Bookmark actualizado correctamente',
      };

      const mockCallable = vi.fn().mockResolvedValue({ data: mockResponse });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await update(bookmarkId, updateData);

      expect(httpsCallable).toHaveBeenCalledWith({}, 'updateBookmark');
      expect(mockCallable).toHaveBeenCalledWith({
        bookmarkId,
        ...updateData,
      });
      expect(result.success).toBe(true);
    });

    it('should update only specified fields', async () => {
      const bookmarkId = 'bookmark-123';
      const updateData = {
        title: 'Only Title Updated',
      };

      const mockResponse = {
        success: true,
      };

      const mockCallable = vi.fn().mockResolvedValue({ data: mockResponse });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      await update(bookmarkId, updateData);

      expect(mockCallable).toHaveBeenCalledWith({
        bookmarkId,
        title: 'Only Title Updated',
      });
    });

    it('should throw BookmarkServiceError on permission denied', async () => {
      const bookmarkId = 'bookmark-123';
      const updateData = { title: 'Updated' };

      const mockError = {
        message: 'No tienes permiso para modificar este bookmark',
        code: 'permission-denied',
      };

      const mockCallable = vi.fn().mockRejectedValue(mockError);
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      await expect(update(bookmarkId, updateData)).rejects.toThrow(
        BookmarkServiceError
      );
      await expect(update(bookmarkId, updateData)).rejects.toThrow(
        'No tienes permiso'
      );
    });

    it('should throw BookmarkServiceError on not found', async () => {
      const bookmarkId = 'non-existent';
      const updateData = { title: 'Updated' };

      const mockError = {
        message: 'El bookmark no existe',
        code: 'not-found',
      };

      const mockCallable = vi.fn().mockRejectedValue(mockError);
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      await expect(update(bookmarkId, updateData)).rejects.toThrow(
        BookmarkServiceError
      );
    });
  });

  describe('delete', () => {
    it('should delete bookmark successfully', async () => {
      const bookmarkId = 'bookmark-123';

      const mockResponse = {
        success: true,
        message: 'Bookmark eliminado correctamente',
      };

      const mockCallable = vi.fn().mockResolvedValue({ data: mockResponse });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await deleteBookmark(bookmarkId);

      expect(httpsCallable).toHaveBeenCalledWith({}, 'deleteBookmark');
      expect(mockCallable).toHaveBeenCalledWith({ bookmarkId });
      expect(result.success).toBe(true);
    });

    it('should throw BookmarkServiceError on permission denied', async () => {
      const bookmarkId = 'bookmark-123';

      const mockError = {
        message: 'No tienes permiso para eliminar este bookmark',
        code: 'permission-denied',
      };

      const mockCallable = vi.fn().mockRejectedValue(mockError);
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      await expect(deleteBookmark(bookmarkId)).rejects.toThrow(
        BookmarkServiceError
      );
      await expect(deleteBookmark(bookmarkId)).rejects.toThrow(
        'No tienes permiso'
      );
    });

    it('should throw BookmarkServiceError on not found', async () => {
      const bookmarkId = 'non-existent';

      const mockError = {
        message: 'El bookmark no existe',
        code: 'not-found',
      };

      const mockCallable = vi.fn().mockRejectedValue(mockError);
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      await expect(deleteBookmark(bookmarkId)).rejects.toThrow(
        BookmarkServiceError
      );
    });
  });

  describe('getTags', () => {
    it('should get tags successfully', async () => {
      const mockResponse = {
        tags: [
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
        ],
        total: 3,
      };

      const mockCallable = vi.fn().mockResolvedValue({ data: mockResponse });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await getTags();

      expect(httpsCallable).toHaveBeenCalledWith({}, 'getTags');
      expect(mockCallable).toHaveBeenCalled();
      expect(result).toEqual(mockResponse.tags);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no tags exist', async () => {
      const mockResponse = {
        tags: [],
        total: 0,
      };

      const mockCallable = vi.fn().mockResolvedValue({ data: mockResponse });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await getTags();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw BookmarkServiceError on failure', async () => {
      const mockError = {
        message: 'Unauthenticated',
        code: 'unauthenticated',
      };

      const mockCallable = vi.fn().mockRejectedValue(mockError);
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      await expect(getTags()).rejects.toThrow(BookmarkServiceError);
      await expect(getTags()).rejects.toThrow('Unauthenticated');
    });

    it('should handle tags sorted by count', async () => {
      const mockResponse = {
        tags: [
          { name: 'popular', count: 100, updatedAt: new Date().toISOString() },
          { name: 'medium', count: 50, updatedAt: new Date().toISOString() },
          { name: 'rare', count: 5, updatedAt: new Date().toISOString() },
        ],
        total: 3,
      };

      const mockCallable = vi.fn().mockResolvedValue({ data: mockResponse });
      vi.mocked(httpsCallable).mockReturnValue(mockCallable as any);

      const result = await getTags();

      // Verificar que están ordenados por count (descendente)
      expect(result[0].count).toBeGreaterThan(result[1].count);
      expect(result[1].count).toBeGreaterThan(result[2].count);
    });
  });

  describe('default export', () => {
    it('should export all service functions', () => {
      expect(bookmarksService.create).toBeDefined();
      expect(bookmarksService.getAll).toBeDefined();
      expect(bookmarksService.update).toBeDefined();
      expect(bookmarksService.delete).toBeDefined();
      expect(bookmarksService.getTags).toBeDefined();
    });

    it('should have correct function references', () => {
      expect(bookmarksService.create).toBe(create);
      expect(bookmarksService.getAll).toBe(getAll);
      expect(bookmarksService.update).toBe(update);
      expect(bookmarksService.delete).toBe(deleteBookmark);
      expect(bookmarksService.getTags).toBe(getTags);
    });
  });

  describe('BookmarkServiceError', () => {
    it('should create error with message, code, and details', () => {
      const error = new BookmarkServiceError(
        'Test error',
        'test-code',
        { detail: 'test' }
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('test-code');
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.name).toBe('BookmarkServiceError');
    });

    it('should create error with only message', () => {
      const error = new BookmarkServiceError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
    });

    it('should be instanceof Error', () => {
      const error = new BookmarkServiceError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(BookmarkServiceError);
    });
  });
});
